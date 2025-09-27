use axum::{response::Json, http::StatusCode};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthStatus {
    pub status: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub version: String,
    pub environment: String,
    pub uptime: u64,
    pub dependencies: Vec<ServiceHealth>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServiceHealth {
    pub name: String,
    pub status: String,
    pub response_time_ms: Option<u64>,
    pub last_check: chrono::DateTime<chrono::Utc>,
    pub error_message: Option<String>,
}

impl HealthStatus {
    pub fn new() -> Self {
        Self {
            status: "healthy".to_string(),
            timestamp: chrono::Utc::now(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            environment: std::env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string()),
            uptime: 0, // TODO: Implement actual uptime tracking
            dependencies: Vec::new(),
        }
    }

    pub fn add_dependency_check(&mut self, name: &str, is_healthy: bool, response_time: Option<u64>, error: Option<String>) {
        self.dependencies.push(ServiceHealth {
            name: name.to_string(),
            status: if is_healthy { "healthy".to_string() } else { "unhealthy".to_string() },
            response_time_ms: response_time,
            last_check: chrono::Utc::now(),
            error_message: error,
        });

        // Update overall status if any dependency is unhealthy
        if !is_healthy {
            self.status = "degraded".to_string();
        }
    }
}

/// Basic health check endpoint
pub async fn health_check() -> Json<HealthStatus> {
    Json(HealthStatus::new())
}

/// Readiness check - checks if service is ready to accept traffic
pub async fn readiness_check() -> Result<Json<HealthStatus>, StatusCode> {
    let mut status = HealthStatus::new();
    
    // TODO: Add actual database connectivity check
    status.add_dependency_check("database", true, Some(5), None);
    
    // TODO: Add Redis connectivity check
    status.add_dependency_check("redis", true, Some(2), None);
    
    // TODO: Add Solana RPC connectivity check
    status.add_dependency_check("solana_rpc", true, Some(10), None);
    
    if status.status == "healthy" {
        Ok(Json(status))
    } else {
        Err(StatusCode::SERVICE_UNAVAILABLE)
    }
}

/// Liveness check - checks if service is running
pub async fn liveness_check() -> Json<HashMap<String, String>> {
    let mut response = HashMap::new();
    response.insert("status".to_string(), "alive".to_string());
    response.insert("timestamp".to_string(), chrono::Utc::now().to_rfc3339());
    Json(response)
}