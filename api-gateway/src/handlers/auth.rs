use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::auth::{SecureAuthResponse, Claims, UserInfo, SecureUserInfo};
use crate::auth::middleware::AuthenticatedUser;
use crate::auth::password::PasswordService;
use crate::error::{ApiError, Result};
use crate::AppState;

/// Login request
#[derive(Debug, Deserialize, Serialize, Validate)]
pub struct LoginRequest {
    #[validate(length(min = 3, max = 50))]
    pub username: String,
    
    #[validate(length(min = 8, max = 128))]
    pub password: String,
}

/// User profile update request
#[derive(Debug, Deserialize, Serialize, Validate)]
pub struct UpdateProfileRequest {
    #[validate(email)]
    pub email: Option<String>,
    
    #[validate(length(min = 1, max = 100))]
    pub first_name: Option<String>,
    
    #[validate(length(min = 1, max = 100))]
    pub last_name: Option<String>,
    
    #[validate(length(min = 1, max = 100))]
    pub department: Option<String>,
    
    #[validate(length(min = 32, max = 44))]
    pub wallet_address: Option<String>,
}

/// Password change request
#[derive(Debug, Deserialize, Serialize, Validate)]
pub struct ChangePasswordRequest {
    #[validate(length(min = 8, max = 128))]
    pub current_password: String,
    
    #[validate(length(min = 8, max = 128))]
    pub new_password: String,
}

