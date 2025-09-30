# Deployment Guide

Complete guide for deploying GridTokenX Anchor programs to Solana.

## Prerequisites

### System Requirements

- **OS**: Linux, macOS, or WSL2 on Windows
- **RAM**: Minimum 8GB, recommended 16GB
- **Disk**: 20GB free space
- **Network**: Stable internet connection

### Software Requirements

```bash
# Rust (1.75.0 or later)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable

# Solana CLI (1.18.0 or later)
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Anchor CLI (0.31.1)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.31.1
avm use 0.31.1

# Node.js (18+) and pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Verify Installation

```bash
rustc --version    # Should show 1.75.0 or later
solana --version   # Should show 1.18.0 or later
anchor --version   # Should show 0.31.1
node --version     # Should show v18.0.0 or later
pnpm --version     # Should show 8.0.0 or later
```

## Network Configuration

### Localnet (Development)

```bash
# Configure Solana CLI for localnet
solana config set --url localhost

# Start local validator
solana-test-validator

# In another terminal, check status
solana cluster-version
```

### Devnet (Testing)

```bash
# Configure for devnet
solana config set --url devnet

# Request airdrop for testing
solana airdrop 2

# Check balance
solana balance
```

### Mainnet (Production)

```bash
# Configure for mainnet
solana config set --url mainnet-beta

# IMPORTANT: Use a secure wallet for mainnet
# Never use test keypairs on mainnet
```

## Wallet Setup

### Create Deployment Wallet

```bash
# Generate new keypair
solana-keygen new --outfile ~/.config/solana/deployer.json

# Set as default wallet
solana config set --keypair ~/.config/solana/deployer.json

# Get wallet address
solana address

# Fund wallet (devnet)
solana airdrop 5

# Fund wallet (mainnet)
# Transfer SOL from exchange or another wallet
```

### Secure Wallet Management

For production deployments:

```bash
# Use hardware wallet (Ledger)
solana-keygen pubkey usb://ledger

# Or use encrypted keypair
solana-keygen new --outfile ~/.config/solana/deployer-encrypted.json --no-bip39-passphrase
```

## Build Programs

### Clone and Setup

```bash
# Clone repository
git clone <repository-url>
cd anchor

# Install dependencies
pnpm install

# Build all programs
anchor build
```

### Verify Build

```bash
# Check build artifacts
ls -lh target/deploy/

# You should see:
# - energy_token.so
# - governance.so
# - oracle.so
# - registry.so
# - trading.so
```

### Update Program IDs

After first build, update program IDs in `Anchor.toml` and program files:

```bash
# Get program IDs from keypairs
solana address -k target/deploy/energy_token-keypair.json
solana address -k target/deploy/governance-keypair.json
solana address -k target/deploy/oracle-keypair.json
solana address -k target/deploy/registry-keypair.json
solana address -k target/deploy/trading-keypair.json
```

Update `Anchor.toml`:

```toml
[programs.localnet]
energy_token = "<ENERGY_TOKEN_PROGRAM_ID>"
governance = "<GOVERNANCE_PROGRAM_ID>"
oracle = "<ORACLE_PROGRAM_ID>"
registry = "<REGISTRY_PROGRAM_ID>"
trading = "<TRADING_PROGRAM_ID>"
```

Update `declare_id!()` in each program's `lib.rs`:

```rust
// programs/energy-token/src/lib.rs
declare_id!("<ENERGY_TOKEN_PROGRAM_ID>");
```

Rebuild after updating IDs:

```bash
anchor build
```

## Deploy Programs

### Deploy to Localnet

```bash
# Ensure local validator is running
solana-test-validator

# Deploy all programs
anchor deploy

# Verify deployment
solana program show <PROGRAM_ID>
```

### Deploy to Devnet

```bash
# Configure for devnet
solana config set --url devnet

# Ensure sufficient balance (each program ~2-5 SOL)
solana balance

# Deploy all programs
anchor deploy

# Verify deployment
anchor test --skip-local-validator
```

### Deploy to Mainnet

```bash
# Configure for mainnet
solana config set --url mainnet-beta

# CRITICAL: Verify you have sufficient SOL
# Each program requires 2-5 SOL for deployment
solana balance

# Deploy programs one by one for better control
anchor deploy --program-name registry
anchor deploy --program-name energy_token
anchor deploy --program-name trading
anchor deploy --program-name oracle
anchor deploy --program-name governance

# Verify each deployment
solana program show <PROGRAM_ID>
```

## Initialize Programs

### 1. Initialize Registry

```typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

const provider = AnchorProvider.env();
const registryProgram = new Program(registryIdl, registryProgramId, provider);

const [registryPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("registry")],
  registryProgram.programId
);

await registryProgram.methods
  .initialize()
  .accounts({
    registry: registryPDA,
    authority: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

console.log("Registry initialized");
```

### 2. Initialize Energy Token

```typescript
const [tokenInfoPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("token_info")],
  energyTokenProgram.programId
);

const [mintPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("mint")],
  energyTokenProgram.programId
);

