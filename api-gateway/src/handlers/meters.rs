use axum::{
    extract::{Path, Query, State},
    response::Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::middleware::AuthenticatedUser,
    error::{ApiError, Result},
    models::energy::{EnergyReading, EnergyReadingDb, EnergyReadingSubmission},
    AppState,
};

/// Query parameters for energy readings
#[derive(Debug, Deserialize, Validate)]
pub struct EnergyReadingQuery {
    pub meter_id: Option<String>,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

/// Response for energy reading submission
#[derive(Debug, Serialize)]
pub struct EnergyReadingResponse {
    pub id: Uuid,
    pub meter_id: String,
    pub timestamp: DateTime<Utc>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

/// Submit a new energy reading from a smart meter
/// POST /api/v1/meters/readings
pub async fn submit_energy_reading(
    State(state): State<AppState>,
    _user: AuthenticatedUser,
    Json(payload): Json<EnergyReadingSubmission>,
) -> Result<Json<EnergyReadingResponse>> {
    tracing::info!("Submitting energy reading for meter: {}", payload.meter_id);

    // Validate engineering authority signature (for Phase 3)
    if payload.engineering_authority_signature.is_empty() {
        return Err(ApiError::BadRequest("Engineering authority signature required".to_string()));
    }

    // Insert energy reading into TimescaleDB
    let reading_id = Uuid::new_v4();
    let now = Utc::now();
    
    let metadata_json = payload.metadata.as_ref().map(|m| serde_json::to_value(m).unwrap());

    // Convert f64 values to BigDecimal for database storage
    let energy_generated_bd = {
        use std::str::FromStr;
        sqlx::types::BigDecimal::from_str(&payload.energy_generated.to_string()).unwrap_or_default()
    };
    let energy_consumed_bd = {
        use std::str::FromStr;
        sqlx::types::BigDecimal::from_str(&payload.energy_consumed.to_string()).unwrap_or_default()
    };
    let solar_irradiance_bd = payload.solar_irradiance.map(|val| {
        use std::str::FromStr;
        sqlx::types::BigDecimal::from_str(&val.to_string()).unwrap_or_default()
    });
    let temperature_bd = payload.temperature.map(|val| {
        use std::str::FromStr;
        sqlx::types::BigDecimal::from_str(&val.to_string()).unwrap_or_default()
    });

    sqlx::query!(
        r#"
        INSERT INTO energy_readings (
            id, meter_id, timestamp, energy_generated, energy_consumed, 
            solar_irradiance, temperature, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        "#,
        reading_id,
        payload.meter_id,
        payload.timestamp,
        energy_generated_bd,
        energy_consumed_bd,
        solar_irradiance_bd,
        temperature_bd,
        metadata_json,
        now
    )
    .execute(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Failed to insert energy reading: {}", e);
        ApiError::Database(e)
    })?;

    // TODO: In Phase 4, trigger blockchain submission for verified readings

    Ok(Json(EnergyReadingResponse {
        id: reading_id,
        meter_id: payload.meter_id,
        timestamp: payload.timestamp,
        status: "submitted".to_string(),
        created_at: now,
    }))
}

/// Get energy readings with optional filtering
/// GET /api/v1/meters/readings
pub async fn get_energy_readings(
    State(state): State<AppState>,
    user: AuthenticatedUser,
    Query(params): Query<EnergyReadingQuery>,
) -> Result<Json<Vec<EnergyReading>>> {
    tracing::info!("Fetching energy readings for user: {}", user.0.sub);

    // Build dynamic query based on parameters
    let mut query = "SELECT id, meter_id, timestamp, energy_generated, energy_consumed, solar_irradiance, temperature, metadata, created_at FROM energy_readings WHERE 1=1".to_string();
    let mut bind_count = 1;
    
    if let Some(meter_id) = &params.meter_id {
        query.push_str(&format!(" AND meter_id = ${}", bind_count));
        bind_count += 1;
    }
    
    if let Some(start_time) = &params.start_time {
        query.push_str(&format!(" AND timestamp >= ${}", bind_count));
        bind_count += 1;
    }
    
    if let Some(end_time) = &params.end_time {
        query.push_str(&format!(" AND timestamp <= ${}", bind_count));
        bind_count += 1;
    }
    
    query.push_str(" ORDER BY timestamp DESC");
    
    if let Some(limit) = params.limit {
        query.push_str(&format!(" LIMIT ${}", bind_count));
        bind_count += 1;
    }
    
    if let Some(offset) = params.offset {
        query.push_str(&format!(" OFFSET ${}", bind_count));
    }

    // Execute parameterized query
    let mut sqlx_query = sqlx::query_as::<_, EnergyReadingDb>(&query);
    
    if let Some(meter_id) = &params.meter_id {
        sqlx_query = sqlx_query.bind(meter_id);
    }
    if let Some(start_time) = &params.start_time {
        sqlx_query = sqlx_query.bind(start_time);
    }
    if let Some(end_time) = &params.end_time {
        sqlx_query = sqlx_query.bind(end_time);
    }
    if let Some(limit) = params.limit {
        sqlx_query = sqlx_query.bind(limit);
    }
    if let Some(offset) = params.offset {
        sqlx_query = sqlx_query.bind(offset);
    }

    let readings = sqlx_query
        .fetch_all(&state.db)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch energy readings: {}", e);
            ApiError::Database(e)
        })?
        .into_iter()
        .map(|db_reading| db_reading.into())
        .collect::<Vec<EnergyReading>>();

