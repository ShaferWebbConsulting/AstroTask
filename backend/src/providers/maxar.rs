use crate::{models::{ProviderName, TaskRequestInput}, providers::{ProviderAdapter, ProviderTaskingResult}};

pub struct MaxarAdapter;

impl ProviderAdapter for MaxarAdapter {
    fn submit(&self, task_id: &str, request: &TaskRequestInput) -> ProviderTaskingResult {
        ProviderTaskingResult {
            provider: ProviderName::Maxar,
            external_id: format!("MAXAR-{}", task_id),
            message: format!("Maxar EO task queued for AOI {}", request.area_of_interest_name),
        }
    }
}
