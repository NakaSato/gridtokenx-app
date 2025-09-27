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

/// Enhanced user registration request with additional validation
#[derive(Debug, Deserialize, Serialize, Validate)]
pub struct EnhancedRegisterRequest {
    #[validate(length(min = 3, max = 50))]
    pub username: String,
    
    #[validate(email)]
    pub email: String,
    
    #[validate(length(min = 8, max = 128))]
    pub password: String,
    
    #[validate(length(min = 1, max = 20))]
    pub role: String,
    
    #[validate(length(min = 1, max = 100))]
    pub department: String,
    
    #[validate(length(min = 1, max = 100))]
    pub first_name: String,
    
    #[validate(length(min = 1, max = 100))]
    pub last_name: String,
    
    // Optional initial wallet address
    #[validate(length(min = 32, max = 44))]
    pub wallet_address: Option<String>,
    
    // Department-specific metadata
    pub department_metadata: Option<serde_json::Value>,
}

/// Wallet address management request
#[derive(Debug, Deserialize, Validate)]
pub struct WalletAddressRequest {
    #[validate(length(min = 32, max = 44))]
    pub wallet_address: String,
    
    pub verify_ownership: Option<bool>,
}

/// Admin user update request
#[derive(Debug, Deserialize, Validate, Serialize)]
pub struct AdminUserUpdateRequest {
    #[validate(email)]
    pub email: Option<String>,
    
    #[validate(length(min = 1, max = 100))]
    pub first_name: Option<String>,
    
    #[validate(length(min = 1, max = 100))]
    pub last_name: Option<String>,
    
    #[validate(length(min = 1, max = 100))]
    pub department: Option<String>,
    
    #[validate(length(min = 1, max = 20))]
    pub role: Option<String>,
    
    pub is_active: Option<bool>,
    
    #[validate(length(min = 32, max = 44))]
    pub wallet_address: Option<String>,
    
    pub blockchain_registered: Option<bool>,
}

/// Department validation response
#[derive(Debug, Serialize)]
pub struct DepartmentInfo {
    pub name: String,
    pub code: String,
    pub requires_approval: bool,
    pub allowed_roles: Vec<String>,
    pub metadata_schema: Option<serde_json::Value>,
}

/// User activity log entry
#[derive(Debug, Serialize)]
pub struct UserActivity {
    pub id: Uuid,
    pub user_id: Uuid,
    pub action: String,
    pub details: Option<serde_json::Value>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Enhanced user registration with department validation and audit logging
pub async fn enhanced_register(
    State(state): State<AppState>,
    Json(request): Json<EnhancedRegisterRequest>,
) -> Result<Json<SecureAuthResponse>> {
    // Validate request
    request.validate()
        .map_err(|e| ApiError::BadRequest(format!("Validation error: {}", e)))?;

    // Validate role
    crate::auth::Role::from_str(&request.role)
        .map_err(|_| ApiError::BadRequest("Invalid role".to_string()))?;

    // Validate department (Engineering Department specific logic)
    let valid_departments = vec![
        "Computer Engineering",
        "Electrical Engineering", 
        "Mechanical Engineering",
        "Civil Engineering",
        "Chemical Engineering",
        "Environmental Engineering",
        "Industrial Engineering",
        "Biomedical Engineering",
        "Materials Engineering",
        "Engineering Administration",
    ];
    
    if !valid_departments.contains(&request.department.as_str()) {
        return Err(ApiError::BadRequest("Invalid department for Engineering College".to_string()));
    }

    // Department-specific role validation
    match request.department.as_str() {
        "Engineering Administration" => {
            if !["admin", "faculty"].contains(&request.role.as_str()) {
                return Err(ApiError::BadRequest("Engineering Administration only allows admin or faculty roles".to_string()));
            }
        },
        _ => {
            if !["student", "faculty", "admin"].contains(&request.role.as_str()) {
                return Err(ApiError::BadRequest("Invalid role for this department".to_string()));
            }
        }
    }

    // Check if username already exists
    let existing_user = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM users WHERE username = $1 OR email = $2"
    )
    .bind(&request.username)
    .bind(&request.email)
    .fetch_one(&state.db)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    if existing_user > 0 {
        return Err(ApiError::BadRequest("Username or email already exists".to_string()));
    }

    // Validate wallet address format if provided
    if let Some(wallet_addr) = &request.wallet_address {
        if !is_valid_solana_address(wallet_addr) {
            return Err(ApiError::BadRequest("Invalid Solana wallet address format".to_string()));
        }
    }