    Ok(Json(readings))
}

/// Get a specific energy reading by ID
/// GET /api/v1/meters/readings/{id}
pub async fn get_energy_reading_by_id(
    State(state): State<AppState>,
    _user: AuthenticatedUser,
    Path(reading_id): Path<Uuid>,
) -> Result<Json<EnergyReading>> {
    tracing::info!("Fetching energy reading: {}", reading_id);

    let reading = sqlx::query_as!(
        EnergyReadingDb,
        "SELECT id, meter_id, timestamp, energy_generated, energy_consumed, solar_irradiance, temperature, metadata, created_at FROM energy_readings WHERE id = $1",
        reading_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Database error: {}", e);
        ApiError::Database(e)
    })?
    .ok_or_else(|| ApiError::NotFound("Energy reading not found".to_string()))?;

    Ok(Json(reading.into()))
}

/// Get energy readings aggregated by time intervals (for analytics)
/// GET /api/v1/meters/readings/aggregated
#[derive(Debug, Deserialize)]
pub struct AggregationQuery {
    pub meter_id: String,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    #[serde(default = "default_interval")]
    pub interval: String, // '1 hour', '15 minutes', '1 day', etc.
}

fn default_interval() -> String {
    "1 hour".to_string()
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct EnergyAggregation {
    pub bucket: Option<DateTime<Utc>>,
    pub reading_count: Option<i64>,
}

pub async fn get_aggregated_readings(
    State(state): State<AppState>,
    user: AuthenticatedUser,
    Query(params): Query<AggregationQuery>,
) -> Result<Json<Vec<EnergyAggregation>>> {
    tracing::info!("Fetching aggregated readings for meter: {}", params.meter_id);

    // Use standard PostgreSQL date_trunc function for aggregation
    let aggregated_data = sqlx::query_as!(
        EnergyAggregation,
        r#"
        SELECT 
            date_trunc($1, timestamp) as bucket,
            COUNT(*)::bigint as reading_count
        FROM energy_readings 
        WHERE meter_id = $2 
        AND timestamp >= $3 
        AND timestamp <= $4
        GROUP BY bucket
        ORDER BY bucket DESC
        "#,
        params.interval,
        params.meter_id,
        params.start_time,
        params.end_time
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch aggregated readings: {}", e);
        ApiError::Database(e)
    })?;

    Ok(Json(aggregated_data))
}