use api_gateway::{AppState, config::Config};
use api_gateway::auth::{jwt::JwtService, jwt::ApiKeyService, Claims};
use api_gateway::auth::password::PasswordService;
use api_gateway::handlers::auth::{LoginRequest, UpdateProfileRequest, ChangePasswordRequest};
use api_gateway::handlers::user_management::EnhancedRegisterRequest;
use axum::{
    body::Body,
    extract::Request,
    http::{header, Method, StatusCode},
    middleware::from_fn_with_state,
    response::Response,
    routing::{get, post},
    Router,
};
use chrono::Utc;
use serde_json::{json, Value};
use sqlx::Row;
use tower::ServiceExt;
use uuid::Uuid;

// Test configuration and setup helpers
struct TestContext {
    state: AppState,
    test_user_id: Uuid,
    test_user_token: String,
}

impl TestContext {
    async fn new() -> Self {
        // Load test configuration
        let config = Config::from_env().expect("Failed to load test config");
        
        // Setup test database
        let db_pool = api_gateway::database::setup_database(&config.database_url)
            .await
            .expect("Failed to setup database");
        
        let timescale_pool = api_gateway::database::setup_timescale_database(&config.timescale_url)
            .await
            .expect("Failed to setup TimescaleDB");
        
        // Setup Redis
        let redis_client = redis::Client::open(config.redis_url.as_str())
            .expect("Failed to setup Redis");
        
        // Initialize auth services
        let jwt_service = JwtService::new().expect("Failed to init JWT service");
        let api_key_service = ApiKeyService::new().expect("Failed to init API key service");
        
        let state = AppState {
            db: db_pool,
            timescale_db: timescale_pool,
            redis: redis_client,
            config: config.clone(),
            jwt_service,
            api_key_service,
        };
        
        // Create test user
        let test_user_id = Self::create_test_user(&state).await;
        let test_user_token = Self::create_test_token(&state, test_user_id).await;
        
        TestContext {
            state,
            test_user_id,
            test_user_token,
        }
    }
    
    async fn create_test_user(state: &AppState) -> Uuid {
        let user_id = Uuid::new_v4();
        let password_hash = PasswordService::hash_password("testpassword123")
            .expect("Failed to hash password");
        
        sqlx::query(
            "INSERT INTO users (id, username, email, password_hash, role, department, first_name, last_name, is_active)
             VALUES ($1, $2, $3, $4, $5::user_role, $6, $7, $8, $9)"
        )
        .bind(user_id)
        .bind("testuser")
        .bind("test@engineering.edu")
        .bind(password_hash)
        .bind("student")
        .bind("Engineering")
        .bind("Test")
        .bind("User")
        .bind(true)
        .execute(&state.db)
        .await
        .expect("Failed to create test user");
        
        user_id
    }
    
    async fn create_test_token(state: &AppState, user_id: Uuid) -> String {
        let claims = Claims::new(
            user_id,
            "testuser".to_string(),
            "student".to_string(),
            "Engineering".to_string(),
        );
        
        state.jwt_service.encode_token(&claims)
            .expect("Failed to create test token")
    }
    
    fn build_test_app(&self) -> Router {
        Router::new()
            // Authentication routes (no auth required)
            .route("/auth/login", post(api_gateway::handlers::auth::login))
            .route("/auth/register", post(api_gateway::handlers::user_management::enhanced_register))
            
            // Protected routes
            .route("/auth/profile", get(api_gateway::handlers::auth::get_profile))
            .route("/auth/profile", post(api_gateway::handlers::auth::update_profile))
            .route("/auth/password", post(api_gateway::handlers::auth::change_password))
            .layer(from_fn_with_state(
                self.state.clone(),
                api_gateway::auth::middleware::auth_middleware,
            ))
            .with_state(self.state.clone())
    }
    
    async fn cleanup(&self) {
        // Clean up test data
        let _ = sqlx::query("DELETE FROM users WHERE username = 'testuser' OR username LIKE 'newuser%'")
            .execute(&self.state.db)
            .await;
    }
}

// Helper function to extract JSON from response
async fn extract_json(response: Response) -> Value {
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .expect("Failed to read response body");
    
    serde_json::from_slice(&body).expect("Failed to parse JSON")
}

// Authentication Tests

