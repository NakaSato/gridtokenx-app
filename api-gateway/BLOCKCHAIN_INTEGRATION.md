# API Gateway Blockchain Integration

This document describes the blockchain integration for submitting meter readings to the Solana Oracle program.

## Overview

The API Gateway now supports direct integration with the Solana blockchain through the Oracle program. When enabled, meter readings are automatically submitted to the blockchain for verification and token minting.

## Architecture

```
Smart Meter Simulator
    ↓ POST /api/v1/meters/readings
API Gateway (Rust)
    ├─→ PostgreSQL (persistent storage)
    └─→ Solana Oracle Program (blockchain submission)
```

## Setup

### 1. Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

### 2. Generate API Gateway Keypair

```bash
cd api-gateway
chmod +x scripts/generate-keypair.sh
./scripts/generate-keypair.sh
```

This will create `./keys/api-gateway-keypair.json` with a new Solana keypair.

### 3. Fund the Keypair (Devnet)

```bash
# Get the public key
PUBKEY=$(solana-keygen pubkey ./keys/api-gateway-keypair.json)

# Airdrop SOL for transaction fees
solana airdrop 2 $PUBKEY --url devnet
```

### 4. Configure Environment

Update `.env`:

```bash
# Blockchain Configuration
BLOCKCHAIN_ENABLED=true
SOLANA_RPC_URL=https://api.devnet.solana.com
ORACLE_PROGRAM_ID=5DF1fmjrXTtG7qsFaLUm5TjJMG7M1a2V7kyTWPjoADV5
API_GATEWAY_KEYPAIR_PATH=./keys/api-gateway-keypair.json
```

### 5. Initialize Oracle Program

The API Gateway keypair must be authorized in the Oracle program:

```bash
cd ../anchor
anchor run initialize-oracle -- --api-gateway <YOUR_PUBKEY>
```

## Usage

### Automatic Blockchain Submission

When blockchain integration is enabled, meter readings are automatically submitted:

```bash
curl -X POST http://localhost:8080/api/v1/meters/readings \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "meter_id": "METER-A-301-001",
    "timestamp": "2025-09-30T09:00:00Z",
    "energy_generated": 5.5,
    "energy_consumed": 3.2,
    "engineering_authority_signature": "sig123...",
    "temperature": 25.0
  }'
```

Response:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "meter_id": "METER-A-301-001",
  "timestamp": "2025-09-30T09:00:00Z",
  "status": "blockchain_submitted",
  "created_at": "2025-09-30T09:00:01Z"
}
```

### Manual Market Clearing

Trigger market clearing (admin only):

```bash
curl -X POST http://localhost:8080/api/v1/blockchain/trigger-clearing \
  -H "Authorization: Bearer <ADMIN_JWT>"
```

## Monitoring

### Check Blockchain Service Status

```bash
curl http://localhost:8080/health
```

Response includes blockchain status:

```json
{
  "status": "healthy",
  "blockchain": {
    "enabled": true,
    "connected": true,
    "oracle_program": "5DF1fmjrXTtG7qsFaLUm5TjJMG7M1a2V7kyTWPjoADV5"
  }
}
```

### View Transaction Logs

```bash
# API Gateway logs
tail -f logs/api-gateway.log | grep blockchain

# Solana transaction logs
solana confirm -v <SIGNATURE> --url devnet
```

## Error Handling

The blockchain integration is designed to be resilient:

1. **Blockchain Unavailable**: Readings are still stored in PostgreSQL
2. **Transaction Failures**: Errors are logged but don't fail the API request
3. **Retry Logic**: Failed transactions can be retried from database records

### Retry Failed Submissions

```bash
# TODO: Implement retry script
cargo run --bin retry-blockchain-submissions
```

## Development

### Local Testing with Solana Test Validator

```bash
# Terminal 1: Start local validator
solana-test-validator

# Terminal 2: Deploy Oracle program
cd anchor
anchor build
anchor deploy --provider.cluster localnet

# Terminal 3: Start API Gateway
cd api-gateway
SOLANA_RPC_URL=http://localhost:8899 cargo run
```

### Run Tests

```bash
# Unit tests
cargo test

# Integration tests (requires running validator)
cargo test --test integration_tests -- --ignored
```

## Security

### Keypair Management

- **Never commit keypairs to version control**
- Store production keypairs in secure vaults (AWS Secrets Manager, HashiCorp Vault)
- Rotate keypairs periodically
- Use different keypairs for dev/staging/production

### Transaction Signing

- All transactions are signed by the API Gateway keypair
- Only authorized gateway can submit to Oracle program
- Engineering signatures are validated before blockchain submission

## Troubleshooting

### "Unauthorized Gateway" Error

The API Gateway keypair is not authorized in the Oracle program.

**Solution**:
```bash
# Re-initialize Oracle with correct gateway pubkey
anchor run update-oracle-gateway -- --new-gateway <YOUR_PUBKEY>
```

### "Insufficient Funds" Error

The API Gateway keypair doesn't have enough SOL for transaction fees.

**Solution**:
```bash
solana airdrop 2 $(solana-keygen pubkey ./keys/api-gateway-keypair.json) --url devnet
```

### "RPC Connection Failed"

Cannot connect to Solana RPC endpoint.

**Solution**:
- Check `SOLANA_RPC_URL` in `.env`
- Verify network connectivity
- Try alternative RPC endpoints (QuickNode, Alchemy, etc.)

## Performance

### Transaction Throughput

- **Target**: 100+ readings/minute
- **Actual**: ~50-100 TPS (limited by Solana confirmation time)
- **Latency**: ~400ms per transaction (confirmed)

### Optimization

For high-throughput scenarios:

1. **Batch Submissions**: Group multiple readings into single transaction
2. **Async Processing**: Use background workers for blockchain submissions
3. **Priority Fees**: Increase priority fees for faster confirmation

## Metrics

Key metrics exposed at `/metrics`:

- `api_gateway_blockchain_submissions_total` - Total blockchain submissions
- `api_gateway_blockchain_submission_duration_seconds` - Submission latency
- `api_gateway_blockchain_errors_total` - Failed submissions

## Roadmap

- [ ] Batch submission support
- [ ] Retry queue for failed transactions
- [ ] Transaction status polling
- [ ] Event listener for blockchain events
- [ ] Automatic market clearing scheduler
- [ ] Multi-signature support for admin operations

## References

- [Oracle Program Documentation](../anchor/docs/ORACLE.md)
- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)

---

**Last Updated**: 2025-09-30  
**Version**: 1.0.0
