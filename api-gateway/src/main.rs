use std::net::SocketAddr;

use anyhow::Result;
use axum::{routing::{get, post}, Router, middleware::from_fn_with_state};
use tower::ServiceBuilder;
use tower_http::{cors::CorsLayer, trace::TraceLayer, timeout::TimeoutLayer};
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod database;
mod handlers;
mod middleware;
mod models;
mod services;
mod utils;
mod error;
mod auth;

use config::Config;
use handlers::{health, auth as auth_handlers, user_management, blockchain, analytics, trading, meters};
use auth::{jwt::JwtService, jwt::ApiKeyService};

/// Application state shared across handlers
#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub timescale_db: sqlx::PgPool,
    pub redis: redis::Client,
    pub config: Config,
    pub jwt_service: JwtService,
    pub api_key_service: ApiKeyService,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "api_gateway=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::from_env()?;
    info!("Loaded configuration for environment: {}", config.environment);

    // Setup database connections
    let db_pool = database::setup_database(&config.database_url).await?;
    info!("PostgreSQL connection established");

    let timescale_pool = database::setup_timescale_database(&config.timescale_url).await?;
    info!("TimescaleDB connection established");

    // Run database migrations (PostgreSQL only - TimescaleDB has its own schema)
    database::run_migrations(&db_pool).await?;
    info!("Database migrations completed successfully");

    // Setup Redis connection
    let redis_client = redis::Client::open(config.redis_url.as_str())?;
    info!("Redis connection established");

    // Initialize authentication services
    let jwt_service = JwtService::new()?;
    let api_key_service = ApiKeyService::new()?;
    info!("Authentication services initialized");

    // Create application state
    let app_state = AppState {
        db: db_pool,
        timescale_db: timescale_pool,
        redis: redis_client,
        config: config.clone(),
        jwt_service,
        api_key_service,
    };

    // Build application router
    let app = Router::new()
        // Health check routes (no authentication required)
        .route("/health", get(health::health_check))
        .route("/health/ready", get(health::readiness_check))
        .route("/health/live", get(health::liveness_check))
        
        // Authentication routes (no authentication required)
        .route("/auth/login", post(auth_handlers::login))
        .route("/auth/register", post(user_management::enhanced_register))
        
        // Protected user routes
        .nest("/auth", Router::new()
            .route("/profile", get(auth_handlers::get_profile))
            .route("/profile", post(auth_handlers::update_profile))
            .route("/password", post(auth_handlers::change_password))
            .layer(from_fn_with_state(
                app_state.clone(),
                auth::middleware::auth_middleware,
            ))
        )
        
        // Enhanced user management routes (authenticated users)
        .nest("/user", Router::new()
            .route("/wallet", post(user_management::update_wallet_address))
            .route("/wallet", axum::routing::delete(user_management::remove_wallet_address))
            .route("/activity", get(user_management::get_user_activity))
            .layer(from_fn_with_state(
                app_state.clone(),
                auth::middleware::auth_middleware,
            ))
        )
        
        // Admin-only user management routes
        .nest("/users", Router::new()
            .route("/:id", get(auth_handlers::get_user))
            .route("/:id", axum::routing::put(user_management::admin_update_user))
            .route("/:id/deactivate", post(user_management::admin_deactivate_user))
            .route("/:id/reactivate", post(user_management::admin_reactivate_user))
            .route("/:id/activity", get(user_management::get_user_activity))
            .route("/", get(auth_handlers::list_users))
            .layer(from_fn_with_state(
                app_state.clone(),
                auth::middleware::auth_middleware,
            ))
        )
        
        // Department information routes (public)
        .route("/departments/:department", get(user_management::get_department_info))
        
        // Blockchain interaction routes (authenticated users)
        .nest("/blockchain", Router::new()
            .route("/transactions", post(blockchain::submit_transaction))
            .route("/transactions", get(blockchain::get_transaction_history))
            .route("/transactions/:signature", get(blockchain::get_transaction_status))
            .route("/programs/:name", post(blockchain::interact_with_program))
            .route("/accounts/:address", get(blockchain::get_account_info))
            .route("/network", get(blockchain::get_network_status))
            .layer(from_fn_with_state(
                app_state.clone(),
                auth::middleware::auth_middleware,
            ))
        )
        
        // Trading routes (authenticated users)
        .nest("/trading", Router::new()
            .route("/orders", post(trading::create_order))
            .route("/orders", get(trading::get_user_orders))
            .route("/market", get(trading::get_market_data))
            .route("/stats", get(trading::get_trading_stats))
            .layer(from_fn_with_state(
                app_state.clone(),
                auth::middleware::auth_middleware,
            ))
        )
        
        // Energy meter routes (authenticated users)
        .nest("/meters", Router::new()
            .route("/readings", post(meters::submit_energy_reading))
            .route("/readings", get(meters::get_energy_readings))
            .route("/readings/:id", get(meters::get_energy_reading_by_id))
            .route("/aggregated", get(meters::get_aggregated_readings))
            .layer(from_fn_with_state(
                app_state.clone(),
                auth::middleware::auth_middleware,
            ))
        )
        
        // Analytics routes (authenticated users with role restrictions)
        .nest("/analytics", Router::new()
            .route("/user", get(analytics::get_user_analytics))
            .route("/system", get(analytics::get_system_analytics))
            .layer(from_fn_with_state(
                app_state.clone(),
                auth::middleware::auth_middleware,
            ))
        )
        
        // Global middleware stack
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(TimeoutLayer::new(std::time::Duration::from_secs(30)))
                .layer(CorsLayer::permissive()) // TODO: Configure proper CORS in production
        )
        .with_state(app_state);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    info!("Starting API Gateway server on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}