#[tokio::test]
async fn test_login_success() {
    let ctx = TestContext::new().await;
    let app = ctx.build_test_app();
    
    let login_request = LoginRequest {
        username: "testuser".to_string(),
        password: "testpassword123".to_string(),
    };
    
    let request = Request::builder()
        .method(Method::POST)
        .uri("/auth/login")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(serde_json::to_string(&login_request).unwrap()))
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    
    let json = extract_json(response).await;
    assert!(json["access_token"].is_string());
    assert_eq!(json["token_type"], "Bearer");
    assert_eq!(json["expires_in"], 86400); // 24 hours
    assert_eq!(json["user"]["username"], "testuser");
    assert_eq!(json["user"]["email"], "test@engineering.edu");
    assert_eq!(json["user"]["role"], "student");
    assert_eq!(json["user"]["department"], "Engineering");
    assert_eq!(json["user"]["blockchain_registered"], false);
    
    ctx.cleanup().await;
}

#[tokio::test]
async fn test_login_invalid_username() {
    let ctx = TestContext::new().await;
    let app = ctx.build_test_app();
    
    let login_request = LoginRequest {
        username: "nonexistent".to_string(),
        password: "testpassword123".to_string(),
    };
    
    let request = Request::builder()
        .method(Method::POST)
        .uri("/auth/login")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(serde_json::to_string(&login_request).unwrap()))
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    
    let json = extract_json(response).await;
    assert_eq!(json["error"], "Invalid credentials");
    
    ctx.cleanup().await;
}

#[tokio::test]
async fn test_login_invalid_password() {
    let ctx = TestContext::new().await;
    let app = ctx.build_test_app();
    
    let login_request = LoginRequest {
        username: "testuser".to_string(),
        password: "wrongpassword".to_string(),
    };
    
    let request = Request::builder()
        .method(Method::POST)
        .uri("/auth/login")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(serde_json::to_string(&login_request).unwrap()))
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    
    let json = extract_json(response).await;
    assert_eq!(json["error"], "Invalid credentials");
    
    ctx.cleanup().await;
}

#[tokio::test]
async fn test_login_validation_errors() {
    let ctx = TestContext::new().await;
    let app = ctx.build_test_app();
    
    // Test short username
    let login_request = LoginRequest {
        username: "ab".to_string(), // Too short (min 3)
        password: "testpassword123".to_string(),
    };
    
    let request = Request::builder()
        .method(Method::POST)
        .uri("/auth/login")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(serde_json::to_string(&login_request).unwrap()))
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    
    let json = extract_json(response).await;
    assert!(json["error"].as_str().unwrap().contains("Validation error"));
    
    ctx.cleanup().await;
}

#[tokio::test]
async fn test_register_success() {
    let ctx = TestContext::new().await;
    let app = ctx.build_test_app();
    
    let register_request = EnhancedRegisterRequest {
        username: "newuser".to_string(),
        email: "newuser@engineering.edu".to_string(),
        password: "newpassword123".to_string(),
        role: "student".to_string(),
        department: "Engineering".to_string(),
        first_name: "New".to_string(),
        last_name: "User".to_string(),
        wallet_address: Some("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM".to_string()),
        department_metadata: Some(json!({
            "student_id": "ENG2025001",
            "year": "sophomore"
        })),
    };
    
    let request = Request::builder()
        .method(Method::POST)
        .uri("/auth/register")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(serde_json::to_string(&register_request).unwrap()))
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::CREATED);
    
    let json = extract_json(response).await;
    assert!(json["access_token"].is_string());
    assert_eq!(json["user"]["username"], "newuser");
    assert_eq!(json["user"]["email"], "newuser@engineering.edu");
    assert_eq!(json["user"]["role"], "student");
    
    // Verify user was created in database
    let user_exists = sqlx::query("SELECT id FROM users WHERE username = 'newuser'")
        .fetch_optional(&ctx.state.db)
        .await
        .unwrap();
    assert!(user_exists.is_some());
    
    ctx.cleanup().await;
}

#[tokio::test]
async fn test_get_profile_success() {
    let ctx = TestContext::new().await;
    let app = ctx.build_test_app();
    
    let request = Request::builder()
        .method(Method::GET)
        .uri("/auth/profile")
        .header(header::AUTHORIZATION, format!("Bearer {}", ctx.test_user_token))
        .body(Body::empty())
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    
    let json = extract_json(response).await;
    assert_eq!(json["username"], "testuser");
    assert_eq!(json["email"], "test@engineering.edu");
    assert_eq!(json["role"], "student");
    assert_eq!(json["department"], "Engineering");
    assert_eq!(json["blockchain_registered"], false);
    
    ctx.cleanup().await;
}

#[tokio::test]
async fn test_get_profile_unauthorized() {
    let ctx = TestContext::new().await;
    let app = ctx.build_test_app();
    
    let request = Request::builder()
        .method(Method::GET)
        .uri("/auth/profile")
        // No authorization header
        .body(Body::empty())
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    
    ctx.cleanup().await;
}

