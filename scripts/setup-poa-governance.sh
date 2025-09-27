#!/bin/bash
# =========================================================================
# GridTokenX PoA Governance Setup Script
# Configures Proof of Authority governance for University P2P Energy Trading
# =========================================================================

set -e

echo "🏛️ Starting GridTokenX PoA Governance Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SETUP_DIR")"
KEYPAIR_DIR="$PROJECT_ROOT/config/poa-governance"
ANCHOR_DIR="$PROJECT_ROOT/anchor"

# Authority configuration - Single ERC Authority
UNIVERSITY_AUTHORITY_NAME="University Engineering Department"
ERC_AUTHORITY="University Engineering Department - ERC Validator"

# Network configuration
CLUSTER="localnet"
RPC_URL="http://127.0.0.1:8899"

# Create directories
mkdir -p "$KEYPAIR_DIR"
mkdir -p "$PROJECT_ROOT/logs"

echo -e "${BLUE}📁 Created governance directories${NC}"

# Function to generate or load keypair
generate_or_load_keypair() {
    local name=$1
    local file_path="$KEYPAIR_DIR/${name}.json"
    
    if [[ -f "$file_path" ]]; then
        echo -e "${GREEN}✅ Found existing keypair: ${name}${NC}"
        local pubkey=$(solana-keygen pubkey "$file_path")
        echo -e "${BLUE}   Public Key: ${pubkey}${NC}"
    else
        echo -e "${YELLOW}🔑 Generating new keypair: ${name}${NC}"
        solana-keygen new --outfile "$file_path" --no-bip39-passphrase --force
        local pubkey=$(solana-keygen pubkey "$file_path")
        echo -e "${GREEN}   Generated: ${pubkey}${NC}"
        
        # Airdrop SOL for testing
        if [[ "$CLUSTER" == "localnet" ]]; then
            echo -e "${BLUE}💰 Airdropping SOL to ${name}...${NC}"
            solana airdrop 10 "$pubkey" --url "$RPC_URL" || true
        fi
    fi
}

# Check if validator is running
check_validator() {
    echo -e "${BLUE}🔍 Checking Solana validator status...${NC}"
    if ! curl -s "$RPC_URL" -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' > /dev/null 2>&1; then
        echo -e "${RED}❌ Solana validator is not running on ${RPC_URL}${NC}"
        echo -e "${YELLOW}   Please start the validator with: npm run anchor-localnet${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Solana validator is running${NC}"
}

# Generate authority keypairs
setup_authority_keypairs() {
    echo -e "${BLUE}🔐 Setting up authority keypairs...${NC}"
    
    # University Engineering Department - Single ERC Authority
    generate_or_load_keypair "engineering-authority"
    
    # Oracle authority for AMI data processing
    generate_or_load_keypair "oracle-authority"
    
    # Emergency authority for system control
    generate_or_load_keypair "emergency-authority"
    
    echo -e "${GREEN}✅ Authority keypairs configured - Single ERC Authority${NC}"
}

# Build and deploy programs
deploy_programs() {
    echo -e "${BLUE}🔨 Building and deploying Anchor programs...${NC}"
    
    cd "$ANCHOR_DIR"
    
    # Build programs
    echo -e "${BLUE}   Building programs...${NC}"
    anchor build
    
    # Deploy to localnet
    echo -e "${BLUE}   Deploying to ${CLUSTER}...${NC}"
    anchor deploy --provider.cluster "$CLUSTER"
    
    echo -e "${GREEN}✅ Programs deployed successfully${NC}"
    cd "$PROJECT_ROOT"
}

