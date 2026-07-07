use std::time::Instant;

use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
};
use chrono::Utc;
use sqlx::Row;
use tokio::time::{Duration, sleep};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;
use uuid::Uuid;

use crate::{
    AppState,
    audit::{AuditRecord, compute_hash, verify_chain},
    auth::{AuthUser, enforce_roles, login, role_can_approve_secret},
    models::{
        AuditVerifyResponse, ClassificationLevel, LoginRequest, LoginResponse, PolicyDecision,
        ProviderName, Role, SimulationMetrics, TaskAction, TaskActionRequest, TaskRequestInput,
        TaskResponse, TaskStatus, TaskSummary,
    },
    policy::evaluate_submission_policy,
    providers::dispatch_provider,
};

#[derive(OpenApi)]
#[openapi(
    paths(auth_login, submit_task, list_tasks, task_action, verify_audit, simulate_mission_scenario),
    components(
        schemas(
            LoginRequest,
            LoginResponse,
            TaskRequestInput,
            TaskResponse,
            TaskSummary,
            TaskActionRequest,
            AuditVerifyResponse,
            SimulationMetrics,
            Role,
            TaskStatus,
            PolicyDecision,
            ProviderName,
            ClassificationLevel
        )
    ),
    tags(
        (name = "AstroTask", description = "AstroTask Secure Gateway API")
    )
)]
pub struct ApiDoc;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/auth/login", post(auth_login))
        .route("/tasks", post(submit_task).get(list_tasks))
        .route("/tasks/:id/action", post(task_action))
        .route("/audit/verify", get(verify_audit))
        .route("/simulate/mission-scenario", get(simulate_mission_scenario))
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()))
}

#[utoipa::path(
    post,
    path = "/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login success", body = LoginResponse),
        (status = 401, description = "Invalid credentials")
    )
)]
async fn auth_login(State(state): State<AppState>, Json(req): Json<LoginRequest>) -> impl IntoResponse {
    match login(req, &state.jwt_secret) {
        Ok(response) => (StatusCode::OK, Json(response)).into_response(),
        Err((status, msg)) => (status, msg).into_response(),
    }
}

#[utoipa::path(
    post,
    path = "/tasks",
    request_body = TaskRequestInput,
    responses(
        (status = 201, description = "Task submitted", body = TaskResponse),
        (status = 400, description = "Policy rejection"),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
async fn submit_task(
    State(state): State<AppState>,
    user: AuthUser,
    Json(req): Json<TaskRequestInput>,
) -> impl IntoResponse {
    let policy = evaluate_submission_policy(&user.role, &req);
    let status = decision_to_status(&policy.decision);
    let task_id = Uuid::new_v4();

    let provider_result = dispatch_provider(&task_id.to_string(), &req);
    let encrypted_payload = match state.crypto.encrypt_json(&req) {
        Ok(payload) => payload,
        Err(err) => return (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()).into_response(),
    };

    if let Err(err) = sqlx::query(
        "INSERT INTO tasks (id, created_by, status, policy_decision, provider, encrypted_payload, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(task_id)
    .bind(&user.user_id)
    .bind(format!("{:?}", status))
    .bind(format!("{:?}", policy.decision))
    .bind(format!("{:?}", provider_result.provider))
    .bind(encrypted_payload)
    .bind(Utc::now())
    .execute(&state.db)
    .await
    {
        return (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()).into_response();
    }

    if let Err(err) = append_audit_record(
        &state,
        Some(task_id),
        &user.user_id,
        "task_submitted",
        Some(policy.decision.clone()),
        Some(provider_result.provider.clone()),
    )
    .await
    {
        return (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()).into_response();
    }

    let response = TaskResponse {
        task_id,
        status,
        policy_decision: policy.decision.clone(),
        provider: provider_result.provider,
        provider_response_id: provider_result.external_id,
        provider_message: format!("{} ({})", provider_result.message, policy.reason),
    };

    let status_code = if policy.decision == PolicyDecision::Rejected {
        StatusCode::BAD_REQUEST
    } else {
        StatusCode::CREATED
    };

    (status_code, Json(response)).into_response()
}

#[utoipa::path(
    get,
    path = "/tasks",
    responses((status = 200, body = [TaskSummary])),
    security(("bearer_auth" = []))
)]
async fn list_tasks(State(state): State<AppState>, _user: AuthUser) -> impl IntoResponse {
    let records = match sqlx::query(
        "SELECT id, created_by, status, policy_decision, provider, created_at FROM tasks ORDER BY created_at DESC",
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(rows) => rows,
        Err(err) => return (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()).into_response(),
    };

    let audit_valid = verify_audit_internal(&state).await;

    let summaries: Vec<TaskSummary> = records
        .into_iter()
        .filter_map(|row| {
            Some(TaskSummary {
                task_id: row.try_get("id").ok()?,
                created_by: row.try_get("created_by").ok()?,
                status: parse_status(&row.try_get::<String, _>("status").ok()?)?,
                policy_decision: parse_decision(&row.try_get::<String, _>("policy_decision").ok()?)?,
                provider: parse_provider(&row.try_get::<String, _>("provider").ok()?)?,
                audit_status: if audit_valid { "Valid" } else { "Invalid" }.to_string(),
                created_at: row.try_get("created_at").ok()?,
            })
        })
        .collect();

    (StatusCode::OK, Json(summaries)).into_response()
}

