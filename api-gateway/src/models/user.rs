use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::database::schema::types::UserRole;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: Option<String>,
    pub role: UserRole,
    pub department: String,
    pub wallet_address: Option<String>,
    pub blockchain_registered: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub email: Option<String>,
    pub role: UserRole,
    pub department: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    pub user: User,
    pub balances: UserBalances,
    pub meter_assignments: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserBalances {
    pub grid_tokens: rust_decimal::Decimal,
    pub pending_trades: rust_decimal::Decimal,
}