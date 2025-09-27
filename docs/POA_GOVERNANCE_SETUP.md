# GridTokenX PoA (Proof of Authority) Governance Setup Guide

## 🎯 Overview

This guide provides complete setup and management instructions for GridTokenX's Proof of Authority governance system, designed specifically for university-controlled P2P energy trading.

## 🏛️ PoA Architecture

### Authority Structure
- **University Authority**: Primary governance control (Engineering Department)
- **REC Validators**: Authorized validators for Renewable Energy Certificate processing
  - Sustainability Office
  - Engineering Department  
  - Facilities Management
- **Emergency Controls**: Immediate system pause/unpause capabilities

### Key Features
- **Single Authority Consensus**: University maintains complete control
- **Permissioned Network**: Only authorized participants can join
- **REC Certification**: Built-in renewable energy certificate validation
- **Emergency Response**: Immediate system shutdown capabilities
- **Audit Trail**: Complete transaction and governance logging

## 🚀 Quick Setup

### Prerequisites
1. **Solana Validator Running**:
   ```bash
   npm run anchor-localnet
   ```

2. **Environment Configured**:
   - Ensure `.env` has `NODE_ENV=development`
   - Solana RPC accessible at `http://127.0.0.1:8899`

### Automated Setup
```bash
# Run the complete setup script
./scripts/setup-poa-governance.sh
```

This script will:
- ✅ Generate authority keypairs
- ✅ Build and deploy Anchor programs  
- ✅ Initialize PoA governance
- ✅ Configure REC validators
- ✅ Create management CLI tools

## 🔧 Management Commands

### Status & Information
```bash
# Check complete governance status
./scripts/poa-governance-cli.sh status

# List all REC validators
./scripts/poa-governance-cli.sh list-validators

# Check network health
./scripts/poa-governance-cli.sh network-health

# Export authority information
./scripts/poa-governance-cli.sh export-authorities
```

### Validator Management
```bash
# Add new REC validator
./scripts/poa-governance-cli.sh add-validator \
  --pubkey 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM \
  --name "IT Department"

# Activate/deactivate validators
./scripts/poa-governance-cli.sh activate-validator --pubkey <PUBKEY>
./scripts/poa-governance-cli.sh deactivate-validator --pubkey <PUBKEY>

# Remove validator (careful!)
./scripts/poa-governance-cli.sh remove-validator --pubkey <PUBKEY>
```

### Emergency Controls
```bash
# Emergency pause system (all trading stops)
./scripts/poa-governance-cli.sh emergency-pause

# Resume system operations
./scripts/poa-governance-cli.sh emergency-unpause

# Check emergency status
./scripts/poa-governance-cli.sh emergency-status
```

### Configuration Management
```bash
# Update minimum validator requirement
./scripts/poa-governance-cli.sh update-min-validators 3

# Backup governance configuration
./scripts/poa-governance-cli.sh backup-config

# Test governance functionality
./scripts/poa-governance-cli.sh test-governance
```

## 🌐 Web Interface

### Access PoA Dashboard
1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Navigate to Governance**:
   - Open http://localhost:5174
   - Click "PoA Governance" in navigation
   - Or go directly to: http://localhost:5174/governance

### Dashboard Features
- 📊 **Real-time Status**: System health, validator count, emergency state
- 👥 **Validator Management**: View, add, activate/deactivate validators
- 🚨 **Emergency Controls**: Pause/unpause system (authority only)
- ⚙️ **Configuration**: View governance settings and authority info
- 📋 **Management Commands**: CLI command references

## 🔐 Authority Management

### Generated Keypairs
All authority keypairs are stored in `config/poa-governance/`:

```
config/poa-governance/
├── university-authority.json      # Primary governance authority
├── sustainability-validator.json  # Sustainability Office validator
├── engineering-validator.json     # Engineering Department validator
├── facilities-validator.json      # Facilities Management validator
├── oracle-authority.json          # Oracle data processing
├── rec-validator.json             # REC validation services
└── emergency-authority.json       # Emergency control authority
```

### Public Key Display
```bash
# View all authority public keys
for keypair in config/poa-governance/*.json; do
  echo "$(basename $keypair .json): $(solana-keygen pubkey $keypair)"
done
```

### Authority Verification
```bash
# Check if specific authority is configured
./scripts/poa-governance-cli.sh validator-info <PUBKEY>

# Verify university authority
./scripts/poa-governance-cli.sh status | grep "University Authority"
```

## 🏫 University Integration

### Engineering Department Benefits
1. **Complete Control**: University maintains full system authority
2. **Academic Research**: Real blockchain implementation for studies
3. **Student Projects**: Hands-on experience with PoA systems
4. **Energy Optimization**: Internal P2P energy trading
5. **Sustainability Goals**: Maximized renewable energy usage

### Operational Workflow
1. **Normal Operations**: Validators process REC certificates automatically
2. **Emergency Response**: Immediate pause capability for incidents
3. **Validator Management**: Add/remove departments as needed
4. **Audit Compliance**: Complete transaction and governance logging
5. **System Maintenance**: Controlled environment updates