#[utoipa::path(
    post,
    path = "/tasks/{id}/action",
    request_body = TaskActionRequest,
    responses((status = 200, body = TaskResponse), (status = 403, description = "Forbidden")),
    security(("bearer_auth" = []))
)]
async fn task_action(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    user: AuthUser,
    Json(req): Json<TaskActionRequest>,
) -> impl IntoResponse {
    if user.role == Role::MissionOperator {
        return (StatusCode::FORBIDDEN, "MissionOperator cannot approve/deny tasks").into_response();
    }

    if user.role == Role::SecurityOfficer && matches!(req.action, TaskAction::Approve) {
        return (StatusCode::FORBIDDEN, "SecurityOfficer can deny or flag only").into_response();
    }

    let row = match sqlx::query("SELECT encrypted_payload, provider FROM tasks WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await
    {
        Ok(Some(row)) => row,
        Ok(None) => return (StatusCode::NOT_FOUND, "Task not found").into_response(),
        Err(err) => return (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()).into_response(),
    };

    let encrypted_payload: String = match row.try_get("encrypted_payload") {
        Ok(v) => v,
        Err(err) => return (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()).into_response(),
    };
    let provider_str: String = row.try_get("provider").unwrap_or_else(|_| "Maxar".to_string());

    let task_payload: TaskRequestInput = match state.crypto.decrypt_json(&encrypted_payload) {
        Ok(v) => v,
        Err(err) => return (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()).into_response(),
    };

    if task_payload.classification_level == ClassificationLevel::SECRET_IL6
        && matches!(req.action, TaskAction::Approve)
        && !role_can_approve_secret(&user.role)
    {
        return (StatusCode::FORBIDDEN, "Only ISRApprover/Admin can approve SECRET_IL6").into_response();
    }

    let (status, decision) = match req.action {
        TaskAction::Approve => (TaskStatus::Approved, PolicyDecision::Approved),
        TaskAction::Deny => (TaskStatus::Rejected, PolicyDecision::Rejected),
        TaskAction::Flag => (TaskStatus::Flagged, PolicyDecision::FlaggedForReview),
    };

    if let Err(err) = sqlx::query("UPDATE tasks SET status = $1, policy_decision = $2 WHERE id = $3")
        .bind(format!("{:?}", status))
        .bind(format!("{:?}", decision))
        .bind(id)
        .execute(&state.db)
        .await
    {
        return (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()).into_response();
    }

    let provider = parse_provider(&provider_str).unwrap_or(ProviderName::Maxar);
    if let Err(err) = append_audit_record(
        &state,
        Some(id),
        &user.user_id,
        "task_action",
        Some(decision.clone()),
        Some(provider.clone()),
    )
    .await
    {
        return (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()).into_response();
    }

    (
        StatusCode::OK,
        Json(TaskResponse {
            task_id: id,
            status,
            policy_decision: decision,
            provider,
            provider_response_id: format!("ACTION-{id}"),
            provider_message: "Task action applied".to_string(),
        }),
    )
        .into_response()
}

#[utoipa::path(
    get,
    path = "/audit/verify",
    responses((status = 200, body = AuditVerifyResponse)),
    security(("bearer_auth" = []))
)]
async fn verify_audit(State(state): State<AppState>, _user: AuthUser) -> impl IntoResponse {
    let (valid, count) = verify_audit_with_count(&state).await;
    (
        StatusCode::OK,
        Json(AuditVerifyResponse {
            valid,
            records_checked: count,
        }),
    )
}

