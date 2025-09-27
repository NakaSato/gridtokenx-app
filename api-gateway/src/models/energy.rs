use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::types::BigDecimal;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct EnergyReading {
    pub id: Option<Uuid>,
    pub meter_id: String,
    pub timestamp: DateTime<Utc>,
    pub energy_generated: f64,
    pub energy_consumed: f64,
    pub solar_irradiance: Option<f64>,
    pub temperature: Option<f64>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

// Internal database model with BigDecimal for database operations
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct EnergyReadingDb {
    pub id: Option<Uuid>,
    pub meter_id: String,
    pub timestamp: DateTime<Utc>,
    pub energy_generated: BigDecimal,
    pub energy_consumed: BigDecimal,
    pub solar_irradiance: Option<BigDecimal>,
    pub temperature: Option<BigDecimal>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: Option<DateTime<Utc>>, // Make this optional to handle defaults
}

impl From<EnergyReadingDb> for EnergyReading {
    fn from(db_reading: EnergyReadingDb) -> Self {
        use std::str::FromStr;
        
        EnergyReading {
            id: db_reading.id,
            meter_id: db_reading.meter_id,
            timestamp: db_reading.timestamp,
            energy_generated: f64::from_str(&db_reading.energy_generated.to_string()).unwrap_or(0.0),
            energy_consumed: f64::from_str(&db_reading.energy_consumed.to_string()).unwrap_or(0.0),
            solar_irradiance: db_reading.solar_irradiance.map(|bd| f64::from_str(&bd.to_string()).unwrap_or(0.0)),
            temperature: db_reading.temperature.map(|bd| f64::from_str(&bd.to_string()).unwrap_or(0.0)),
            metadata: db_reading.metadata,
            created_at: db_reading.created_at.unwrap_or_else(|| Utc::now()),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EnergyReadingSubmission {
    pub meter_id: String,
    pub timestamp: DateTime<Utc>,
    pub energy_generated: f64,
    pub energy_consumed: f64,
    pub solar_irradiance: Option<f64>,
    pub temperature: Option<f64>,
    pub engineering_authority_signature: String,
    pub metadata: Option<EnergyMetadata>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EnergyMetadata {
    pub location: String,
    pub device_type: String,
    pub weather_conditions: Option<String>,
}