/// User search query parameters
#[derive(Debug, Deserialize)]
pub struct UserSearchQuery {
    pub search: Option<String>,
    pub role: Option<String>,
    pub department: Option<String>,
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

/// Paginated user response
#[derive(Debug, Serialize)]
pub struct UserListResponse {
    pub users: Vec<UserInfo>,
    pub total: u64,
    pub page: u32,
    pub per_page: u32,
    pub total_pages: u32,
}

/// Login handler
pub async fn login(
    State(state): State<AppState>,
    Json(request): Json<LoginRequest>,
) -> Result<Json<SecureAuthResponse>> {
    // Validate request
    request.validate()
        .map_err(|e| ApiError::BadRequest(format!("Validation error: {}", e)))?;

    // Find user by username
    let user = sqlx::query_as::<_, UserRow>(
        "SELECT id, username, email, password_hash, role::text as role, department, 
                first_name, last_name, wallet_address, blockchain_registered,
                is_active, created_at, updated_at
         FROM users 
         WHERE username = $1 AND is_active = true"
    )
    .bind(&request.username)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    let user = user.ok_or_else(|| ApiError::Unauthorized("Invalid credentials".to_string()))?;

    // Verify password
    let password_valid = PasswordService::verify_password(&request.password, &user.password_hash)?;
    if !password_valid {
        return Err(ApiError::Unauthorized("Invalid credentials".to_string()));
    }

    // Create JWT claims
    let claims = Claims::new(user.id, user.username.clone(), user.role.clone(), user.department.clone());
    
    // Generate token
    let access_token = state.jwt_service.encode_token(&claims)?;

    // Update last login
    let _ = sqlx::query("UPDATE users SET last_login_at = NOW() WHERE id = $1")
        .bind(user.id)
        .execute(&state.db)
        .await;

    let response = SecureAuthResponse {
        access_token,
        token_type: "Bearer".to_string(),
        expires_in: 24 * 60 * 60, // 24 hours in seconds
        user: SecureUserInfo {
            username: user.username,
            email: user.email,
            role: user.role,
            department: user.department,
            blockchain_registered: user.blockchain_registered,
        },
    };

    Ok(Json(response))
}

/// Get current user profile
pub async fn get_profile(
    State(state): State<AppState>,
    user: AuthenticatedUser,
) -> Result<Json<UserInfo>> {
    let user_data = sqlx::query_as::<_, UserRow>(
        "SELECT id, username, email, password_hash, role::text as role, department, 
                first_name, last_name, wallet_address, blockchain_registered,
                is_active, created_at, updated_at
         FROM users 
         WHERE id = $1 AND is_active = true"
    )
    .bind(user.0.sub)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    let user_data = user_data.ok_or_else(|| ApiError::NotFound("User not found".to_string()))?;

    let profile = UserInfo {
        id: user_data.id,
        username: user_data.username,
        email: user_data.email,
        role: user_data.role,
        department: user_data.department,
        wallet_address: user_data.wallet_address,
        blockchain_registered: user_data.blockchain_registered,
    };

    Ok(Json(profile))
}

/// Update user profile
pub async fn update_profile(
    State(state): State<AppState>,
    user: AuthenticatedUser,
    Json(request): Json<UpdateProfileRequest>,
) -> Result<Json<UserInfo>> {
    // Validate request
    request.validate()
        .map_err(|e| ApiError::BadRequest(format!("Validation error: {}", e)))?;

    // Build dynamic update query
    let mut query_parts = Vec::new();
    let mut param_count = 1;

    if request.email.is_some() {
        query_parts.push(format!("email = ${}", param_count));
        param_count += 1;
    }
    if request.first_name.is_some() {
        query_parts.push(format!("first_name = ${}", param_count));
        param_count += 1;
    }
    if request.last_name.is_some() {
        query_parts.push(format!("last_name = ${}", param_count));
        param_count += 1;
    }
    if request.department.is_some() {
        query_parts.push(format!("department = ${}", param_count));
        param_count += 1;
    }
    if request.wallet_address.is_some() {
        query_parts.push(format!("wallet_address = ${}", param_count));
        param_count += 1;
    }

    if query_parts.is_empty() {
        return Err(ApiError::BadRequest("No fields to update".to_string()));
    }

    query_parts.push("updated_at = NOW()".to_string());
    let query = format!(
        "UPDATE users SET {} WHERE id = ${} AND is_active = true",
        query_parts.join(", "),
        param_count
    );

    let mut query_builder = sqlx::query(&query);
    
    if let Some(email) = &request.email {
        query_builder = query_builder.bind(email);
    }
    if let Some(first_name) = &request.first_name {
        query_builder = query_builder.bind(first_name);
    }
    if let Some(last_name) = &request.last_name {
        query_builder = query_builder.bind(last_name);
    }
    if let Some(department) = &request.department {
        query_builder = query_builder.bind(department);
    }
    if let Some(wallet_address) = &request.wallet_address {
        query_builder = query_builder.bind(wallet_address);
    }
    
    query_builder = query_builder.bind(user.0.sub);

    let result = query_builder
        .execute(&state.db)
        .await
        .map_err(|e| ApiError::Internal(format!("Failed to update profile: {}", e)))?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound("User not found".to_string()));
    }

    // Return updated profile
    get_profile(State(state), user).await
}

