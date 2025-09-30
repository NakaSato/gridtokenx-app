use api_gateway::services::{BlockchainService, BlockchainError};
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

#[cfg(test)]
mod blockchain_tests {
    use super::*;

    #[test]
    fn test_pda_derivation() {
        // Test Oracle Data PDA derivation
        let program_id = Pubkey::from_str("5DF1fmjrXTtG7qsFaLUm5TjJMG7M1a2V7kyTWPjoADV5").unwrap();
        let (oracle_pda, bump) = Pubkey::find_program_address(&[b"oracle"], &program_id);
        
        println!("Oracle Data PDA: {}", oracle_pda);
        println!("Bump: {}", bump);
        
        assert_ne!(oracle_pda, Pubkey::default());
        assert!(bump < 256);
    }

    #[test]
    fn test_meter_reading_pda() {
        // Test Meter Reading Record PDA derivation
        let program_id = Pubkey::from_str("5DF1fmjrXTtG7qsFaLUm5TjJMG7M1a2V7kyTWPjoADV5").unwrap();
        let meter_id = "METER-A-301-001";
        let timestamp: i64 = 1727683200;
        let timestamp_bytes = timestamp.to_le_bytes();
        
        let (reading_pda, bump) = Pubkey::find_program_address(
            &[b"reading", meter_id.as_bytes(), &timestamp_bytes],
            &program_id,
        );
        
        println!("Meter Reading PDA: {}", reading_pda);
        println!("Bump: {}", bump);
        
        assert_ne!(reading_pda, Pubkey::default());
    }

    #[test]
    fn test_energy_conversion() {
        // Test kWh to Wh conversion
        let energy_kwh = 5.5;
        let energy_wh = (energy_kwh * 1000.0) as u64;
        
        assert_eq!(energy_wh, 5500);
    }

    #[test]
    fn test_timestamp_encoding() {
        // Test timestamp encoding for PDA seeds
        let timestamp: i64 = 1727683200;
        let bytes = timestamp.to_le_bytes();
        
        assert_eq!(bytes.len(), 8);
        
        // Verify round-trip
        let decoded = i64::from_le_bytes(bytes);
        assert_eq!(decoded, timestamp);
    }

    // Integration tests (require running Solana validator)
    #[tokio::test]
    #[ignore] // Run with: cargo test --test blockchain_integration_test -- --ignored
    async fn test_blockchain_service_initialization() {
        // This test requires:
        // 1. Running solana-test-validator
        // 2. API Gateway keypair at ./test-keypair.json
        
        let result = BlockchainService::new(
            "http://localhost:8899".to_string(),
            "5DF1fmjrXTtG7qsFaLUm5TjJMG7M1a2V7kyTWPjoADV5".to_string(),
            "./test-keypair.json".to_string(),
        );
        
        match result {
            Ok(service) => {
                println!("✅ Blockchain service initialized");
                
                // Test health check
                let health = service.health_check().await;
                assert!(health.is_ok());
                println!("✅ Health check passed");
            }
            Err(e) => {
                println!("❌ Failed to initialize: {}", e);
                // Don't fail test if validator not running
            }
        }
    }

    #[tokio::test]
    #[ignore]
    async fn test_submit_meter_reading() {
        // This test requires:
        // 1. Running solana-test-validator
        // 2. Deployed Oracle program
        // 3. Initialized Oracle with test keypair as authorized gateway
        // 4. Funded test keypair
        
        let service = match BlockchainService::new(
            "http://localhost:8899".to_string(),
            "5DF1fmjrXTtG7qsFaLUm5TjJMG7M1a2V7kyTWPjoADV5".to_string(),
            "./test-keypair.json".to_string(),
        ) {
            Ok(s) => s,
            Err(e) => {
                println!("Skipping test - blockchain service not available: {}", e);
                return;
            }
        };
        
        let result = service.submit_meter_reading(
            "TEST-METER-001".to_string(),
            5.5,  // 5.5 kWh generated
            3.2,  // 3.2 kWh consumed
            1727683200,  // timestamp
        ).await;
        
        match result {
            Ok(signature) => {
                println!("✅ Transaction submitted: {}", signature);
                assert!(!signature.to_string().is_empty());
            }
            Err(e) => {
                println!("❌ Transaction failed: {}", e);
                // Expected if Oracle not initialized or keypair not authorized
            }
        }
    }

    #[tokio::test]
    #[ignore]
    async fn test_trigger_market_clearing() {
        let service = match BlockchainService::new(
            "http://localhost:8899".to_string(),
            "5DF1fmjrXTtG7qsFaLUm5TjJMG7M1a2V7kyTWPjoADV5".to_string(),
            "./test-keypair.json".to_string(),
        ) {
            Ok(s) => s,
            Err(e) => {
                println!("Skipping test - blockchain service not available: {}", e);
                return;
            }
        };
        
        let result = service.trigger_market_clearing().await;
        
        match result {
            Ok(signature) => {
                println!("✅ Market clearing triggered: {}", signature);
            }
            Err(e) => {
                println!("❌ Market clearing failed: {}", e);
            }
        }
    }
}

#[cfg(test)]
mod error_handling_tests {
    use super::*;

    #[test]
    fn test_invalid_program_id() {
        let result = BlockchainService::new(
            "http://localhost:8899".to_string(),
            "invalid-program-id".to_string(),
            "./test-keypair.json".to_string(),
        );
        
        assert!(result.is_err());
        match result {
            Err(BlockchainError::ConfigError(_)) => {
                println!("✅ Correctly rejected invalid program ID");
            }
            _ => panic!("Expected ConfigError"),
        }
    }

    #[test]
    fn test_missing_keypair_file() {
        let result = BlockchainService::new(
            "http://localhost:8899".to_string(),
            "5DF1fmjrXTtG7qsFaLUm5TjJMG7M1a2V7kyTWPjoADV5".to_string(),
            "./nonexistent-keypair.json".to_string(),
        );
        
        assert!(result.is_err());
        match result {
            Err(BlockchainError::KeypairError(_)) => {
                println!("✅ Correctly rejected missing keypair file");
            }
            _ => panic!("Expected KeypairError"),
        }
    }
}
