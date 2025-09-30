use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{Keypair, Signature},
    signer::Signer,
    system_program,
    transaction::Transaction,
};
use std::str::FromStr;
use std::sync::Arc;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum BlockchainError {
    #[error("RPC client error: {0}")]
    RpcError(#[from] solana_client::client_error::ClientError),
    
    #[error("Invalid public key: {0}")]
    InvalidPublicKey(#[from] solana_sdk::pubkey::ParsePubkeyError),
    
    #[error("Keypair error: {0}")]
    KeypairError(String),
    
    #[error("Transaction failed: {0}")]
    TransactionFailed(String),
    
    #[error("Serialization error: {0}")]
    SerializationError(String),
    
    #[error("Configuration error: {0}")]
    ConfigError(String),
}

pub type Result<T> = std::result::Result<T, BlockchainError>;

/// Blockchain service for interacting with Solana Oracle program
#[derive(Clone)]
pub struct BlockchainService {
    rpc_client: Arc<RpcClient>,
    oracle_program_id: Pubkey,
    api_gateway_keypair: Arc<Keypair>,
    commitment: CommitmentConfig,
}

impl BlockchainService {
    /// Create a new blockchain service
    pub fn new(
        rpc_url: String,
        oracle_program_id: String,
        keypair_path: String,
    ) -> Result<Self> {
        tracing::info!("Initializing blockchain service...");
        
        // Initialize RPC client
        let rpc_client = RpcClient::new_with_commitment(
            rpc_url.clone(),
            CommitmentConfig::confirmed(),
        );
        
        // Parse Oracle program ID
        let oracle_program_id = Pubkey::from_str(&oracle_program_id)
            .map_err(|e| BlockchainError::ConfigError(format!("Invalid Oracle program ID: {}", e)))?;
        
        // Load API Gateway keypair
        let keypair_bytes = std::fs::read(&keypair_path)
            .map_err(|e| BlockchainError::KeypairError(format!("Failed to read keypair file: {}", e)))?;
        
        let api_gateway_keypair = Keypair::from_bytes(&keypair_bytes)
            .map_err(|e| BlockchainError::KeypairError(format!("Invalid keypair format: {}", e)))?;
        
        tracing::info!(
            "Blockchain service initialized - RPC: {}, Oracle Program: {}, Gateway: {}",
            rpc_url,
            oracle_program_id,
            api_gateway_keypair.pubkey()
        );
        
        Ok(Self {
            rpc_client: Arc::new(rpc_client),
            oracle_program_id,
            api_gateway_keypair: Arc::new(api_gateway_keypair),
            commitment: CommitmentConfig::confirmed(),
        })
    }
    
    /// Submit a meter reading to the Oracle program
    pub async fn submit_meter_reading(
        &self,
        meter_id: String,
        energy_generated_kwh: f64,
        energy_consumed_kwh: f64,
        reading_timestamp: i64,
    ) -> Result<Signature> {
        tracing::info!(
            "Submitting meter reading to blockchain - Meter: {}, Generated: {} kWh, Consumed: {} kWh",
            meter_id,
            energy_generated_kwh,
            energy_consumed_kwh
        );
        
        // Convert kWh to Wh (u64) for blockchain storage
        let energy_produced = (energy_generated_kwh * 1000.0) as u64;
        let energy_consumed = (energy_consumed_kwh * 1000.0) as u64;
        
        // Derive Oracle Data PDA
        let (oracle_data_pda, _oracle_bump) = Pubkey::find_program_address(
            &[b"oracle"],
            &self.oracle_program_id,
        );
        
        // Derive Meter Reading Record PDA
        let timestamp_bytes = reading_timestamp.to_le_bytes();
        let (meter_reading_record_pda, _reading_bump) = Pubkey::find_program_address(
            &[
                b"reading",
                meter_id.as_bytes(),
                &timestamp_bytes,
            ],
            &self.oracle_program_id,
        );
        
        tracing::debug!(
            "PDAs derived - Oracle Data: {}, Reading Record: {}",
            oracle_data_pda,
            meter_reading_record_pda
        );
        
        // Build instruction
        let instruction = self.build_submit_meter_reading_instruction(
            oracle_data_pda,
            meter_reading_record_pda,
            meter_id.clone(),
            energy_produced,
            energy_consumed,
            reading_timestamp,
        )?;
        
        // Send transaction
        let signature = self.send_transaction(vec![instruction]).await?;
        
        tracing::info!(
            "✅ Meter reading submitted successfully - Meter: {}, Signature: {}",
            meter_id,
            signature
        );
        
        Ok(signature)
    }
    
    /// Trigger market clearing on the Oracle program
    pub async fn trigger_market_clearing(&self) -> Result<Signature> {
        tracing::info!("Triggering market clearing on blockchain");
        
        // Derive Oracle Data PDA
        let (oracle_data_pda, _) = Pubkey::find_program_address(
            &[b"oracle"],
            &self.oracle_program_id,
        );
        
        // Build instruction
        let instruction = self.build_trigger_market_clearing_instruction(oracle_data_pda)?;
        
        // Send transaction
        let signature = self.send_transaction(vec![instruction]).await?;
        
        tracing::info!("✅ Market clearing triggered - Signature: {}", signature);
        
        Ok(signature)
    }
    
    /// Build submit_meter_reading instruction
    fn build_submit_meter_reading_instruction(
        &self,
        oracle_data_pda: Pubkey,
        meter_reading_record_pda: Pubkey,
        meter_id: String,
        energy_produced: u64,
        energy_consumed: u64,
        reading_timestamp: i64,
    ) -> Result<Instruction> {
        // Instruction discriminator for submit_meter_reading
        // This should match the Anchor-generated discriminator
        // For now, we'll use a placeholder - needs to be updated with actual discriminator
        let discriminator: [u8; 8] = [
            0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
        ];
        
        // Serialize instruction data
        let mut data = Vec::new();
        data.extend_from_slice(&discriminator);
        
        // Serialize parameters (Borsh format)
        data.extend_from_slice(&(meter_id.len() as u32).to_le_bytes());
        data.extend_from_slice(meter_id.as_bytes());
        data.extend_from_slice(&energy_produced.to_le_bytes());
        data.extend_from_slice(&energy_consumed.to_le_bytes());
        data.extend_from_slice(&reading_timestamp.to_le_bytes());
        
        // Build accounts
        let accounts = vec![
            AccountMeta::new(oracle_data_pda, false),
            AccountMeta::new(meter_reading_record_pda, false),
            AccountMeta::new_readonly(self.api_gateway_keypair.pubkey(), true),
            AccountMeta::new_readonly(system_program::id(), false),
        ];
        
        Ok(Instruction {
            program_id: self.oracle_program_id,
            accounts,
            data,
        })
    }
    
    /// Build trigger_market_clearing instruction
    fn build_trigger_market_clearing_instruction(
        &self,
        oracle_data_pda: Pubkey,
    ) -> Result<Instruction> {
        // Instruction discriminator for trigger_market_clearing
        let discriminator: [u8; 8] = [
            0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90,
        ];
        
        let mut data = Vec::new();
        data.extend_from_slice(&discriminator);
        
        let accounts = vec![
            AccountMeta::new(oracle_data_pda, false),
            AccountMeta::new_readonly(self.api_gateway_keypair.pubkey(), true),
        ];
        
        Ok(Instruction {
            program_id: self.oracle_program_id,
            accounts,
            data,
        })
    }
    
    /// Send transaction to Solana network
    async fn send_transaction(&self, instructions: Vec<Instruction>) -> Result<Signature> {
        // Get recent blockhash
        let recent_blockhash = self.rpc_client
            .get_latest_blockhash()
            .map_err(|e| BlockchainError::RpcError(e))?;
        
        // Create transaction
        let transaction = Transaction::new_signed_with_payer(
            &instructions,
            Some(&self.api_gateway_keypair.pubkey()),
            &[&*self.api_gateway_keypair],
            recent_blockhash,
        );
        
        // Send and confirm transaction
        let signature = self.rpc_client
            .send_and_confirm_transaction_with_spinner(&transaction)
            .map_err(|e| {
                tracing::error!("Transaction failed: {}", e);
                BlockchainError::TransactionFailed(e.to_string())
            })?;
        
        Ok(signature)
    }
    
    /// Get Oracle program state
    pub async fn get_oracle_state(&self) -> Result<OracleState> {
        let (oracle_data_pda, _) = Pubkey::find_program_address(
            &[b"oracle"],
            &self.oracle_program_id,
        );
        
        let account = self.rpc_client
            .get_account(&oracle_data_pda)
            .map_err(|e| BlockchainError::RpcError(e))?;
        
        // Parse account data (simplified - actual implementation would deserialize Anchor account)
        Ok(OracleState {
            active: true,
            total_readings: 0,
            last_reading_timestamp: 0,
        })
    }
    
    /// Health check - verify connection to Solana network
    pub async fn health_check(&self) -> Result<bool> {
        match self.rpc_client.get_health() {
            Ok(_) => Ok(true),
            Err(e) => {
                tracing::warn!("Blockchain health check failed: {}", e);
                Ok(false)
            }
        }
    }
}

/// Oracle program state (simplified)
#[derive(Debug, Clone)]
pub struct OracleState {
    pub active: bool,
    pub total_readings: u64,
    pub last_reading_timestamp: i64,
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_pda_derivation() {
        let program_id = Pubkey::new_unique();
        let (oracle_pda, _) = Pubkey::find_program_address(&[b"oracle"], &program_id);
        assert_ne!(oracle_pda, Pubkey::default());
    }
    
    #[test]
    fn test_meter_reading_pda() {
        let program_id = Pubkey::new_unique();
        let meter_id = "METER-001";
        let timestamp: i64 = 1727683200;
        let timestamp_bytes = timestamp.to_le_bytes();
        
        let (reading_pda, _) = Pubkey::find_program_address(
            &[b"reading", meter_id.as_bytes(), &timestamp_bytes],
            &program_id,
        );
        
        assert_ne!(reading_pda, Pubkey::default());
    }
}