    // Hash password
    let password_hash = PasswordService::hash_password(&request.password)?;

    // Create user with enhanced fields
    let user_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO users (id, username, email, password_hash, role, department, 
                           first_name, last_name, wallet_address, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, ($5)::user_role, $6, $7, $8, $9, true, NOW(), NOW())"
    )
    .bind(user_id)
    .bind(&request.username)
    .bind(&request.email)
    .bind(&password_hash)
    .bind(&request.role)
    .bind(&request.department)
    .bind(&request.first_name)
    .bind(&request.last_name)
    .bind(&request.wallet_address)
    .execute(&state.db)
    .await
    .map_err(|e| ApiError::Internal(format!("Failed to create user: {}", e)))?;

    // Log user registration activity
    let _ = log_user_activity(
        &state.db,
        user_id,
        "user_registered".to_string(),
        Some(serde_json::json!({
            "department": request.department,
            "role": request.role,
            "has_wallet": request.wallet_address.is_some()
        })),
        None,
        None,
    ).await;

    // Create JWT claims
    let claims = Claims::new(user_id, request.username.clone(), request.role.clone(), request.department.clone());
    
    // Generate token
    let access_token = state.jwt_service.encode_token(&claims)?;

    let response = SecureAuthResponse {
        access_token,
        token_type: "Bearer".to_string(),
        expires_in: 24 * 60 * 60, // 24 hours in seconds
        user: SecureUserInfo {
            username: request.username,
            email: request.email,
            role: request.role,
            department: request.department,
            blockchain_registered: false,
        },
    };

    Ok(Json(response))
}

/// Update wallet address for current user
pub async fn update_wallet_address(
    State(state): State<AppState>,
    user: AuthenticatedUser,
    Json(request): Json<WalletAddressRequest>,
) -> Result<Json<UserInfo>> {
    // Validate request
    request.validate()
        .map_err(|e| ApiError::BadRequest(format!("Validation error: {}", e)))?;

    // Validate wallet address format
    if !is_valid_solana_address(&request.wallet_address) {
        return Err(ApiError::BadRequest("Invalid Solana wallet address format".to_string()));
    }

    // Check if wallet address is already in use
    let existing_wallet = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM users WHERE wallet_address = $1 AND id != $2"
    )
    .bind(&request.wallet_address)
    .bind(user.0.sub)
    .fetch_one(&state.db)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    if existing_wallet > 0 {
        return Err(ApiError::BadRequest("Wallet address is already in use".to_string()));
    }

    // Update wallet address
    let result = sqlx::query(
        "UPDATE users SET wallet_address = $1, updated_at = NOW() WHERE id = $2 AND is_active = true"
    )
    .bind(&request.wallet_address)
    .bind(user.0.sub)
    .execute(&state.db)
    .await
    .map_err(|e| ApiError::Internal(format!("Failed to update wallet address: {}", e)))?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound("User not found".to_string()));
    }

    // Log wallet update activity
    let _ = log_user_activity(
        &state.db,
        user.0.sub,
        "wallet_updated".to_string(),
        Some(serde_json::json!({
            "wallet_address": request.wallet_address
        })),
        None,
        None,
    ).await;

    // Return updated profile
    crate::handlers::auth::get_profile(State(state), user).await
}

/// Remove wallet address for current user
pub async fn remove_wallet_address(
    State(state): State<AppState>,
    user: AuthenticatedUser,
) -> Result<StatusCode> {
    // Update wallet address to null
    let result = sqlx::query(
        "UPDATE users SET wallet_address = NULL, blockchain_registered = false, updated_at = NOW() 
         WHERE id = $1 AND is_active = true"
    )
    .bind(user.0.sub)
    .execute(&state.db)
    .await
    .map_err(|e| ApiError::Internal(format!("Failed to remove wallet address: {}", e)))?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound("User not found".to_string()));
    }

    // Log wallet removal activity
    let _ = log_user_activity(
        &state.db,
        user.0.sub,
        "wallet_removed".to_string(),
        None,
        None,
        None,
    ).await;

    Ok(StatusCode::NO_CONTENT)
}

