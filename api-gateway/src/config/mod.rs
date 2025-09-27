use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub environment: String,
    pub port: u16,
    pub database_url: String,
    pub timescale_url: String,
    pub redis_url: String,
    pub jwt_secret: String,
    pub solana_rpc_url: String,
    pub solana_ws_url: String,
    pub engineering_api_key: String,
    pub max_connections: u32,
    pub redis_pool_size: u32,
    pub request_timeout: u64,
    pub rate_limit_window: u64,
    pub log_level: String,
    pub audit_log_enabled: bool,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenv::dotenv().ok(); // Load .env file if it exists

        Ok(Config {
            environment: env::var("ENVIRONMENT")
                .map_err(|_| anyhow::anyhow!("ENVIRONMENT environment variable is required"))?,
            port: env::var("PORT")
                .map_err(|_| anyhow::anyhow!("PORT environment variable is required"))?
                .parse()?,
            database_url: env::var("DATABASE_URL")
                .map_err(|_| anyhow::anyhow!("DATABASE_URL environment variable is required"))?,
            timescale_url: env::var("TIMESCALE_URL")
                .map_err(|_| anyhow::anyhow!("TIMESCALE_URL environment variable is required"))?,
            redis_url: env::var("REDIS_URL")
                .map_err(|_| anyhow::anyhow!("REDIS_URL environment variable is required"))?,
            jwt_secret: env::var("JWT_SECRET")
                .map_err(|_| anyhow::anyhow!("JWT_SECRET environment variable is required"))?,
            solana_rpc_url: env::var("SOLANA_RPC_URL")
                .map_err(|_| anyhow::anyhow!("SOLANA_RPC_URL environment variable is required"))?,
            solana_ws_url: env::var("SOLANA_WS_URL")
                .map_err(|_| anyhow::anyhow!("SOLANA_WS_URL environment variable is required"))?,
            engineering_api_key: env::var("ENGINEERING_API_KEY")
                .map_err(|_| anyhow::anyhow!("ENGINEERING_API_KEY environment variable is required"))?,
            max_connections: env::var("MAX_CONNECTIONS")
                .map_err(|_| anyhow::anyhow!("MAX_CONNECTIONS environment variable is required"))?
                .parse()?,
            redis_pool_size: env::var("REDIS_POOL_SIZE")
                .map_err(|_| anyhow::anyhow!("REDIS_POOL_SIZE environment variable is required"))?
                .parse()?,
            request_timeout: env::var("REQUEST_TIMEOUT")
                .map_err(|_| anyhow::anyhow!("REQUEST_TIMEOUT environment variable is required"))?
                .parse()?,
            rate_limit_window: env::var("RATE_LIMIT_WINDOW")
                .map_err(|_| anyhow::anyhow!("RATE_LIMIT_WINDOW environment variable is required"))?
                .parse()?,
            log_level: env::var("LOG_LEVEL")
                .map_err(|_| anyhow::anyhow!("LOG_LEVEL environment variable is required"))?,
            audit_log_enabled: env::var("AUDIT_LOG_ENABLED")
                .map_err(|_| anyhow::anyhow!("AUDIT_LOG_ENABLED environment variable is required"))?
                .parse()?,
        })
    }
}