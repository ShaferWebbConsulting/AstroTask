mod audit;
mod auth;
mod crypto;
mod models;
mod policy;
mod pqc;
mod providers;
mod routes;

use std::{env, sync::Arc};

use axum::Router;
use crypto::CryptoEngine;
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::CorsLayer;
use tracing_subscriber::EnvFilter;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub crypto: Arc<CryptoEngine>,
    pub jwt_secret: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env().add_directive("info".parse()?))
        .init();

    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://postgres@localhost:5432/astrotask".to_string());
    let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "demo-jwt-secret-change-me".to_string());
    let encryption_key = load_encryption_key();

    let db = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    init_db(&db).await?;

    let state = AppState {
        db,
        crypto: Arc::new(CryptoEngine::from_bytes(encryption_key)),
        jwt_secret,
    };

    let app: Router = routes::router().with_state(state).layer(CorsLayer::permissive());
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
    tracing::info!("backend listening on 0.0.0.0:8080");
    axum::serve(listener, app).await?;
    Ok(())
}

fn load_encryption_key() -> [u8; 32] {
    if let Ok(value) = env::var("ENCRYPTION_KEY_32") {
        let bytes = value.as_bytes();
        if bytes.len() >= 32 {
            let mut key = [0u8; 32];
            key.copy_from_slice(&bytes[..32]);
            return key;
        }
    }

    *b"01234567890123456789012345678901"
}

async fn init_db(pool: &sqlx::PgPool) -> anyhow::Result<()> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS tasks (
            id UUID PRIMARY KEY,
            created_by TEXT NOT NULL,
            status TEXT NOT NULL,
            policy_decision TEXT NOT NULL,
            provider TEXT NOT NULL,
            encrypted_payload TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL
        )",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS audit_ledger (
            event_id UUID PRIMARY KEY,
            task_id UUID NULL,
            timestamp TIMESTAMPTZ NOT NULL,
            user_id TEXT NOT NULL,
            action TEXT NOT NULL,
            policy_decision TEXT NULL,
            provider TEXT NULL,
            previous_hash TEXT NOT NULL,
            current_hash TEXT NOT NULL
        )",
    )
    .execute(pool)
    .await?;

    Ok(())
}
