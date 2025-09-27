use axum::{
    extract::{Request, State},
    http::{header::AUTHORIZATION, StatusCode},
    middleware::Next,
    response::Response,
};
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use axum::async_trait;

use crate::auth::{Claims, Role};
use crate::error::{ApiError, Result};
use crate::AppState;

/// JWT Authentication middleware
pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Response {
    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    let token = match auth_header {
        Some(auth_value) if auth_value.starts_with("Bearer ") => {
            &auth_value[7..] // Remove "Bearer " prefix
        }
        _ => {
            return Response::builder()
                .status(StatusCode::UNAUTHORIZED)
                .body("Missing or invalid Authorization header".into())
                .unwrap();
        }
    };

    match state.jwt_service.decode_token(token) {
        Ok(claims) => {
            // Add claims to request extensions for use in handlers
            request.extensions_mut().insert(claims);
            next.run(request).await
        }
        Err(_) => Response::builder()
            .status(StatusCode::UNAUTHORIZED)
            .body("Invalid or expired token".into())
            .unwrap(),
    }
}

/// Role-based authorization middleware for admin access
pub async fn require_admin_role(
    user: AuthenticatedUser,
    request: Request,
    next: Next,
) -> Response {
    let user_role = match Role::from_str(&user.0.role) {
        Ok(role) => role,
        Err(_) => {
            return Response::builder()
                .status(StatusCode::FORBIDDEN)
                .body("Invalid user role".into())
                .unwrap();
        }
    };

    if user_role == Role::Admin {
        next.run(request).await
    } else {
        Response::builder()
            .status(StatusCode::FORBIDDEN)
            .body("Admin access required".into())
            .unwrap()
    }
}

/// Extractor for authenticated user claims
pub struct AuthenticatedUser(pub Claims);

#[async_trait]
impl<S> FromRequestParts<S> for AuthenticatedUser
where
    S: Send + Sync,
{
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self> {
        let claims = parts
            .extensions
            .get::<Claims>()
            .ok_or_else(|| ApiError::Unauthorized("No authentication found".to_string()))?;

        Ok(AuthenticatedUser(claims.clone()))
    }
}

/// Verify API key against database
async fn verify_api_key(state: &AppState, key: &str) -> Result<crate::auth::ApiKey> {
    let query = "
        SELECT id, key_hash, name, permissions, is_active, created_at, last_used_at
        FROM api_keys
        WHERE is_active = true
    ";

    let api_keys = sqlx::query_as::<_, ApiKeyRow>(query)
        .fetch_all(&state.db)
        .await
        .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    for api_key_row in api_keys {
        if state.api_key_service.verify_key(key, &api_key_row.key_hash)? {
            // Update last_used_at
            let _ = sqlx::query("UPDATE api_keys SET last_used_at = NOW() WHERE id = $1")
                .bind(api_key_row.id)
                .execute(&state.db)
                .await;

            return Ok(crate::auth::ApiKey {
                id: api_key_row.id,
                key_hash: api_key_row.key_hash,
                name: api_key_row.name,
                permissions: serde_json::from_value(api_key_row.permissions)
                    .unwrap_or_default(),
                is_active: api_key_row.is_active,
                created_at: api_key_row.created_at,
                last_used_at: api_key_row.last_used_at,
            });
        }
    }

    Err(ApiError::Unauthorized("Invalid API key".to_string()))
}

#[derive(sqlx::FromRow)]
struct ApiKeyRow {
    id: uuid::Uuid,
    key_hash: String,
    name: String,
    permissions: serde_json::Value,
    is_active: bool,
    created_at: chrono::DateTime<chrono::Utc>,
    last_used_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_role_hierarchy() {
        // Admin should have access to all roles
        let admin_role = Role::Admin;
        assert!(admin_role.can_access("users:create"));
        assert!(admin_role.can_access("energy:read"));
        assert!(admin_role.can_access("admin:settings"));

        // Student should have limited access
        let student_role = Role::Student;
        assert!(student_role.can_access("energy:read"));
        assert!(student_role.can_access("trading:create"));
        assert!(!student_role.can_access("users:create"));
        assert!(!student_role.can_access("admin:settings"));
    }
}