// Database schema definitions will be added here
// This module will contain SQL schema definitions and migrations

pub mod types {
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
    #[sqlx(type_name = "user_role", rename_all = "lowercase")]
    pub enum UserRole {
        Student,
        Faculty,
        Admin,
    }

    #[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
    #[sqlx(type_name = "order_type_enum", rename_all = "lowercase")]
    pub enum OrderType {
        Market,
        Limit,
    }

    #[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
    #[sqlx(type_name = "order_side_enum", rename_all = "lowercase")]
    pub enum OrderSide {
        Buy,
        Sell,
    }

    #[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
    #[sqlx(type_name = "order_status_enum", rename_all = "lowercase")]
    pub enum OrderStatus {
        Pending,
        Active,
        Filled,
        Cancelled,
        Expired,
    }
}