await energyTokenProgram.methods
  .initializeToken()
  .accounts({
    tokenInfo: tokenInfoPDA,
    mint: mintPDA,
    authority: provider.wallet.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .rpc();

console.log("Energy Token initialized");
```

### 3. Initialize Trading Market

```typescript
const [marketPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("market")],
  tradingProgram.programId
);

await tradingProgram.methods
  .initializeMarket()
  .accounts({
    market: marketPDA,
    authority: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

console.log("Trading Market initialized");
```

### 4. Initialize Oracle

```typescript
const [oracleDataPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("oracle")],
  oracleProgram.programId
);

await oracleProgram.methods
  .initialize(apiGatewayPublicKey)
  .accounts({
    oracleData: oracleDataPDA,
    authority: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

console.log("Oracle initialized with API Gateway");
```

### 5. Initialize Governance

```typescript
const [poaConfigPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("poa_config")],
  governanceProgram.programId
);

await governanceProgram.methods
  .initializePoa()
  .accounts({
    poaConfig: poaConfigPDA,
    authority: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

console.log("PoA Governance initialized");
```

## Post-Deployment Configuration

### Add REC Validator

```typescript
const [recValidatorPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("rec_validator"),
    validatorPublicKey.toBuffer()
  ],
  energyTokenProgram.programId
);

await energyTokenProgram.methods
  .addRecValidator(
    validatorPublicKey,
    "University Engineering Department"
  )
  .accounts({
    tokenInfo: tokenInfoPDA,
    recValidator: recValidatorPDA,
    authority: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Configure Market Parameters

```typescript
await tradingProgram.methods
  .updateMarketParams(
    25,    // 0.25% fee
    true   // Clearing enabled
  )
  .accounts({
    market: marketPDA,
    authority: provider.wallet.publicKey,
  })
  .rpc();
```

## Upgrade Programs

### Prepare Upgrade

```bash
# Build new version
anchor build

# Check upgrade authority
solana program show <PROGRAM_ID>

# Ensure you have upgrade authority
```

### Perform Upgrade

```bash
# Upgrade specific program
solana program deploy \
  --program-id <PROGRAM_KEYPAIR_PATH> \
  --upgrade-authority <AUTHORITY_KEYPAIR> \
  target/deploy/<PROGRAM_NAME>.so

# Example
solana program deploy \
  --program-id target/deploy/registry-keypair.json \
  --upgrade-authority ~/.config/solana/deployer.json \
  target/deploy/registry.so
```

### Verify Upgrade

```bash
# Check program info
solana program show <PROGRAM_ID>

# Run tests
anchor test --skip-local-validator
```

## Monitoring & Maintenance

### Check Program Status

```bash
# Get program info
solana program show <PROGRAM_ID>

# Check program balance
solana balance <PROGRAM_ID>

# View recent transactions
solana transaction-history <PROGRAM_ID>
```

### Monitor Events

```typescript
// Listen for program events
registryProgram.addEventListener('UserRegistered', (event, slot) => {
  console.log('User registered:', event);
});

tradingProgram.addEventListener('OrdersMatched', (event, slot) => {
  console.log('Trade executed:', event);
});
```

### Backup Critical Data

```bash
# Backup program keypairs
cp -r target/deploy/*-keypair.json ~/backups/

# Backup wallet
cp ~/.config/solana/deployer.json ~/backups/

# Encrypt backups
gpg -c ~/backups/deployer.json
```

## Troubleshooting

### Insufficient Balance

```bash
# Check balance
solana balance

# Request airdrop (devnet only)
solana airdrop 5

# For mainnet, transfer SOL from exchange
```

### Program Already Deployed

```bash
# Close existing program (localnet only)
solana program close <PROGRAM_ID>

# Or use different program ID
solana-keygen new --outfile target/deploy/new-program-keypair.json
```

### Build Errors

```bash
# Clean build
anchor clean
rm -rf target/

# Rebuild
anchor build

# Update dependencies
cargo update
```

### Deployment Fails

```bash
# Increase compute units
solana program deploy \
  --max-len 500000 \
  --with-compute-unit-price 1000 \
  target/deploy/<PROGRAM_NAME>.so
```

## Cost Estimation

### Deployment Costs (Approximate)

| Program | Size | Devnet | Mainnet |
|---------|------|--------|---------|
| Registry | ~50KB | 0.5 SOL | 2-3 SOL |
| Energy Token | ~60KB | 0.6 SOL | 2.5-3.5 SOL |
| Trading | ~70KB | 0.7 SOL | 3-4 SOL |
| Oracle | ~40KB | 0.4 SOL | 1.5-2.5 SOL |
| Governance | ~80KB | 0.8 SOL | 3.5-4.5 SOL |
| **Total** | ~300KB | **3 SOL** | **13-18 SOL** |

### Transaction Costs

- Localnet: Free
- Devnet: Free (with airdrop)
- Mainnet: ~0.000005 SOL per transaction

## Security Checklist

- [ ] Secure wallet keypairs with encryption
- [ ] Use hardware wallet for mainnet deployments
- [ ] Backup all program keypairs
- [ ] Verify program IDs in all configurations
- [ ] Test thoroughly on devnet before mainnet
- [ ] Set up monitoring and alerts
- [ ] Document upgrade authority
- [ ] Implement emergency pause procedures
- [ ] Audit smart contracts before mainnet
- [ ] Set up multi-sig for critical operations

## Rollback Procedure

If issues arise after deployment:

```bash
# 1. Activate emergency pause (if available)
# Use governance program to pause system

# 2. Rollback to previous version
solana program deploy \
  --program-id <PROGRAM_KEYPAIR> \
  --upgrade-authority <AUTHORITY> \
  ~/backups/<PREVIOUS_VERSION>.so

# 3. Verify rollback
solana program show <PROGRAM_ID>

# 4. Test functionality
anchor test --skip-local-validator

# 5. Resume operations
# Use governance program to unpause
```

## Support & Resources

- **Anchor Documentation**: https://www.anchor-lang.com/
- **Solana Documentation**: https://docs.solana.com/
- **Discord**: Solana & Anchor community channels
- **GitHub Issues**: Report bugs and request features

---

**Last Updated**: 2025-09-30
