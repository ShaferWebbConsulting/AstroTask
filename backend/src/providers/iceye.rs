use crate::{models::{ProviderName, TaskRequestInput}, providers::{ProviderAdapter, ProviderTaskingResult}};

pub struct IceyeAdapter;

impl ProviderAdapter for IceyeAdapter {
    fn submit(&self, task_id: &str, request: &TaskRequestInput) -> ProviderTaskingResult {
        ProviderTaskingResult {
            provider: ProviderName::ICEYE,
            external_id: format!("ICEYE-{}", task_id),
            message: format!("ICEYE response simulated for priority {}", request.mission_priority),
        }
    }
}
