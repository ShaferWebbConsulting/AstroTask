use axum::{
    extract::{FromRequestParts, State},
    http::{StatusCode, request::Parts},
    response::{IntoResponse, Response},
};
use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};

use crate::{AppState, models::{Claims, LoginRequest, LoginResponse, Role}};

#[derive(Clone)]
pub struct AuthUser {
    pub user_id: String,
    pub role: Role,
}

#[axum::async_trait]
impl FromRequestParts<AppState> for AuthUser {
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("authorization")
            .and_then(|v| v.to_str().ok())
            .ok_or_else(|| (StatusCode::UNAUTHORIZED, "Missing Authorization header").into_response())?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or_else(|| (StatusCode::UNAUTHORIZED, "Invalid authorization scheme").into_response())?;

        let claims = decode::<Claims>(
            token,
            &DecodingKey::from_secret(state.jwt_secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid token").into_response())?
        .claims;

        Ok(Self {
            user_id: claims.sub,
            role: claims.role,
        })
    }
}

pub fn login(request: LoginRequest, jwt_secret: &str) -> Result<LoginResponse, (StatusCode, String)> {
    let role = match (request.username.as_str(), request.password.as_str()) {
        ("mission_operator", "demo-password") => Role::MissionOperator,
        ("isr_approver", "demo-password") => Role::ISRApprover,
        ("security_officer", "demo-password") => Role::SecurityOfficer,
        ("admin", "demo-password") => Role::Admin,
        _ => return Err((StatusCode::UNAUTHORIZED, "Invalid credentials".to_string())),
    };

    let exp = (Utc::now() + Duration::hours(12)).timestamp() as usize;
    let claims = Claims {
        sub: request.username,
        role: role.clone(),
        exp,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_bytes()),
    )
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(LoginResponse { token, role })
}

pub fn enforce_roles(user_role: &Role, allowed_roles: &[Role]) -> Result<(), Response> {
    if allowed_roles.iter().any(|r| r == user_role) {
        Ok(())
    } else {
        Err((StatusCode::FORBIDDEN, "Role not permitted").into_response())
    }
}

pub fn role_can_approve_secret(role: &Role) -> bool {
    matches!(role, Role::ISRApprover | Role::Admin)
}

pub fn role_can_create_cui(role: &Role) -> bool {
    matches!(role, Role::MissionOperator | Role::ISRApprover | Role::Admin)
}

#[allow(dead_code)]
pub async fn _state_marker(State(_state): State<AppState>) {}
