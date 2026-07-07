use crate::{models::{ProviderName, TaskRequestInput}, providers::{ProviderAdapter, ProviderTaskingResult}};

pub struct PlanetAdapter;

impl ProviderAdapter for PlanetAdapter {
    fn submit(&self, task_id: &str, request: &TaskRequestInput) -> ProviderTaskingResult {
        ProviderTaskingResult {
            provider: ProviderName::Planet,
            external_id: format!("PLANET-{}", task_id),
            message: format!("Planet request accepted with sensor {:?}", request.sensor_type),
        }
    }
}
