use crate::models::{ProviderName, TaskRequestInput};

#[derive(Debug, Clone)]
pub struct ProviderTaskingResult {
    pub provider: ProviderName,
    pub external_id: String,
    pub message: String,
}

pub trait ProviderAdapter {
    fn submit(&self, task_id: &str, request: &TaskRequestInput) -> ProviderTaskingResult;
}

pub mod blacksky;
pub mod iceye;
pub mod maxar;
pub mod planet;
pub mod umbra;

pub fn dispatch_provider(task_id: &str, request: &TaskRequestInput) -> ProviderTaskingResult {
    match request.commercial_provider_preference {
        ProviderName::Maxar => maxar::MaxarAdapter.submit(task_id, request),
        ProviderName::Planet => planet::PlanetAdapter.submit(task_id, request),
        ProviderName::BlackSky => blacksky::BlackSkyAdapter.submit(task_id, request),
        ProviderName::Umbra => umbra::UmbraAdapter.submit(task_id, request),
        ProviderName::ICEYE => iceye::IceyeAdapter.submit(task_id, request),
    }
}