# Initialize governance
initialize_governance() {
    echo -e "${BLUE}🏛️ Initializing PoA governance...${NC}"
    
    cd "$ANCHOR_DIR"
    
    # Create initialization script
    cat > initialize_governance.ts << 'EOF'
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { Governance } from "../target/types/governance";
import fs from "fs";
import path from "path";

async function initializeGovernance() {
    // Set provider
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Governance as Program<Governance>;
    
    // Load authority keypairs - Single ERC Authority
    const keypairDir = path.join(__dirname, "../config/poa-governance");
    
    const engineeringAuthority = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(path.join(keypairDir, "engineering-authority.json"), "utf8")))
    );

    // Find PoA config PDA
    const [poaConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("poa_config")],
        program.programId
    );

    console.log("🏛️ Initializing PoA governance - Single ERC Authority...");
    console.log("   Engineering Authority (ERC):", engineeringAuthority.publicKey.toBase58());
    console.log("   PoA Config PDA:", poaConfigPda.toBase58());

    try {
        // Check if already initialized
        try {
            const config = await program.account.poAConfig.fetch(poaConfigPda);
            console.log("✅ PoA governance already initialized");
            console.log("   Current authority:", config.universityAuthority.toBase58());
            console.log("   REC validators:", config.authorizedRecValidators.length);
            return;
        } catch (error) {
            // Not initialized yet, continue with initialization
        }

        // Initialize PoA with single ERC authority
        const tx = await program.methods
            .initializePoa()
            .accounts({
                poaConfig: poaConfigPda,
                authority: engineeringAuthority.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([engineeringAuthority])
            .rpc();

        console.log("✅ PoA governance initialized successfully");
        console.log("   Transaction:", tx);
        
        // Fetch and display configuration
        const config = await program.account.poAConfig.fetch(poaConfigPda);
        console.log("📊 Configuration - Single ERC Authority:");
        console.log("   Engineering Authority:", config.authority.toBase58());
        console.log("   Emergency paused:", config.emergencyPaused);
        console.log("   ERC Validation: Engineering Department Only");
        console.log("   Created at:", new Date(config.createdAt * 1000).toISOString());

    } catch (error) {
        console.error("❌ Failed to initialize governance:", error);
        throw error;
    }
}

initializeGovernance()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });
EOF

    # Run initialization
    echo -e "${BLUE}   Running governance initialization...${NC}"
    npx ts-node initialize_governance.ts
    
    echo -e "${GREEN}✅ Governance initialized successfully${NC}"
    cd "$PROJECT_ROOT"
}

# Create governance management CLI
create_management_cli() {
    echo -e "${BLUE}🛠️ Creating governance management CLI...${NC}"
    
    cat > "$PROJECT_ROOT/scripts/poa-governance-cli.sh" << 'EOF'
#!/bin/bash
# PoA Governance Management CLI
# Usage: ./poa-governance-cli.sh <command> [args]

set -e

KEYPAIR_DIR="$(dirname "$0")/../config/poa-governance"
ANCHOR_DIR="$(dirname "$0")/../anchor"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

usage() {
    echo "GridTokenX PoA Governance CLI"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  status              Show governance status"
    echo "  emergency-pause     Emergency pause system"
    echo "  emergency-unpause   Emergency unpause system"
    echo "  network-health      Check network health"
    echo "  export-authorities  Export authority information"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 emergency-pause"
    echo "  $0 network-health"
}

show_status() {
    echo -e "${BLUE}📊 PoA Governance Status${NC}"
    cd "$ANCHOR_DIR"
    
    cat > check_status.ts << 'TSEOF'
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Governance } from "../target/types/governance";

async function checkStatus() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Governance as Program<Governance>;
    
    const [poaConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("poa_config")],
        program.programId
    );

    try {
        const config = await program.account.poAConfig.fetch(poaConfigPda);
        
        console.log("🏛️ PoA Configuration - Single ERC Authority:");
        console.log("   Program ID:", program.programId.toBase58());
        console.log("   Config PDA:", poaConfigPda.toBase58());
        console.log("   Engineering Authority:", config.authority.toBase58());
        console.log("   Emergency Paused:", config.emergencyPaused);
        console.log("   ERC Validation: Engineering Department Only");
        console.log("   Created At:", new Date(config.createdAt * 1000).toISOString());
        console.log("");
        
        console.log("📋 ERC Authority Status:");
        console.log("   ✅ Engineering Department - Complete Authority");
        console.log("   🔋 Energy Renewable Certificate Validation");
        console.log("   ⚡ P2P Energy Trading Governance");
        console.log("   � Emergency System Controls");
        
    } catch (error) {
        console.error("❌ Failed to fetch governance status:", error);
        console.log("   Make sure the governance program is initialized");
    }
}

checkStatus().then(() => process.exit(0)).catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
TSEOF

    npx ts-node check_status.ts
    rm check_status.ts
    cd - > /dev/null
}

emergency_pause() {
    echo -e "${RED}🚨 Emergency Pause System${NC}"
    echo -e "${YELLOW}Are you sure you want to pause the system? (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        cd "$ANCHOR_DIR"
        
        cat > emergency_pause.ts << 'TSEOF'
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { Governance } from "../target/types/governance";
import fs from "fs";
import path from "path";

async function emergencyPause() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Governance as Program<Governance>;
    
    const keypairDir = path.join(__dirname, "../config/poa-governance");
    const engineeringAuthority = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(path.join(keypairDir, "engineering-authority.json"), "utf8")))
    );
    
    const [poaConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("poa_config")],
        program.programId
    );

    try {
        const tx = await program.methods
            .emergencyPause()
            .accounts({
                poaConfig: poaConfigPda,
                authority: engineeringAuthority.publicKey,
            })
            .signers([engineeringAuthority])
            .rpc();
            
        console.log("🚨 Emergency pause activated");
        console.log("   Transaction:", tx);
        
    } catch (error) {
        console.error("❌ Failed to activate emergency pause:", error);
    }
}