#[utoipa::path(
    get,
    path = "/simulate/mission-scenario",
    responses((status = 200, body = SimulationMetrics)),
    security(("bearer_auth" = []))
)]
async fn simulate_mission_scenario(State(state): State<AppState>, _user: AuthUser) -> impl IntoResponse {
    let scenario = vec![
        sample_request(38.8977, -77.0365, ClassificationLevel::CUI_IL5, ProviderName::Maxar),
        sample_request(30.0444, 31.2357, ClassificationLevel::SECRET_IL6, ProviderName::Umbra),
        sample_request(13.0827, 80.2707, ClassificationLevel::CUI_IL5, ProviderName::Planet),
        sample_request(95.0, 40.0, ClassificationLevel::CUI_IL5, ProviderName::ICEYE),
    ];

    let mut approved = 0usize;
    let mut rejected = 0usize;
    let mut flagged = 0usize;
    let mut total_latency = 0f64;
    let mut provider_times = Vec::new();

    for req in &scenario {
        let start = Instant::now();
        let decision = evaluate_submission_policy(&Role::MissionOperator, req).decision;
        match decision {
            PolicyDecision::Approved => approved += 1,
            PolicyDecision::Rejected => rejected += 1,
            PolicyDecision::FlaggedForReview => flagged += 1,
        }

        let provider_result = dispatch_provider("SIM", req);
        let elapsed_provider = start.elapsed().as_millis();
        provider_times.push((provider_result.provider, elapsed_provider));
        sleep(Duration::from_millis(40)).await;
        total_latency += start.elapsed().as_millis() as f64;
    }

    let audit_valid = verify_audit_internal(&state).await;
    (
        StatusCode::OK,
        Json(SimulationMetrics {
            total_requests: scenario.len(),
            approved,
            rejected,
            flagged,
            average_processing_latency_ms: total_latency / scenario.len() as f64,
            audit_ledger_verification_result: audit_valid,
            provider_response_times_ms: provider_times,
        }),
    )
}

fn sample_request(
    lat: f64,
    lon: f64,
    classification_level: ClassificationLevel,
    provider: ProviderName,
) -> TaskRequestInput {
    TaskRequestInput {
        target_latitude: lat,
        target_longitude: lon,
        area_of_interest_name: "Representative Navy AOI".to_string(),
        mission_priority: "High".to_string(),
        sensor_type: crate::models::SensorType::SAR,
        requested_time_window: "2026-07-07T12:00:00Z/2026-07-07T18:00:00Z".to_string(),
        classification_level,
        commercial_provider_preference: provider,
        mission_justification: "Representative maritime domain awareness requirement".to_string(),
    }
}

fn decision_to_status(decision: &PolicyDecision) -> TaskStatus {
    match decision {
        PolicyDecision::Approved => TaskStatus::Approved,
        PolicyDecision::Rejected => TaskStatus::Rejected,
        PolicyDecision::FlaggedForReview => TaskStatus::Flagged,
    }
}

