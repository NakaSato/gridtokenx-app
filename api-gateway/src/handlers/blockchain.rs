use axum::{
    extract::{Path, Query, State},
    response::Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::{ApiError, Result};
use crate::models::blockchain::{TransactionSubmission, TransactionStatus, ProgramInteraction};
use crate::AppState;

/// Query parameters for transaction history
#[derive(Debug, Deserialize, Validate)]
pub struct TransactionQuery {
    pub program_id: Option<String>,
    pub status: Option<String>,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

/// Response for transaction submission
#[derive(Debug, Serialize)]
pub struct TransactionResponse {
    pub signature: String,
    pub status: String,
    pub submitted_at: DateTime<Utc>,
    pub estimated_confirmation_time: i32, // seconds
}

/// Account information response
#[derive(Debug, Serialize)]
pub struct AccountInfo {
    pub address: String,
    pub balance: rust_decimal::Decimal,
    pub executable: bool,
    pub owner: String,
    pub rent_epoch: u64,
    pub data_length: usize,
}

/// Network status response
#[derive(Debug, Serialize)]
pub struct NetworkStatus {
    pub cluster: String,
    pub block_height: u64,
    pub block_time: DateTime<Utc>,
    pub tps: f64,
    pub health: String,
    pub version: String,
}

/// Program interaction request
#[derive(Debug, Deserialize, Validate)]
pub struct ProgramInteractionRequest {
    pub program_name: String,
    pub instruction: String,
    pub accounts: Vec<String>,
    pub data: serde_json::Value,
    #[validate(range(min = 1000, max = 1000000))]
    pub compute_units: Option<u32>,
}

/// Submit a blockchain transaction
/// POST /api/v1/blockchain/transactions
pub async fn submit_transaction(
    State(state): State<AppState>,
    user: AuthenticatedUser,
    Json(payload): Json<TransactionSubmission>,
) -> Result<Json<TransactionResponse>> {
    tracing::info!("Submitting blockchain transaction for user: {}", user.0.sub);

    // Validate transaction format (placeholder for actual Solana validation)
    if payload.transaction.is_empty() {
        return Err(ApiError::BadRequest("Transaction data cannot be empty".to_string()));
    }

    // For now, we'll simulate transaction submission
    // In production, this would use Solana RPC client
    let signature = format!("tx_{}", Uuid::new_v4().to_string().replace('-', ""));
    
    // Store transaction record in database
    let fee_lamports = payload.priority_fee.to_string().parse::<i64>().unwrap_or(0);
    
    sqlx::query!(
        r#"
        INSERT INTO blockchain_transactions 
        (signature, user_id, program_id, instruction_name, status, fee, compute_units_consumed, submitted_at)
        VALUES ($1, $2, $3, $4, 'pending', $5, $6, NOW())
        "#,
        signature,
        user.0.sub,
        payload.program_id,
        "submit_transaction".to_string(),
        fee_lamports,
        payload.compute_units as i32
    )
    .execute(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Failed to store transaction record: {}", e);
        ApiError::Database(e)
    })?;

    let response = TransactionResponse {
        signature: signature.clone(),
        status: "pending".to_string(),
        submitted_at: Utc::now(),
        estimated_confirmation_time: 30, // 30 seconds estimated
    };

    tracing::info!("Transaction submitted successfully: {}", signature);
    Ok(Json(response))
}

/// Get transaction history for the authenticated user
/// GET /api/v1/blockchain/transactions
pub async fn get_transaction_history(
    State(state): State<AppState>,
    user: AuthenticatedUser,
    Query(params): Query<TransactionQuery>,
) -> Result<Json<Vec<TransactionStatus>>> {
    tracing::info!("Fetching transaction history for user: {}", user.0.sub);

    let limit = params.limit.unwrap_or(50).min(100);
    let offset = params.offset.unwrap_or(0);

    let mut query = "SELECT * FROM blockchain_transactions WHERE user_id = $1".to_string();
    let mut param_count = 1;
    let mut query_params: Vec<String> = vec![user.0.sub.to_string()];

    // Add optional filters
    if let Some(program_id) = &params.program_id {
        param_count += 1;
        query.push_str(&format!(" AND program_id = ${}", param_count));
        query_params.push(program_id.clone());
    }

    if let Some(status) = &params.status {
        param_count += 1;
        query.push_str(&format!(" AND status = ${}", param_count));
        query_params.push(status.clone());
    }

    query.push_str(" ORDER BY created_at DESC");
    query.push_str(&format!(" LIMIT {} OFFSET {}", limit, offset));

    // Simulate transaction status retrieval
    // In production, this would query actual blockchain data
    let transactions = vec![
        TransactionStatus {
            signature: "tx_sample_12345".to_string(),
            status: "confirmed".to_string(),
            block_height: Some(1000000),
            confirmation_status: "finalized".to_string(),
            fee: rust_decimal::Decimal::new(5000, 9), // 0.000005 SOL
            compute_units_consumed: Some(5000),
            logs: vec!["Program log: Instruction processed successfully".to_string()],
            program_interactions: vec![
                ProgramInteraction {
                    program_id: "EnergyTradingProgram".to_string(),
                    instruction_name: "place_order".to_string(),
                    success: true,
                }
            ],
        }
    ];

    Ok(Json(transactions))
}

/// Get specific transaction status by signature
/// GET /api/v1/blockchain/transactions/:signature
pub async fn get_transaction_status(
    State(state): State<AppState>,
    user: AuthenticatedUser,
    Path(signature): Path<String>,
) -> Result<Json<TransactionStatus>> {
    tracing::info!("Fetching transaction status for signature: {}", signature);

    // Verify transaction belongs to user
    let tx_record = sqlx::query!(
        "SELECT * FROM blockchain_transactions WHERE signature = $1 AND user_id = $2",
        signature,
        user.0.sub
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch transaction: {}", e);
        ApiError::Database(e)
    })?
    .ok_or_else(|| ApiError::NotFound("Transaction not found".to_string()))?;

    // Simulate fetching from blockchain
    let transaction_status = TransactionStatus {
        signature: signature.clone(),
        status: tx_record.status,
        block_height: Some(1000000),
        confirmation_status: "finalized".to_string(),
        fee: tx_record.fee.map(|bd| {
            use std::str::FromStr;
            rust_decimal::Decimal::from_str(&bd.to_string()).unwrap_or_default()
        }).unwrap_or_default(),
        compute_units_consumed: tx_record.compute_units_consumed.map(|cu| cu as u32),
        logs: vec!["Program log: Transaction processed".to_string()],
        program_interactions: vec![],
    };

    Ok(Json(transaction_status))
}