#[tokio::test]
async fn test_get_profile_invalid_token() {
    let ctx = TestContext::new().await;
    let app = ctx.build_test_app();
    
    let request = Request::builder()
        .method(Method::GET)
        .uri("/auth/profile")
        .header(header::AUTHORIZATION, "Bearer invalid_token")
        .body(Body::empty())
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    
    ctx.cleanup().await;
}

#[tokio::test]
async fn test_update_profile_success() {
    let ctx = TestContext::new().await;
    let app = ctx.build_test_app();
    
    let update_request = UpdateProfileRequest {
        email: Some("updated@engineering.edu".to_string()),
        first_name: Some("UpdatedFirst".to_string()),
        last_name: Some("UpdatedLast".to_string()),
        department: Some("Computer Science".to_string()),
        wallet_address: Some("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM".to_string()),
    };
    
    let request = Request::builder()
        .method(Method::POST)
        .uri("/auth/profile")
        .header(header::AUTHORIZATION, format!("Bearer {}", ctx.test_user_token))
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(serde_json::to_string(&update_request).unwrap()))
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    
    let json = extract_json(response).await;
    assert_eq!(json["email"], "updated@engineering.edu");
    assert_eq!(json["department"], "Computer Science");
    
    // Verify database was updated
    let user = sqlx::query("SELECT email, department FROM users WHERE id = $1")
        .bind(ctx.test_user_id)
        .fetch_one(&ctx.state.db)
        .await
        .unwrap();
    
    assert_eq!(user.get::<String, _>("email"), "updated@engineering.edu");
    assert_eq!(user.get::<String, _>("department"), "Computer Science");
    
    ctx.cleanup().await;
}

#[tokio::test]
async fn test_change_password_success() {
    let ctx = TestContext::new().await;
    let app = ctx.build_test_app();
    
    let change_password_request = ChangePasswordRequest {
        current_password: "testpassword123".to_string(),
        new_password: "newpassword456".to_string(),
    };
    
    let request = Request::builder()
        .method(Method::POST)
        .uri("/auth/password")
        .header(header::AUTHORIZATION, format!("Bearer {}", ctx.test_user_token))
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(serde_json::to_string(&change_password_request).unwrap()))
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    
    let json = extract_json(response).await;
    assert_eq!(json["message"], "Password changed successfully");
    
    // Verify old password no longer works and new password works
    let password_hash = sqlx::query("SELECT password_hash FROM users WHERE id = $1")
        .bind(ctx.test_user_id)
        .fetch_one(&ctx.state.db)
        .await
        .unwrap()
        .get::<String, _>("password_hash");
    
    let old_valid = PasswordService::verify_password("testpassword123", &password_hash)
        .unwrap();
    let new_valid = PasswordService::verify_password("newpassword456", &password_hash)
        .unwrap();
    
    assert!(!old_valid);
    assert!(new_valid);
    
    ctx.cleanup().await;
}

// JWT Token Tests

#[tokio::test]
async fn test_jwt_token_expiration() {
    // Create an expired token (manually set past expiration)
    let mut claims = Claims::new(
        Uuid::new_v4(),
        "testuser".to_string(),
        "student".to_string(),
        "Engineering".to_string(),
    );
    
    // Set expiration to past
    claims.exp = Utc::now().timestamp() - 3600; // 1 hour ago
    
    // Test that expired token is detected
    assert!(claims.is_expired());
}

#[tokio::test]
async fn test_jwt_role_verification() {
    let claims = Claims::new(
        Uuid::new_v4(),
        "testuser".to_string(),
        "student".to_string(),
        "Engineering".to_string(),
    );
    
    // Test role verification
    assert!(claims.has_role("student"));
    assert!(!claims.has_role("admin"));
    assert!(claims.has_any_role(&["student", "faculty"]));
    assert!(!claims.has_any_role(&["admin", "faculty"]));
}

// Security Tests

#[tokio::test]
async fn test_sql_injection_prevention() {
    let ctx = TestContext::new().await;
    let app = ctx.build_test_app();
    
    // Attempt SQL injection in username field
    let login_request = LoginRequest {
        username: "testuser'; DROP TABLE users; --".to_string(),
        password: "testpassword123".to_string(),
    };
    
    let request = Request::builder()
        .method(Method::POST)
        .uri("/auth/login")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(serde_json::to_string(&login_request).unwrap()))
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    // Should return unauthorized (user not found) not a database error
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    
    // Verify users table still exists
    let user_count = sqlx::query("SELECT COUNT(*) as count FROM users")
        .fetch_one(&ctx.state.db)
        .await
        .unwrap()
        .get::<i64, _>("count");
    
    assert!(user_count > 0);
    
    ctx.cleanup().await;
}