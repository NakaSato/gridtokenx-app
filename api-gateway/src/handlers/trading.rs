use axum::{
    extract::{Query, State},
    response::Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::auth::middleware::AuthenticatedUser;
use crate::database::schema::types::{OrderSide, OrderStatus, OrderType};
use crate::error::{ApiError, Result};
use crate::models::trading::{CreateOrderRequest, MarketData, OrderBook, TradingOrder, TradingOrderDb};
use crate::AppState;

/// Query parameters for trading orders
#[derive(Debug, Deserialize, Validate)]
pub struct OrderQuery {
    pub status: Option<OrderStatus>,
    pub side: Option<OrderSide>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

/// Response for order creation
#[derive(Debug, Serialize)]
pub struct CreateOrderResponse {
    pub id: Uuid,
    pub status: OrderStatus,
    pub created_at: DateTime<Utc>,
    pub message: String,
}

/// Create a new trading order
/// POST /api/v1/trading/orders
pub async fn create_order(
    State(state): State<AppState>,
    user: AuthenticatedUser,
    Json(payload): Json<CreateOrderRequest>,
) -> Result<Json<CreateOrderResponse>> {
    tracing::info!("Creating trading order for user: {}", user.0.sub);

    // Validate order parameters
    if payload.energy_amount <= rust_decimal::Decimal::ZERO {
        return Err(ApiError::BadRequest("Energy amount must be positive".to_string()));
    }

    if payload.price_per_kwh <= rust_decimal::Decimal::ZERO {
        return Err(ApiError::BadRequest("Price per kWh must be positive".to_string()));
    }

    // Create trading order
    let order_id = Uuid::new_v4();
    let now = Utc::now();
    let expires_at = payload.expiry_time.unwrap_or_else(|| now + chrono::Duration::days(1));

    // Determine order side based on user role/permissions (simplified logic)
    let order_side = if payload.energy_amount > rust_decimal::Decimal::ZERO {
        OrderSide::Buy // For now, treat positive amounts as buy orders
    } else {
        OrderSide::Sell
    };

    // Convert Decimal to BigDecimal for database storage
    let energy_amount_bd = {
        use std::str::FromStr;
        sqlx::types::BigDecimal::from_str(&payload.energy_amount.to_string()).unwrap_or_default()
    };
    let price_per_kwh_bd = {
        use std::str::FromStr;
        sqlx::types::BigDecimal::from_str(&payload.price_per_kwh.to_string()).unwrap_or_default()
    };
    let filled_amount_bd = {
        use std::str::FromStr;
        sqlx::types::BigDecimal::from_str("0").unwrap_or_default()
    };

    sqlx::query!(
        r#"
        INSERT INTO trading_orders (
            id, user_id, order_type, side, energy_amount, price_per_kwh, 
            filled_amount, status, expires_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        "#,
        order_id,
        user.0.sub,
        payload.order_type as OrderType,
        order_side as OrderSide,
        energy_amount_bd,
        price_per_kwh_bd,
        filled_amount_bd,
        OrderStatus::Pending as OrderStatus,
        expires_at,
        now
    )
    .execute(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Failed to create trading order: {}", e);
        ApiError::Database(e)
    })?;

    // TODO: In Phase 4, trigger order matching engine

    Ok(Json(CreateOrderResponse {
        id: order_id,
        status: OrderStatus::Pending,
        created_at: now,
        message: "Order created successfully".to_string(),
    }))
}

/// Get user's trading orders
/// GET /api/v1/trading/orders
pub async fn get_user_orders(
    State(state): State<AppState>,
    user: AuthenticatedUser,
    Query(params): Query<OrderQuery>,
) -> Result<Json<Vec<TradingOrder>>> {
    tracing::info!("Fetching orders for user: {}", user.0.sub);

    // Build dynamic query based on parameters  
    let mut query = "SELECT id, user_id, order_type, side, energy_amount, price_per_kwh, filled_amount, status, expires_at, created_at, filled_at FROM trading_orders WHERE user_id = $1".to_string();
    let mut bind_count = 2;

    if let Some(_status) = &params.status {
        query.push_str(&format!(" AND status = ${}", bind_count));
        bind_count += 1;
    }

    if let Some(_side) = &params.side {
        query.push_str(&format!(" AND side = ${}", bind_count));
        bind_count += 1;
    }

    query.push_str(" ORDER BY created_at DESC");

    if let Some(_limit) = params.limit {
        query.push_str(&format!(" LIMIT ${}", bind_count));
        bind_count += 1;
    }

    if let Some(_offset) = params.offset {
        query.push_str(&format!(" OFFSET ${}", bind_count));
    }

    // Execute parameterized query
    let mut sqlx_query = sqlx::query_as::<_, TradingOrderDb>(&query);
    sqlx_query = sqlx_query.bind(user.0.sub);

    if let Some(status) = &params.status {
        sqlx_query = sqlx_query.bind(status);
    }
    if let Some(side) = &params.side {
        sqlx_query = sqlx_query.bind(side);
    }
    if let Some(limit) = params.limit {
        sqlx_query = sqlx_query.bind(limit);
    }
    if let Some(offset) = params.offset {
        sqlx_query = sqlx_query.bind(offset);
    }

    let orders = sqlx_query
        .fetch_all(&state.db)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch trading orders: {}", e);
            ApiError::Database(e)
        })?
        .into_iter()
        .map(|db_order| db_order.into())
        .collect::<Vec<TradingOrder>>();

    Ok(Json(orders))
}

/// Get current market data
/// GET /api/v1/trading/market
pub async fn get_market_data(
    State(state): State<AppState>,
    _user: AuthenticatedUser,
) -> Result<Json<MarketData>> {
    tracing::info!("Fetching current market data");

    // Get current epoch information (for now, use simple hour-based epochs)
    let now = Utc::now();
    let current_epoch = (now.timestamp() / 3600) as u64; // 1-hour epochs
    let epoch_start = DateTime::from_timestamp(current_epoch as i64 * 3600, 0).unwrap();
    let epoch_end = epoch_start + chrono::Duration::hours(1);

    // For now, return basic market data structure
    // In Phase 4, this will include real order book and trade data
    let market_data = MarketData {
        current_epoch,
        epoch_start_time: epoch_start,
        epoch_end_time: epoch_end,
        status: "active".to_string(),
        order_book: OrderBook {
            sell_orders: vec![],
            buy_orders: vec![],
        },
        recent_trades: vec![],
    };

    Ok(Json(market_data))
}

/// Get trading statistics for the user
/// GET /api/v1/trading/stats
#[derive(Debug, Serialize)]
pub struct TradingStats {
    pub total_orders: i64,
    pub active_orders: i64,
    pub filled_orders: i64,
    pub cancelled_orders: i64,
}

pub async fn get_trading_stats(
    State(state): State<AppState>,
    user: AuthenticatedUser,
) -> Result<Json<TradingStats>> {
    tracing::info!("Fetching trading stats for user: {}", user.0.sub);

    // For now, return basic stats structure
    // In Phase 4, this will include real database queries
    let trading_stats = TradingStats {
        total_orders: 0,
        active_orders: 0,
        filled_orders: 0,
        cancelled_orders: 0,
    };

    Ok(Json(trading_stats))
}