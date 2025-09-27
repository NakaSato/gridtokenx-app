use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

pub type Result<T> = std::result::Result<T, ApiError>;

#[derive(Debug, Error)]
pub enum ApiError {
    #[error("Authentication failed: {0}")]
    Authentication(String),
    
    #[error("Authorization failed: {0}")]
    Authorization(String),
    
    #[error("Bad request: {0}")]
    BadRequest(String),
    
    #[error("Unauthorized: {0}")]
    Unauthorized(String),
    
    #[error("Validation error: {0}")]
    Validation(String),
    
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),
    
    #[error("Blockchain error: {0}")]
    Blockchain(String),
    
    #[error("External service error: {0}")]
    ExternalService(String),
    
    #[error("Configuration error: {0}")]
    Configuration(String),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Conflict: {0}")]
    Conflict(String),
    
    #[error("Rate limit exceeded")]
    RateLimit,
    
    #[error("Internal server error: {0}")]
    Internal(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_message) = match &self {
            ApiError::Authentication(_) => (StatusCode::UNAUTHORIZED, self.to_string()),
            ApiError::Authorization(_) => (StatusCode::FORBIDDEN, self.to_string()),
            ApiError::BadRequest(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            ApiError::Unauthorized(_) => (StatusCode::UNAUTHORIZED, self.to_string()),
            ApiError::Validation(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            ApiError::NotFound(_) => (StatusCode::NOT_FOUND, self.to_string()),
            ApiError::Conflict(_) => (StatusCode::CONFLICT, self.to_string()),
            ApiError::RateLimit => (StatusCode::TOO_MANY_REQUESTS, self.to_string()),
            ApiError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error occurred".to_string()),
            ApiError::Redis(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Cache error occurred".to_string()),
            ApiError::Blockchain(_) => (StatusCode::BAD_GATEWAY, self.to_string()),
            ApiError::ExternalService(_) => (StatusCode::BAD_GATEWAY, self.to_string()),
            ApiError::Configuration(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Configuration error".to_string()),
            ApiError::Internal(_) => (StatusCode::INTERNAL_SERVER_ERROR, self.to_string()),
        };

        let body = Json(json!({
            "error": {
                "message": error_message,
                "type": self.error_type(),
                "timestamp": chrono::Utc::now().to_rfc3339(),
            }
        }));

        (status, body).into_response()
    }
}

impl ApiError {
    fn error_type(&self) -> &'static str {
        match self {
            ApiError::Authentication(_) => "authentication_error",
            ApiError::Authorization(_) => "authorization_error",
            ApiError::BadRequest(_) => "bad_request",
            ApiError::Unauthorized(_) => "unauthorized",
            ApiError::Validation(_) => "validation_error",
            ApiError::Database(_) => "database_error",
            ApiError::Redis(_) => "cache_error",
            ApiError::Blockchain(_) => "blockchain_error",
            ApiError::ExternalService(_) => "external_service_error",
            ApiError::Configuration(_) => "configuration_error",
            ApiError::NotFound(_) => "not_found",
            ApiError::Conflict(_) => "conflict",
            ApiError::RateLimit => "rate_limit_exceeded",
            ApiError::Internal(_) => "internal_error",
        }
    }
}