/// Admin: Update any user (requires admin role)
pub async fn admin_update_user(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
    user: AuthenticatedUser,
    Json(request): Json<AdminUserUpdateRequest>,
) -> Result<Json<UserInfo>> {
    // Check admin permissions
    if !user.0.has_any_role(&["admin"]) {
        return Err(ApiError::Authorization("Admin access required".to_string()));
    }

    // Validate request
    request.validate()
        .map_err(|e| ApiError::BadRequest(format!("Validation error: {}", e)))?;

    // Validate role if provided
    if let Some(role) = &request.role {
        crate::auth::Role::from_str(role)
            .map_err(|_| ApiError::BadRequest("Invalid role".to_string()))?;
    }

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
    if request.role.is_some() {
        query_parts.push(format!("role = (${}::text)::user_role", param_count));
        param_count += 1;
    }
    if request.is_active.is_some() {
        query_parts.push(format!("is_active = ${}", param_count));
        param_count += 1;
    }
    if request.wallet_address.is_some() {
        query_parts.push(format!("wallet_address = ${}", param_count));
        param_count += 1;
    }
    if request.blockchain_registered.is_some() {
        query_parts.push(format!("blockchain_registered = ${}", param_count));
        param_count += 1;
    }

    if query_parts.is_empty() {
        return Err(ApiError::BadRequest("No fields to update".to_string()));
    }

    query_parts.push("updated_at = NOW()".to_string());
    let query = format!(
        "UPDATE users SET {} WHERE id = ${}",
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
    if let Some(role) = &request.role {
        query_builder = query_builder.bind(role);
    }
    if let Some(is_active) = request.is_active {
        query_builder = query_builder.bind(is_active);
    }
    if let Some(wallet_address) = &request.wallet_address {
        query_builder = query_builder.bind(wallet_address);
    }
    if let Some(blockchain_registered) = request.blockchain_registered {
        query_builder = query_builder.bind(blockchain_registered);
    }
    
    query_builder = query_builder.bind(user_id);

    let result = query_builder
        .execute(&state.db)
        .await
        .map_err(|e| ApiError::Internal(format!("Failed to update user: {}", e)))?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound("User not found".to_string()));
    }

    // Log admin action
    let _ = log_user_activity(
        &state.db,
        user.0.sub,
        "admin_user_updated".to_string(),
        Some(serde_json::json!({
            "target_user_id": user_id,
            "changes": request
        })),
        None,
        None,
    ).await;

    // Return updated user info
    crate::handlers::auth::get_user(State(state), Path(user_id)).await
}

/// Admin: Deactivate user (soft delete)
pub async fn admin_deactivate_user(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
    user: AuthenticatedUser,
) -> Result<StatusCode> {
    // Check admin permissions
    if !user.0.has_any_role(&["admin"]) {
        return Err(ApiError::Authorization("Admin access required".to_string()));
    }

    // Cannot deactivate self
    if user_id == user.0.sub {
        return Err(ApiError::BadRequest("Cannot deactivate your own account".to_string()));
    }

    // Deactivate user
    let result = sqlx::query(
        "UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1"
    )
    .bind(user_id)
    .execute(&state.db)
    .await
    .map_err(|e| ApiError::Internal(format!("Failed to deactivate user: {}", e)))?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound("User not found".to_string()));
    }

    // Log admin action
    let _ = log_user_activity(
        &state.db,
        user.0.sub,
        "admin_user_deactivated".to_string(),
        Some(serde_json::json!({
            "target_user_id": user_id
        })),
        None,
        None,
    ).await;

    Ok(StatusCode::NO_CONTENT)
}

/// Admin: Reactivate user
pub async fn admin_reactivate_user(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
    user: AuthenticatedUser,
) -> Result<StatusCode> {
    // Check admin permissions
    if !user.0.has_any_role(&["admin"]) {
        return Err(ApiError::Authorization("Admin access required".to_string()));
    }

    // Reactivate user
    let result = sqlx::query(
        "UPDATE users SET is_active = true, updated_at = NOW() WHERE id = $1"
    )
    .bind(user_id)
    .execute(&state.db)
    .await
    .map_err(|e| ApiError::Internal(format!("Failed to reactivate user: {}", e)))?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound("User not found".to_string()));
    }

    // Log admin action
    let _ = log_user_activity(
        &state.db,
        user.0.sub,
        "admin_user_reactivated".to_string(),
        Some(serde_json::json!({
            "target_user_id": user_id
        })),
        None,
        None,
    ).await;

    Ok(StatusCode::NO_CONTENT)
}

