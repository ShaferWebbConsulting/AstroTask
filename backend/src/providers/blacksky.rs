use crate::{models::{ProviderName, TaskRequestInput}, providers::{ProviderAdapter, ProviderTaskingResult}};

pub struct BlackSkyAdapter;

impl ProviderAdapter for BlackSkyAdapter {
    fn submit(&self, task_id: &str, request: &TaskRequestInput) -> ProviderTaskingResult {
        ProviderTaskingResult {
            provider: ProviderName::BlackSky,
            external_id: format!("BLACKSKY-{}", task_id),
            message: format!("BlackSky task staged for {}", request.requested_time_window),
        }
    }
}
