pub mod config;
pub mod database;
pub mod handlers;
pub mod middleware;
pub mod models;
pub mod services;
pub mod utils;
pub mod error;
pub mod auth;

pub use config::Config;
pub use error::ApiError;

/// Application state shared across handlers
#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub timescale_db: sqlx::PgPool,
    pub redis: redis::Client,
    pub config: Config,
    pub jwt_service: auth::jwt::JwtService,
    pub api_key_service: auth::jwt::ApiKeyService,
}