emergencyPause().then(() => process.exit(0)).catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
TSEOF

        npx ts-node emergency_pause.ts
        rm emergency_pause.ts
        cd - > /dev/null
    else
        echo -e "${BLUE}Operation cancelled${NC}"
    fi
}

case "$1" in
    status)
        show_status
        ;;
    emergency-pause)
        emergency_pause
        ;;
    *)
        usage
        ;;
esac
EOF

    chmod +x "$PROJECT_ROOT/scripts/poa-governance-cli.sh"
    echo -e "${GREEN}✅ Management CLI created${NC}"
}

# Create configuration summary
create_config_summary() {
    echo -e "${BLUE}📄 Creating configuration summary...${NC}"
    
    cat > "$PROJECT_ROOT/config/poa-governance/CONFIGURATION.md" << EOF
# GridTokenX PoA Governance Configuration

## Setup Date
$(date)

## Authority Structure - Single ERC Authority

### Engineering Department Authority
- **Name**: ${UNIVERSITY_AUTHORITY_NAME}
- **Role**: Complete governance and ERC validation authority
- **Keypair**: engineering-authority.json
- **Public Key**: $(solana-keygen pubkey "$KEYPAIR_DIR/engineering-authority.json")
- **Capabilities**: 
  - Energy Renewable Certificate (ERC) validation
  - P2P energy trading governance
  - Emergency system controls
  - Complete system authority

### Support Authorities

#### Oracle Authority
- **Role**: AMI data processing
- **Keypair**: oracle-authority.json
- **Public Key**: $(solana-keygen pubkey "$KEYPAIR_DIR/oracle-authority.json")



#### Emergency Authority
- **Role**: Emergency system control
- **Keypair**: emergency-authority.json
- **Public Key**: $(solana-keygen pubkey "$KEYPAIR_DIR/emergency-authority.json")

## Network Configuration
- **Cluster**: ${CLUSTER}
- **RPC URL**: ${RPC_URL}
- **Governance Program**: $(grep governance "$ANCHOR_DIR/Anchor.toml" | grep -o '[A-Za-z0-9]*' | tail -1)

## Management Commands

### Check Status
\`\`\`bash
./scripts/poa-governance-cli.sh status
\`\`\`

### Emergency Controls
\`\`\`bash
./scripts/poa-governance-cli.sh emergency-pause
./scripts/poa-governance-cli.sh emergency-unpause
\`\`\`

### Validator Management
\`\`\`bash
./scripts/poa-governance-cli.sh list-validators
./scripts/poa-governance-cli.sh add-validator --pubkey <PUBKEY> --name "Department"
\`\`\`

## Security Notes
- All private keys are stored in config/poa-governance/
- Backup these keypairs securely
- Only university authority can modify governance
- Emergency pause available for immediate system shutdown
EOF

    echo -e "${GREEN}✅ Configuration summary created${NC}"
}

# Main execution flow
main() {
    echo -e "${GREEN}🎯 GridTokenX PoA Governance Setup${NC}"
    echo -e "${BLUE}   Cluster: ${CLUSTER}${NC}"
    echo -e "${BLUE}   RPC URL: ${RPC_URL}${NC}"
    echo ""
    
    # Check prerequisites
    check_validator
    
    # Setup process
    setup_authority_keypairs
    deploy_programs
    initialize_governance
    create_management_cli
    create_config_summary
    
    echo ""
    echo -e "${GREEN}🎉 PoA Governance Setup Complete!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo -e "   1. Check governance status: ${YELLOW}./scripts/poa-governance-cli.sh status${NC}"
    echo -e "   2. View configuration: ${YELLOW}cat config/poa-governance/CONFIGURATION.md${NC}"
    echo -e "   3. Test energy trading: ${YELLOW}npm run dev${NC}"
    echo ""
    echo -e "${BLUE}🔐 Important - Single ERC Authority:${NC}"
    echo -e "   - Backup keypairs in ${YELLOW}config/poa-governance/${NC}"
    echo -e "   - Keep engineering authority keypair secure"
    echo -e "   - Engineering Department has complete ERC validation control"
    echo -e "   - Emergency pause available if needed"
    echo ""
}

# Run main function
main "$@"