use crate::{models::{ProviderName, TaskRequestInput}, providers::{ProviderAdapter, ProviderTaskingResult}};

pub struct UmbraAdapter;

impl ProviderAdapter for UmbraAdapter {
    fn submit(&self, task_id: &str, request: &TaskRequestInput) -> ProviderTaskingResult {
        ProviderTaskingResult {
            provider: ProviderName::Umbra,
            external_id: format!("UMBRA-{}", task_id),
            message: format!("Umbra SAR capture queued for {}", request.area_of_interest_name),
        }
    }
}
