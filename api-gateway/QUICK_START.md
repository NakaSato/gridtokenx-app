# Quick Start: Blockchain Integration

Get the blockchain integration running in 5 minutes.

## Prerequisites

- Rust 1.70+
- Solana CLI 1.17+
- PostgreSQL running
- Redis running

## Setup Steps

### 1. Generate Keypair (1 minute)

```bash
cd api-gateway
./scripts/generate-keypair.sh
```

This creates `./keys/api-gateway-keypair.json`.

### 2. Configure Environment (1 minute)

```bash
cp .env.example .env
```

Edit `.env`:
```bash
BLOCKCHAIN_ENABLED=true
SOLANA_RPC_URL=http://localhost:8899
ORACLE_PROGRAM_ID=5DF1fmjrXTtG7qsFaLUm5TjJMG7M1a2V7kyTWPjoADV5
API_GATEWAY_KEYPAIR_PATH=./keys/api-gateway-keypair.json
```

### 3. Fund Keypair (1 minute)

```bash
# Get public key
PUBKEY=$(solana-keygen pubkey ./keys/api-gateway-keypair.json)

# Airdrop SOL (devnet)
solana airdrop 2 $PUBKEY --url devnet
```

### 4. Build & Run (2 minutes)

```bash
cargo build --release
cargo run
```

## Test It

### Test Health Endpoint

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "healthy",
  "blockchain": {
    "enabled": true,
    "connected": true
  }
}
```

### Submit Meter Reading

```bash
curl -X POST http://localhost:8080/api/v1/meters/readings \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "meter_id": "TEST-001",
    "timestamp": "2025-09-30T09:00:00Z",
    "energy_generated": 5.5,
    "energy_consumed": 3.2,
    "engineering_authority_signature": "test-sig"
  }'
```

Expected response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "meter_id": "TEST-001",
  "timestamp": "2025-09-30T09:00:00Z",
  "status": "blockchain_submitted",
  "created_at": "2025-09-30T09:00:01Z"
}
```

## Local Testing

### Start Test Validator

```bash
# Terminal 1
solana-test-validator
```

### Deploy Oracle Program

```bash
# Terminal 2
cd ../anchor
anchor build
anchor deploy --provider.cluster localnet
```

### Initialize Oracle

```bash
anchor run initialize-oracle -- --api-gateway $PUBKEY
```

### Run Tests

```bash
# Terminal 3
cd ../api-gateway
./scripts/test-blockchain-integration.sh
```

## Troubleshooting

### "Blockchain service not available"

**Cause**: Keypair file not found or invalid  
**Fix**: Run `./scripts/generate-keypair.sh`

### "Insufficient funds"

**Cause**: Keypair has no SOL  
**Fix**: `solana airdrop 2 $PUBKEY --url devnet`

### "Unauthorized gateway"

**Cause**: Oracle not initialized with your pubkey  
**Fix**: `anchor run initialize-oracle -- --api-gateway $PUBKEY`

### "RPC connection failed"

**Cause**: Solana validator not running  
**Fix**: Start `solana-test-validator` in another terminal

## Configuration Options

### Disable Blockchain

```bash
# In .env
BLOCKCHAIN_ENABLED=false
```

API Gateway will run without blockchain integration.

### Use Different RPC

```bash
# Devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Mainnet (production only)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### Custom Oracle Program

```bash
ORACLE_PROGRAM_ID=YourProgramId1111111111111111111111111
```

## Next Steps

1. **Production Setup**: See `BLOCKCHAIN_INTEGRATION.md`
2. **Integration Testing**: See `WEEK1_IMPLEMENTATION_SUMMARY.md`
3. **Simulator Integration**: Update simulator `.env` with gateway URL

## Support

- Full documentation: `BLOCKCHAIN_INTEGRATION.md`
- Test script: `./scripts/test-blockchain-integration.sh`
- Logs: `logs/api-gateway.log`

---

**Ready to go!** 🚀
