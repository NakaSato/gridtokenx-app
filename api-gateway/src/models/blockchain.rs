use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct TransactionSubmission {
    pub transaction: String, // base64 encoded transaction
    pub program_id: String,
    pub priority_fee: rust_decimal::Decimal,
    pub compute_units: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TransactionStatus {
    pub signature: String,
    pub status: String,
    pub block_height: Option<u64>,
    pub confirmation_status: String,
    pub fee: rust_decimal::Decimal,
    pub compute_units_consumed: Option<u32>,
    pub logs: Vec<String>,
    pub program_interactions: Vec<ProgramInteraction>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProgramInteraction {
    pub program_id: String,
    pub instruction_name: String,
    pub success: bool,
}