/// Change password
pub async fn change_password(
    State(state): State<AppState>,
    user: AuthenticatedUser,
    Json(request): Json<ChangePasswordRequest>,
) -> Result<StatusCode> {
    // Validate request
    request.validate()
        .map_err(|e| ApiError::BadRequest(format!("Validation error: {}", e)))?;

    // Get current password hash
    let current_hash = sqlx::query_scalar::<_, String>(
        "SELECT password_hash FROM users WHERE id = $1 AND is_active = true"
    )
    .bind(user.0.sub)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    let current_hash = current_hash.ok_or_else(|| ApiError::NotFound("User not found".to_string()))?;

    // Verify current password
    let password_valid = PasswordService::verify_password(&request.current_password, &current_hash)?;
    if !password_valid {
        return Err(ApiError::BadRequest("Current password is incorrect".to_string()));
    }

    // Hash new password
    let new_password_hash = PasswordService::hash_password(&request.new_password)?;

    // Update password
    let result = sqlx::query(
        "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND is_active = true"
    )
    .bind(&new_password_hash)
    .bind(user.0.sub)
    .execute(&state.db)
    .await
    .map_err(|e| ApiError::Internal(format!("Failed to update password: {}", e)))?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound("User not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

/// Get user by ID (admin only)
pub async fn get_user(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<UserInfo>> {
    let user_data = sqlx::query_as::<_, UserRow>(
        "SELECT id, username, email, password_hash, role::text as role, department, 
                first_name, last_name, wallet_address, blockchain_registered,
                is_active, created_at, updated_at
         FROM users 
         WHERE id = $1"
    )
    .bind(user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    let user_data = user_data.ok_or_else(|| ApiError::NotFound("User not found".to_string()))?;

    let user_info = UserInfo {
        id: user_data.id,
        username: user_data.username,
        email: user_data.email,
        role: user_data.role,
        department: user_data.department,
        wallet_address: user_data.wallet_address,
        blockchain_registered: user_data.blockchain_registered,
    };

    Ok(Json(user_info))
}

/// List users with search and pagination (admin/faculty only)
pub async fn list_users(
    State(state): State<AppState>,
    Query(params): Query<UserSearchQuery>,
) -> Result<Json<UserListResponse>> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(20).min(100).max(1);
    let offset = (page - 1) * per_page;

    // Build WHERE clause
    let mut where_conditions = vec!["is_active = true".to_string()];
    let mut bind_values: Vec<Box<dyn sqlx::Encode<'_, sqlx::Postgres> + Send>> = Vec::new();
    let mut param_count = 1;

    if let Some(search) = &params.search {
        where_conditions.push(format!(
            "(username ILIKE ${} OR email ILIKE ${} OR first_name ILIKE ${} OR last_name ILIKE ${})",
            param_count, param_count + 1, param_count + 2, param_count + 3
        ));
        let search_pattern = format!("%{}%", search);
        bind_values.push(Box::new(search_pattern.clone()));
        bind_values.push(Box::new(search_pattern.clone()));
        bind_values.push(Box::new(search_pattern.clone()));
        bind_values.push(Box::new(search_pattern));
        param_count += 4;
    }

    if let Some(role) = &params.role {
        where_conditions.push(format!("role = ${}", param_count));
        bind_values.push(Box::new(role.clone()));
        param_count += 1;
    }

    if let Some(department) = &params.department {
        where_conditions.push(format!("department = ${}", param_count));
        bind_values.push(Box::new(department.clone()));
        param_count += 1;
    }

    let where_clause = where_conditions.join(" AND ");

    // Get total count
    let count_query = format!("SELECT COUNT(*) FROM users WHERE {}", where_clause);
    let total = sqlx::query_scalar::<_, i64>(&count_query)
        .fetch_one(&state.db)
        .await
        .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    // Get users
    let users_query = format!(
        "SELECT id, username, email, password_hash, role::text as role, department, 
                first_name, last_name, wallet_address, blockchain_registered,
                is_active, created_at, updated_at
         FROM users 
         WHERE {} 
         ORDER BY created_at DESC 
         LIMIT ${} OFFSET ${}",
        where_clause, param_count, param_count + 1
    );

    let users_data = sqlx::query_as::<_, UserRow>(&users_query)
        .bind(per_page as i64)
        .bind(offset as i64)
        .fetch_all(&state.db)
        .await
        .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    let users: Vec<UserInfo> = users_data
        .into_iter()
        .map(|user| UserInfo {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            department: user.department,
            wallet_address: user.wallet_address,
            blockchain_registered: user.blockchain_registered,
        })
        .collect();

    let total_pages = ((total as u32) + per_page - 1) / per_page;

    let response = UserListResponse {
        users,
        total: total as u64,
        page,
        per_page,
        total_pages,
    };

    Ok(Json(response))
}

#[derive(sqlx::FromRow)]
struct UserRow {
    id: Uuid,
    username: String,
    email: String,
    password_hash: String,
    role: String,
    department: String,
    first_name: String,
    last_name: String,
    wallet_address: Option<String>,
    blockchain_registered: bool,
    is_active: bool,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}