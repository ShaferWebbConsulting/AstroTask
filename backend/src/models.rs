use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum Role {
    MissionOperator,
    ISRApprover,
    SecurityOfficer,
    Admin,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, ToSchema)]
pub enum SensorType {
    EO,
    SAR,
    RF,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, ToSchema)]
#[allow(non_camel_case_types)]
pub enum ClassificationLevel {
    CUI_IL5,
    SECRET_IL6,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, ToSchema)]
pub enum PolicyDecision {
    Approved,
    Rejected,
    FlaggedForReview,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, ToSchema)]
pub enum TaskStatus {
    Submitted,
    Approved,
    Rejected,
    Flagged,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, ToSchema)]
pub enum ProviderName {
    Maxar,
    Planet,
    BlackSky,
    Umbra,
    ICEYE,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct LoginResponse {
    pub token: String,
    pub role: Role,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub role: Role,
    pub exp: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TaskRequestInput {
    pub target_latitude: f64,
    pub target_longitude: f64,
    pub area_of_interest_name: String,
    pub mission_priority: String,
    pub sensor_type: SensorType,
    pub requested_time_window: String,
    pub classification_level: ClassificationLevel,
    pub commercial_provider_preference: ProviderName,
    pub mission_justification: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PolicyResult {
    pub decision: PolicyDecision,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TaskResponse {
    pub task_id: Uuid,
    pub status: TaskStatus,
    pub policy_decision: PolicyDecision,
    pub provider: ProviderName,
    pub provider_response_id: String,
    pub provider_message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TaskSummary {
    pub task_id: Uuid,
    pub created_by: String,
    pub status: TaskStatus,
    pub policy_decision: PolicyDecision,
    pub provider: ProviderName,
    pub audit_status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum TaskAction {
    Approve,
    Deny,
    Flag,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TaskActionRequest {
    pub action: TaskAction,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct AuditVerifyResponse {
    pub valid: bool,
    pub records_checked: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SimulationMetrics {
    pub total_requests: usize,
    pub approved: usize,
    pub rejected: usize,
    pub flagged: usize,
    pub average_processing_latency_ms: f64,
    pub audit_ledger_verification_result: bool,
    pub provider_response_times_ms: Vec<(ProviderName, u128)>,
}
