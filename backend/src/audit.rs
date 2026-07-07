use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::models::{PolicyDecision, ProviderName};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditRecord {
    pub event_id: Uuid,
    pub task_id: Option<Uuid>,
    pub timestamp: DateTime<Utc>,
    pub user_id: String,
    pub action: String,
    pub policy_decision: Option<PolicyDecision>,
    pub provider: Option<ProviderName>,
    pub previous_hash: String,
    pub current_hash: String,
}

pub fn compute_hash(
    event_id: Uuid,
    task_id: Option<Uuid>,
    timestamp: DateTime<Utc>,
    user_id: &str,
    action: &str,
    policy_decision: Option<&PolicyDecision>,
    provider: Option<&ProviderName>,
    previous_hash: &str,
) -> String {
    let mut hasher = Sha256::new();
    hasher.update(event_id.as_bytes());
    if let Some(task) = task_id {
        hasher.update(task.as_bytes());
    }
    hasher.update(timestamp.to_rfc3339());
    hasher.update(user_id.as_bytes());
    hasher.update(action.as_bytes());
    if let Some(decision) = policy_decision {
        hasher.update(format!("{decision:?}"));
    }
    if let Some(provider) = provider {
        hasher.update(format!("{provider:?}"));
    }
    hasher.update(previous_hash.as_bytes());
    format!("{:x}", hasher.finalize())
}

pub fn verify_chain(records: &[AuditRecord]) -> bool {
    let mut expected_previous = "GENESIS".to_string();

    for record in records {
        if record.previous_hash != expected_previous {
            return false;
        }

        let expected_current = compute_hash(
            record.event_id,
            record.task_id,
            record.timestamp,
            &record.user_id,
            &record.action,
            record.policy_decision.as_ref(),
            record.provider.as_ref(),
            &record.previous_hash,
        );

        if expected_current != record.current_hash {
            return false;
        }

        expected_previous = record.current_hash.clone();
    }

    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn verifies_valid_chain_and_detects_tamper() {
        let ts = Utc::now();
        let e1 = Uuid::new_v4();
        let h1 = compute_hash(
            e1,
            None,
            ts,
            "u1",
            "submit",
            Some(&PolicyDecision::Approved),
            Some(&ProviderName::Maxar),
            "GENESIS",
        );
        let r1 = AuditRecord {
            event_id: e1,
            task_id: None,
            timestamp: ts,
            user_id: "u1".to_string(),
            action: "submit".to_string(),
            policy_decision: Some(PolicyDecision::Approved),
            provider: Some(ProviderName::Maxar),
            previous_hash: "GENESIS".to_string(),
            current_hash: h1.clone(),
        };

        let e2 = Uuid::new_v4();
        let h2 = compute_hash(
            e2,
            None,
            ts,
            "u2",
            "approve",
            Some(&PolicyDecision::Approved),
            Some(&ProviderName::Planet),
            &h1,
        );
        let r2 = AuditRecord {
            event_id: e2,
            task_id: None,
            timestamp: ts,
            user_id: "u2".to_string(),
            action: "approve".to_string(),
            policy_decision: Some(PolicyDecision::Approved),
            provider: Some(ProviderName::Planet),
            previous_hash: h1,
            current_hash: h2,
        };

        let mut chain = vec![r1, r2];
        assert!(verify_chain(&chain));

        chain[1].action = "tampered".to_string();
        assert!(!verify_chain(&chain));
    }
}
