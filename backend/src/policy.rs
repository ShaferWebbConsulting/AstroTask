use crate::{
    auth::{role_can_create_cui},
    models::{ClassificationLevel, PolicyDecision, PolicyResult, Role, TaskRequestInput},
};

pub fn evaluate_submission_policy(role: &Role, req: &TaskRequestInput) -> PolicyResult {
    if req.mission_justification.trim().is_empty() {
        return PolicyResult {
            decision: PolicyDecision::Rejected,
            reason: "Mission justification is required".to_string(),
        };
    }

    if !(-90.0..=90.0).contains(&req.target_latitude) || !(-180.0..=180.0).contains(&req.target_longitude)
    {
        return PolicyResult {
            decision: PolicyDecision::Rejected,
            reason: "Latitude/longitude out of valid range".to_string(),
        };
    }

    match (&req.classification_level, role) {
        (ClassificationLevel::CUI_IL5, r) if role_can_create_cui(r) => PolicyResult {
            decision: PolicyDecision::Approved,
            reason: "CUI task accepted".to_string(),
        },
        (ClassificationLevel::SECRET_IL6, Role::ISRApprover | Role::Admin) => PolicyResult {
            decision: PolicyDecision::FlaggedForReview,
            reason: "SECRET task submitted for controlled approval".to_string(),
        },
        (ClassificationLevel::SECRET_IL6, Role::SecurityOfficer) => PolicyResult {
            decision: PolicyDecision::FlaggedForReview,
            reason: "Security officer flagged SECRET task for review".to_string(),
        },
        (ClassificationLevel::SECRET_IL6, _) => PolicyResult {
            decision: PolicyDecision::Rejected,
            reason: "Only ISRApprover or Admin may submit SECRET_IL6 tasks".to_string(),
        },
        _ => PolicyResult {
            decision: PolicyDecision::Rejected,
            reason: "Role is not permitted for requested classification".to_string(),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{ProviderName, SensorType};

    fn sample_request() -> TaskRequestInput {
        TaskRequestInput {
            target_latitude: 10.0,
            target_longitude: 20.0,
            area_of_interest_name: "AOI".to_string(),
            mission_priority: "High".to_string(),
            sensor_type: SensorType::EO,
            requested_time_window: "2026-01-01T00:00:00Z/2026-01-01T01:00:00Z".to_string(),
            classification_level: ClassificationLevel::CUI_IL5,
            commercial_provider_preference: ProviderName::Maxar,
            mission_justification: "Need imagery".to_string(),
        }
    }

    #[test]
    fn rejects_missing_justification() {
        let mut req = sample_request();
        req.mission_justification = " ".to_string();
        let result = evaluate_submission_policy(&Role::MissionOperator, &req);
        assert_eq!(result.decision, PolicyDecision::Rejected);
    }

    #[test]
    fn rejects_invalid_coordinates() {
        let mut req = sample_request();
        req.target_latitude = 100.0;
        let result = evaluate_submission_policy(&Role::MissionOperator, &req);
        assert_eq!(result.decision, PolicyDecision::Rejected);
    }

    #[test]
    fn approves_cui_for_mission_operator() {
        let req = sample_request();
        let result = evaluate_submission_policy(&Role::MissionOperator, &req);
        assert_eq!(result.decision, PolicyDecision::Approved);
    }
}