## 🚨 Emergency Procedures

### Emergency Pause Activation
**When to Use**: Security incidents, system failures, maintenance
```bash
# Immediate pause
./scripts/poa-governance-cli.sh emergency-pause

# Or via web interface (authority only)
# Navigate to Governance → Emergency Controls → Emergency Pause
```

**Effects**:
- ❌ All energy trading halted
- ❌ REC certificate processing stopped  
- ❌ New transactions blocked
- ✅ System state preserved
- ✅ Blockchain continues running

### Emergency Recovery
```bash
# Resume operations when ready
./scripts/poa-governance-cli.sh emergency-unpause

# Verify system is operational
./scripts/poa-governance-cli.sh status
./scripts/poa-governance-cli.sh network-health
```

### Authority Transfer (Emergency)
**⚠️ USE WITH EXTREME CAUTION**
```bash
# Only if primary authority is compromised
./scripts/poa-governance-cli.sh transfer-authority --to <NEW_AUTHORITY_PUBKEY>
```

## 📊 Monitoring & Analytics

### System Health Indicators
- ✅ **Healthy**: Active validators ≥ minimum required
- ⚠️ **Warning**: Active validators = minimum required
- ❌ **Critical**: Active validators < minimum required
- 🚨 **Emergency**: System paused

### Real-time Monitoring
```bash
# Continuous status monitoring
watch -n 10 "./scripts/poa-governance-cli.sh status"

# Network health monitoring
watch -n 5 "./scripts/poa-governance-cli.sh network-health"
```

### Log Analysis
```bash
# View governance events
anchor logs --program governance

# Monitor validator activity
solana logs --url http://127.0.0.1:8899
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Governance not initialized"
**Solution**: Run setup script
```bash
./scripts/setup-poa-governance.sh
```

#### 2. "Unauthorized authority" errors
**Cause**: Wrong wallet connected or authority mismatch
**Solution**: 
- Check connected wallet matches university authority
- Verify authority public key: `./scripts/poa-governance-cli.sh status`

#### 3. "Insufficient validators" error
**Cause**: Too few active validators
**Solution**:
```bash
# Check validator status
./scripts/poa-governance-cli.sh list-validators

# Activate inactive validators
./scripts/poa-governance-cli.sh activate-validator --pubkey <PUBKEY>

# Or lower minimum requirement (temporary)
./scripts/poa-governance-cli.sh update-min-validators 1
```

#### 4. Network connectivity issues
**Solution**: Restart validator
```bash
# Stop current validator
pkill solana-test-validator

# Restart
npm run anchor-localnet
```

### Debug Information
```bash
# Full system diagnosis
./scripts/poa-governance-cli.sh network-health
./scripts/poa-governance-cli.sh status
./scripts/poa-governance-cli.sh list-validators

# Check Solana network
solana validators --url http://127.0.0.1:8899
solana block-height --url http://127.0.0.1:8899
```

## 📚 Development Integration

### Testing Governance Features
```bash
# Run governance functionality tests
./scripts/poa-governance-cli.sh test-governance

# Test emergency procedures
./scripts/poa-governance-cli.sh emergency-pause
sleep 5
./scripts/poa-governance-cli.sh emergency-unpause
```

### Frontend Development
The governance interface is integrated at `/governance`:
- **Status Dashboard**: Real-time system health
- **Validator Management**: Add/remove/activate validators
- **Emergency Controls**: Pause/unpause system
- **Configuration View**: Authority and settings display

### API Integration
Mock API endpoints for development:
- `GET /api/governance/config` - Get governance configuration
- `POST /api/governance/emergency-pause` - Activate emergency pause
- `POST /api/governance/emergency-unpause` - Deactivate emergency pause
- `POST /api/governance/add-validator` - Add new validator

## 🎯 Next Steps

### Production Deployment
1. **Secure Keypairs**: Move keypairs to secure hardware
2. **Network Configuration**: Configure production Solana cluster
3. **Authority Distribution**: Distribute authority across departments
4. **Monitoring Setup**: Implement 24/7 system monitoring
5. **Backup Procedures**: Regular governance configuration backups

### Feature Enhancements
- **Multi-signature** authority controls
- **Voting mechanisms** for governance changes
- **Automated** validator health monitoring
- **Integration** with university identity systems
- **Advanced analytics** and reporting

---

## 🎉 Success!

Your GridTokenX PoA governance system is now configured and ready for university P2P energy trading operations!

**Key Benefits Achieved**:
- ✅ Complete university control over energy trading
- ✅ Secure REC certificate validation
- ✅ Emergency response capabilities
- ✅ Comprehensive management tools
- ✅ Real-time monitoring and analytics
- ✅ Academic research platform

**Access Points**:
- **Web Interface**: http://localhost:5174/governance
- **CLI Management**: `./scripts/poa-governance-cli.sh`
- **Status Check**: `./scripts/poa-governance-cli.sh status`

For support or questions, consult this documentation or check the command help:
```bash
./scripts/poa-governance-cli.sh help
```