async fn append_audit_record(
    state: &AppState,
    task_id: Option<Uuid>,
    user_id: &str,
    action: &str,
    policy_decision: Option<PolicyDecision>,
    provider: Option<ProviderName>,
) -> anyhow::Result<()> {
    let previous_hash = sqlx::query("SELECT current_hash FROM audit_ledger ORDER BY timestamp DESC LIMIT 1")
        .fetch_optional(&state.db)
        .await?
        .and_then(|row| row.try_get::<String, _>("current_hash").ok())
        .unwrap_or_else(|| "GENESIS".to_string());

    let event_id = Uuid::new_v4();
    let timestamp = Utc::now();
    let current_hash = compute_hash(
        event_id,
        task_id,
        timestamp,
        user_id,
        action,
        policy_decision.as_ref(),
        provider.as_ref(),
        &previous_hash,
    );

    sqlx::query("INSERT INTO audit_ledger (event_id, task_id, timestamp, user_id, action, policy_decision, provider, previous_hash, current_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)")
        .bind(event_id)
        .bind(task_id)
        .bind(timestamp)
        .bind(user_id)
        .bind(action)
        .bind(policy_decision.as_ref().map(|v| format!("{:?}", v)))
        .bind(provider.as_ref().map(|v| format!("{:?}", v)))
        .bind(previous_hash)
        .bind(current_hash)
        .execute(&state.db)
        .await?;

    Ok(())
}

async fn verify_audit_internal(state: &AppState) -> bool {
    verify_audit_with_count(state).await.0
}

async fn verify_audit_with_count(state: &AppState) -> (bool, usize) {
    let rows = match sqlx::query("SELECT event_id, task_id, timestamp, user_id, action, policy_decision, provider, previous_hash, current_hash FROM audit_ledger ORDER BY timestamp ASC")
        .fetch_all(&state.db)
        .await
    {
        Ok(v) => v,
        Err(_) => return (false, 0),
    };

    let mut records = Vec::new();
    for row in rows {
        let event_id: Uuid = match row.try_get("event_id") {
            Ok(v) => v,
            Err(_) => continue,
        };
        let policy_decision = row
            .try_get::<Option<String>, _>("policy_decision")
            .ok()
            .flatten()
            .and_then(|v| parse_decision(&v));
        let provider = row
            .try_get::<Option<String>, _>("provider")
            .ok()
            .flatten()
            .and_then(|v| parse_provider(&v));

        records.push(AuditRecord {
            event_id,
            task_id: row.try_get("task_id").ok(),
            timestamp: match row.try_get("timestamp") {
                Ok(v) => v,
                Err(_) => continue,
            },
            user_id: match row.try_get("user_id") {
                Ok(v) => v,
                Err(_) => continue,
            },
            action: match row.try_get("action") {
                Ok(v) => v,
                Err(_) => continue,
            },
            policy_decision,
            provider,
            previous_hash: match row.try_get("previous_hash") {
                Ok(v) => v,
                Err(_) => continue,
            },
            current_hash: match row.try_get("current_hash") {
                Ok(v) => v,
                Err(_) => continue,
            },
        });
    }

    (verify_chain(&records), records.len())
}

fn parse_status(value: &str) -> Option<TaskStatus> {
    match value {
        "Submitted" => Some(TaskStatus::Submitted),
        "Approved" => Some(TaskStatus::Approved),
        "Rejected" => Some(TaskStatus::Rejected),
        "Flagged" => Some(TaskStatus::Flagged),
        _ => None,
    }
}

fn parse_decision(value: &str) -> Option<PolicyDecision> {
    match value {
        "Approved" => Some(PolicyDecision::Approved),
        "Rejected" => Some(PolicyDecision::Rejected),
        "FlaggedForReview" => Some(PolicyDecision::FlaggedForReview),
        _ => None,
    }
}

fn parse_provider(value: &str) -> Option<ProviderName> {
    match value {
        "Maxar" => Some(ProviderName::Maxar),
        "Planet" => Some(ProviderName::Planet),
        "BlackSky" => Some(ProviderName::BlackSky),
        "Umbra" => Some(ProviderName::Umbra),
        "ICEYE" => Some(ProviderName::ICEYE),
        _ => None,
    }
}

#[allow(dead_code)]
fn _enforce_task_roles(user: &AuthUser) -> Result<(), axum::response::Response> {
    enforce_roles(
        &user.role,
        &[Role::MissionOperator, Role::ISRApprover, Role::SecurityOfficer, Role::Admin],
    )
}