/// Get user activity log (admin only)
pub async fn get_user_activity(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
    Query(params): Query<ActivityQuery>,
    user: AuthenticatedUser,
) -> Result<Json<ActivityListResponse>> {
    // Check admin permissions or self-access
    if !user.0.has_any_role(&["admin"]) && user_id != user.0.sub {
        return Err(ApiError::Authorization("Admin access required or can only view own activity".to_string()));
    }

    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(20).min(100).max(1);
    let offset = (page - 1) * per_page;

    // Get activities
    let activities = sqlx::query_as::<_, ActivityRow>(
        "SELECT id, user_id, action, details, ip_address, user_agent, created_at
         FROM user_activities 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3"
    )
    .bind(user_id)
    .bind(per_page as i64)
    .bind(offset as i64)
    .fetch_all(&state.db)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    // Get total count
    let total = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM user_activities WHERE user_id = $1"
    )
    .bind(user_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    let activity_list: Vec<UserActivity> = activities
        .into_iter()
        .map(|row| UserActivity {
            id: row.id,
            user_id: row.user_id,
            action: row.action,
            details: row.details,
            ip_address: row.ip_address,
            user_agent: row.user_agent,
            created_at: row.created_at,
        })
        .collect();

    let total_pages = ((total as u32) + per_page - 1) / per_page;

    let response = ActivityListResponse {
        activities: activity_list,
        total: total as u64,
        page,
        per_page,
        total_pages,
    };

    Ok(Json(response))
}

/// Get department information
pub async fn get_department_info(
    State(_state): State<AppState>,
    Path(department): Path<String>,
) -> Result<Json<DepartmentInfo>> {
    // Engineering Department configuration
    let dept_info = match department.as_str() {
        "Computer Engineering" => DepartmentInfo {
            name: "Computer Engineering".to_string(),
            code: "CPE".to_string(),
            requires_approval: false,
            allowed_roles: vec!["student".to_string(), "faculty".to_string(), "admin".to_string()],
            metadata_schema: Some(serde_json::json!({
                "specialization": ["Software", "Hardware", "Networks", "AI/ML"],
                "year": ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"]
            })),
        },
        "Electrical Engineering" => DepartmentInfo {
            name: "Electrical Engineering".to_string(),
            code: "EE".to_string(),
            requires_approval: false,
            allowed_roles: vec!["student".to_string(), "faculty".to_string(), "admin".to_string()],
            metadata_schema: Some(serde_json::json!({
                "specialization": ["Power", "Electronics", "Controls", "Communications"],
                "year": ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"]
            })),
        },
        "Engineering Administration" => DepartmentInfo {
            name: "Engineering Administration".to_string(),
            code: "ADMIN".to_string(),
            requires_approval: true,
            allowed_roles: vec!["admin".to_string(), "faculty".to_string()],
            metadata_schema: Some(serde_json::json!({
                "position": ["Dean", "Associate Dean", "Department Head", "Staff"],
                "clearance_level": ["Basic", "Advanced", "Administrative"]
            })),
        },
        _ => return Err(ApiError::NotFound("Department not found".to_string())),
    };

    Ok(Json(dept_info))
}

// Helper functions

async fn log_user_activity(
    db: &sqlx::PgPool,
    user_id: Uuid,
    action: String,
    details: Option<serde_json::Value>,
    ip_address: Option<String>,
    user_agent: Option<String>,
) -> Result<()> {
    let activity_id = Uuid::new_v4();
    
    let _ = sqlx::query(
        "INSERT INTO user_activities (id, user_id, action, details, ip_address, user_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())"
    )
    .bind(activity_id)
    .bind(user_id)
    .bind(action)
    .bind(details)
    .bind(ip_address)
    .bind(user_agent)
    .execute(db)
    .await;

    Ok(())
}

fn is_valid_solana_address(address: &str) -> bool {
    // Basic Solana address validation (base58, 32-44 characters)
    if address.len() < 32 || address.len() > 44 {
        return false;
    }
    
    // Check if it's valid base58
    bs58::decode(address).into_vec().is_ok()
}

// Additional helper types

#[derive(Debug, Deserialize)]
pub struct ActivityQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct ActivityListResponse {
    pub activities: Vec<UserActivity>,
    pub total: u64,
    pub page: u32,
    pub per_page: u32,
    pub total_pages: u32,
}

#[derive(sqlx::FromRow)]
struct ActivityRow {
    id: Uuid,
    user_id: Uuid,
    action: String,
    details: Option<serde_json::Value>,
    ip_address: Option<String>,
    user_agent: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
}