/// Interact with a specific smart contract program
/// POST /api/v1/blockchain/programs/:name
pub async fn interact_with_program(
    State(state): State<AppState>,
    user: AuthenticatedUser,
    Path(program_name): Path<String>,
    Json(payload): Json<ProgramInteractionRequest>,
) -> Result<Json<TransactionResponse>> {
    tracing::info!("Program interaction request for: {} by user: {}", program_name, user.0.sub);

    // Validate program name
    let valid_programs = vec!["registry", "trading", "energy-token", "oracle", "governance"];
    if !valid_programs.contains(&program_name.as_str()) {
        return Err(ApiError::BadRequest(format!("Invalid program name: {}", program_name)));
    }

    // Validate instruction
    if payload.instruction.is_empty() {
        return Err(ApiError::BadRequest("Instruction cannot be empty".to_string()));
    }

    // Simulate program interaction
    let signature = format!("prog_{}_{}", program_name, Uuid::new_v4().to_string().replace('-', ""));

    // Log program interaction
    sqlx::query!(
        r#"
        INSERT INTO blockchain_transactions 
        (signature, user_id, program_id, instruction_name, status, compute_units_consumed, submitted_at)
        VALUES ($1, $2, $3, $4, 'pending', $5, NOW())
        "#,
        signature,
        user.0.sub,
        program_name,
        payload.instruction.clone(),
        payload.compute_units.unwrap_or(10000) as i32
    )
    .execute(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Failed to log program interaction: {}", e);
        ApiError::Database(e)
    })?;

    let response = TransactionResponse {
        signature: signature.clone(),
        status: "pending".to_string(),
        submitted_at: Utc::now(),
        estimated_confirmation_time: 15,
    };

    tracing::info!("Program interaction submitted: {}", signature);
    Ok(Json(response))
}

/// Get account information for a given address
/// GET /api/v1/blockchain/accounts/:address
pub async fn get_account_info(
    State(_state): State<AppState>,
    user: AuthenticatedUser,
    Path(address): Path<String>,
) -> Result<Json<AccountInfo>> {
    tracing::info!("Fetching account info for address: {} by user: {}", address, user.0.sub);

    // Validate address format (basic validation)
    if address.len() < 32 || address.len() > 44 {
        return Err(ApiError::BadRequest("Invalid address format".to_string()));
    }

    // Simulate account info retrieval
    let account_info = AccountInfo {
        address: address.clone(),
        balance: rust_decimal::Decimal::new(1000000000, 9), // 1 SOL
        executable: false,
        owner: "11111111111111111111111111111112".to_string(), // System program
        rent_epoch: 300,
        data_length: 0,
    };

    Ok(Json(account_info))
}

/// Get current network status
/// GET /api/v1/blockchain/network
pub async fn get_network_status(
    State(_state): State<AppState>,
    _user: AuthenticatedUser,
) -> Result<Json<NetworkStatus>> {
    tracing::info!("Fetching network status");

    // Simulate network status
    let network_status = NetworkStatus {
        cluster: "devnet".to_string(),
        block_height: 1000000,
        block_time: Utc::now(),
        tps: 2500.0,
        health: "ok".to_string(),
        version: "1.17.0".to_string(),
    };

    Ok(Json(network_status))
}