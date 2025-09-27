#!/bin/bash
# =========================================================================
# GridTokenX PoA Governance Management CLI
# Comprehensive management tool for Proof of Authority governance
# =========================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
KEYPAIR_DIR="$PROJECT_ROOT/config/poa-governance"
ANCHOR_DIR="$PROJECT_ROOT/anchor"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Network settings
CLUSTER="localnet"
RPC_URL="http://127.0.0.1:8899"

usage() {
    echo -e "${GREEN}🏛️ GridTokenX PoA Governance Management CLI${NC}"
    echo ""
    echo -e "${BLUE}Usage:${NC} $0 <command> [options]"
    echo ""
    echo -e "${YELLOW}📊 Status & Information:${NC}"
    echo "  status                    Show complete governance status"
    echo "  list-validators           List all REC validators"
    echo "  validator-info <pubkey>   Show specific validator information"
    echo "  network-health           Check network and validator health"
    echo ""
    echo -e "${YELLOW}👥 Validator Management:${NC}"
    echo "  add-validator --pubkey <KEY> --name \"Name\"    Add new REC validator"
    echo "  remove-validator --pubkey <KEY>              Remove REC validator"
    echo "  activate-validator --pubkey <KEY>            Activate validator"
    echo "  deactivate-validator --pubkey <KEY>          Deactivate validator"
    echo ""
    echo -e "${YELLOW}⚙️ Governance Settings:${NC}"
    echo "  update-min-validators <count>    Update minimum validator requirement"
    echo "  transfer-authority --to <KEY>    Transfer university authority (CAREFUL!)"
    echo ""
    echo -e "${YELLOW}🚨 Emergency Controls:${NC}"
    echo "  emergency-pause          Emergency pause entire system"
    echo "  emergency-unpause        Emergency unpause system"
    echo "  emergency-status         Check emergency pause status"
    echo ""
    echo -e "${YELLOW}🔧 Maintenance:${NC}"
    echo "  backup-config           Backup governance configuration"
    echo "  restore-config          Restore governance configuration"
    echo "  export-authorities      Export all authority public keys"
    echo "  test-governance         Run governance functionality tests"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 status"
    echo "  $0 add-validator --pubkey 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM --name \"IT Department\""
    echo "  $0 emergency-pause"
    echo "  $0 update-min-validators 3"
}

# Check prerequisites
check_prerequisites() {
    # Check if validator is running
    if ! curl -s "$RPC_URL" -X POST -H "Content-Type: application/json" \
         -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' > /dev/null 2>&1; then
        echo -e "${RED}❌ Solana validator is not running on ${RPC_URL}${NC}"
        echo -e "${YELLOW}   Please start: npm run anchor-localnet${NC}"
        exit 1
    fi
    
    # Check if anchor directory exists
    if [[ ! -d "$ANCHOR_DIR" ]]; then
        echo -e "${RED}❌ Anchor directory not found: ${ANCHOR_DIR}${NC}"
        exit 1
    fi
    
    # Check if keypair directory exists
    if [[ ! -d "$KEYPAIR_DIR" ]]; then
        echo -e "${RED}❌ Governance keypairs not found. Run setup first:${NC}"
        echo -e "${YELLOW}   ./scripts/setup-poa-governance.sh${NC}"
        exit 1
    fi
}

# Show comprehensive governance status
show_status() {
    echo -e "${BLUE}📊 GridTokenX PoA Governance Status${NC}"
    echo -e "${BLUE}$(date)${NC}"
    echo ""
    
    cd "$ANCHOR_DIR"
    
    cat > check_status.ts << 'EOF'
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Governance } from "../target/types/governance";

async function showStatus() {
    try {
        const provider = anchor.AnchorProvider.env();
        anchor.setProvider(provider);
        const program = anchor.workspace.Governance as Program<Governance>;
        
        // Get program info
        const programInfo = await provider.connection.getAccountInfo(program.programId);
        const [poaConfigPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("poa_config")],
            program.programId
        );

        console.log("🏛️ Program Information:");
        console.log(`   Program ID: ${program.programId.toBase58()}`);
        console.log(`   Program Owner: ${programInfo?.owner.toBase58()}`);
        console.log(`   Config PDA: ${poaConfigPda.toBase58()}`);
        console.log("");

        // Get cluster info
        const clusterVersion = await provider.connection.getVersion();
        const blockHeight = await provider.connection.getBlockHeight();
        const slotLeader = await provider.connection.getSlotLeader();
        
        console.log("🌐 Network Information:");
        console.log(`   Cluster: localnet`);
        console.log(`   RPC URL: ${provider.connection.rpcEndpoint}`);
        console.log(`   Solana Version: ${clusterVersion['solana-core']}`);
        console.log(`   Block Height: ${blockHeight}`);
        console.log(`   Slot Leader: ${slotLeader.toBase58()}`);
        console.log("");

        // Get governance configuration
        try {
            const config = await program.account.poAConfig.fetch(poaConfigPda);
            
            console.log("⚙️ Governance Configuration:");
            console.log(`   University Authority: ${config.universityAuthority.toBase58()}`);
            console.log(`   Emergency Paused: ${config.emergencyPaused ? '🚨 YES' : '✅ No'}`);
            console.log(`   Min REC Validators: ${config.minRecValidators}`);
            console.log(`   Created: ${new Date(config.createdAt * 1000).toISOString()}`);
            console.log("");
            
            console.log("👥 REC Validators:");
            if (config.authorizedRecValidators.length === 0) {
                console.log("   No validators configured");
            } else {
                config.authorizedRecValidators.forEach((validator, index) => {
                    const status = validator.active ? "🟢 Active" : "🔴 Inactive";
                    const authority = validator.certificationAuthority ? "🏛️ Cert Authority" : "🔹 Standard";
                    console.log(`   ${index + 1}. ${validator.authorityName}`);
                    console.log(`      📍 ${validator.pubkey.toBase58()}`);
                    console.log(`      🏷️ ${status} | ${authority}`);
                    console.log(`      📅 Added: ${new Date(validator.addedAt * 1000).toLocaleDateString()}`);
                    console.log("");
                });
            }
            
            const activeCount = config.authorizedRecValidators.filter(v => v.active).length;
            const totalCount = config.authorizedRecValidators.length;
            const healthStatus = activeCount >= config.minRecValidators ? "🟢 Healthy" : "🔴 Insufficient";
            
            console.log("📈 System Health:");
            console.log(`   Active Validators: ${activeCount}/${totalCount}`);
            console.log(`   Minimum Required: ${config.minRecValidators}`);
            console.log(`   System Status: ${healthStatus}`);
            console.log(`   Emergency State: ${config.emergencyPaused ? '🚨 PAUSED' : '✅ Operational'}`);
            
        } catch (error) {
            console.log("❌ Governance not initialized");
            console.log("   Run: ./scripts/setup-poa-governance.sh");
        }
        
    } catch (error) {
        console.error("❌ Error fetching status:", error.message);
        process.exit(1);
    }
}

showStatus().then(() => process.exit(0));
EOF

    npx ts-node check_status.ts
    rm check_status.ts
    cd "$PROJECT_ROOT"
}

# List all validators with detailed info
list_validators() {
    echo -e "${BLUE}👥 REC Validators List${NC}"
    echo ""
    
    cd "$ANCHOR_DIR"
    
    cat > list_validators.ts << 'EOF'
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Governance } from "../target/types/governance";

async function listValidators() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Governance as Program<Governance>;
    
    const [poaConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("poa_config")],
        program.programId
    );

    try {
        const config = await program.account.poAConfig.fetch(poaConfigPda);
        
        if (config.authorizedRecValidators.length === 0) {
            console.log("📋 No REC validators configured");
            return;
        }
        
        console.log(`📋 Total Validators: ${config.authorizedRecValidators.length}`);
        console.log(`⚙️ Minimum Required: ${config.minRecValidators}`);
        console.log("");
        
        config.authorizedRecValidators.forEach((validator, index) => {
            const statusIcon = validator.active ? "🟢" : "🔴";
            const authorityIcon = validator.certificationAuthority ? "🏛️" : "🔹";
            
            console.log(`${statusIcon} ${index + 1}. ${validator.authorityName}`);
            console.log(`   Public Key: ${validator.pubkey.toBase58()}`);
            console.log(`   Status: ${validator.active ? 'Active' : 'Inactive'}`);
            console.log(`   Certification Authority: ${validator.certificationAuthority ? 'Yes' : 'No'} ${authorityIcon}`);
            console.log(`   Added: ${new Date(validator.addedAt * 1000).toLocaleString()}`);
            console.log("");
        });
        
        const activeCount = config.authorizedRecValidators.filter(v => v.active).length;
        console.log(`📊 Summary: ${activeCount} active validators (${config.minRecValidators} required)`);
        
    } catch (error) {
        console.error("❌ Failed to fetch validators:", error.message);
    }
}

listValidators().then(() => process.exit(0));
EOF

    npx ts-node list_validators.ts
    rm list_validators.ts
    cd "$PROJECT_ROOT"
}

# Emergency pause system
emergency_pause() {
    echo -e "${RED}🚨 EMERGENCY SYSTEM PAUSE${NC}"
    echo -e "${YELLOW}This will immediately halt all energy trading operations.${NC}"
    echo -e "${YELLOW}Are you sure you want to proceed? (type 'PAUSE' to confirm)${NC}"
    read -r confirmation
    
    if [[ "$confirmation" != "PAUSE" ]]; then
        echo -e "${BLUE}Operation cancelled${NC}"
        return
    fi
    
    echo -e "${RED}Initiating emergency pause...${NC}"
    
    cd "$ANCHOR_DIR"
    
    cat > emergency_pause.ts << 'EOF'
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
    const universityAuthority = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(path.join(keypairDir, "university-authority.json"), "utf8")))
    );
    
    const [poaConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("poa_config")],
        program.programId
    );

    try {
        console.log("🚨 Activating emergency pause...");
        
        const tx = await program.methods
            .emergencyPause()
            .accounts({
                poaConfig: poaConfigPda,
                authority: universityAuthority.publicKey,
            })
            .signers([universityAuthority])
            .rpc();
            
        console.log("✅ Emergency pause activated successfully");
        console.log(`   Transaction: ${tx}`);
        console.log(`   Authority: ${universityAuthority.publicKey.toBase58()}`);
        console.log(`   Timestamp: ${new Date().toISOString()}`);
        console.log("");
        console.log("🔒 All energy trading operations are now PAUSED");
        console.log("   Use 'emergency-unpause' to restore operations");
        
    } catch (error) {
        console.error("❌ Failed to activate emergency pause:", error.message);
        process.exit(1);
    }
}

emergencyPause().then(() => process.exit(0));
EOF

    npx ts-node emergency_pause.ts
    rm emergency_pause.ts
    cd "$PROJECT_ROOT"
}

# Emergency unpause system
emergency_unpause() {
    echo -e "${GREEN}✅ EMERGENCY SYSTEM UNPAUSE${NC}"
    echo -e "${YELLOW}This will restore all energy trading operations.${NC}"
    echo -e "${YELLOW}Are you sure the system is ready? (type 'UNPAUSE' to confirm)${NC}"
    read -r confirmation
    
    if [[ "$confirmation" != "UNPAUSE" ]]; then
        echo -e "${BLUE}Operation cancelled${NC}"
        return
    fi
    
    echo -e "${GREEN}Deactivating emergency pause...${NC}"
    
    cd "$ANCHOR_DIR"
    
    cat > emergency_unpause.ts << 'EOF'
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { Governance } from "../target/types/governance";
import fs from "fs";
import path from "path";

async function emergencyUnpause() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Governance as Program<Governance>;
    
    const keypairDir = path.join(__dirname, "../config/poa-governance");
    const universityAuthority = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(path.join(keypairDir, "university-authority.json"), "utf8")))
    );
    
    const [poaConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("poa_config")],
        program.programId
    );

    try {
        console.log("✅ Deactivating emergency pause...");
        
        const tx = await program.methods
            .emergencyUnpause()
            .accounts({
                poaConfig: poaConfigPda,
                authority: universityAuthority.publicKey,
            })
            .signers([universityAuthority])
            .rpc();
            
        console.log("🎉 Emergency pause deactivated successfully");
        console.log(`   Transaction: ${tx}`);
        console.log(`   Authority: ${universityAuthority.publicKey.toBase58()}`);
        console.log(`   Timestamp: ${new Date().toISOString()}`);
        console.log("");
        console.log("🔓 All energy trading operations are now OPERATIONAL");
        
    } catch (error) {
        console.error("❌ Failed to deactivate emergency pause:", error.message);
        process.exit(1);
    }
}

emergencyUnpause().then(() => process.exit(0));
EOF

    npx ts-node emergency_unpause.ts
    rm emergency_unpause.ts
    cd "$PROJECT_ROOT"
}

# Add new validator
add_validator() {
    local pubkey=""
    local name=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --pubkey)
                pubkey="$2"
                shift 2
                ;;
            --name)
                name="$2"
                shift 2
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                echo "Usage: add-validator --pubkey <KEY> --name \"Department Name\""
                return 1
                ;;
        esac
    done
    
    if [[ -z "$pubkey" || -z "$name" ]]; then
        echo -e "${RED}❌ Missing required arguments${NC}"
        echo "Usage: add-validator --pubkey <KEY> --name \"Department Name\""
        return 1
    fi
    
    echo -e "${BLUE}➕ Adding new REC validator${NC}"
    echo -e "${BLUE}   Public Key: ${pubkey}${NC}"
    echo -e "${BLUE}   Name: ${name}${NC}"
    echo ""
    
    cd "$ANCHOR_DIR"
    
    cat > add_validator.ts << EOF
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { Governance } from "../target/types/governance";
import fs from "fs";
import path from "path";

async function addValidator() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Governance as Program<Governance>;
    
    const keypairDir = path.join(__dirname, "../config/poa-governance");
    const universityAuthority = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(path.join(keypairDir, "university-authority.json"), "utf8")))
    );
    
    const validatorPubkey = new PublicKey("${pubkey}");
    const validatorName = "${name}";
    
    const [poaConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("poa_config")],
        program.programId
    );

    try {
        console.log("➕ Adding REC validator...");
        
        const tx = await program.methods
            .addAuthorizedRecValidator(validatorPubkey, validatorName)
            .accounts({
                poaConfig: poaConfigPda,
                universityAuthority: universityAuthority.publicKey,
            })
            .signers([universityAuthority])
            .rpc();
            
        console.log("✅ REC validator added successfully");
        console.log(\`   Transaction: \${tx}\`);
        console.log(\`   Validator: \${validatorPubkey.toBase58()}\`);
        console.log(\`   Name: \${validatorName}\`);
        console.log(\`   Authority: \${universityAuthority.publicKey.toBase58()}\`);
        
    } catch (error) {
        console.error("❌ Failed to add validator:", error.message);
        if (error.message.includes("ValidatorAlreadyAuthorized")) {
            console.log("   This validator is already authorized");
        } else if (error.message.includes("MaxValidatorsExceeded")) {
            console.log("   Maximum number of validators reached");
        }
        process.exit(1);
    }
}

addValidator().then(() => process.exit(0));
EOF

    npx ts-node add_validator.ts
    rm add_validator.ts
    cd "$PROJECT_ROOT"
}

# Network health check
network_health() {
    echo -e "${BLUE}🌐 Network Health Check${NC}"
    echo ""
    
    # Basic connectivity
    echo -e "${BLUE}Checking RPC connectivity...${NC}"
    if curl -s "$RPC_URL" -X POST -H "Content-Type: application/json" \
            -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' | jq -r '.result' | grep -q "ok"; then
        echo -e "${GREEN}✅ RPC endpoint healthy${NC}"
    else
        echo -e "${RED}❌ RPC endpoint unhealthy${NC}"
    fi
    
    # Check validator
    echo -e "${BLUE}Checking validator status...${NC}"
    if solana validators --url "$RPC_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Validator running${NC}"
        solana validators --url "$RPC_URL" | head -5
    else
        echo -e "${RED}❌ Validator issues detected${NC}"
    fi
    
    # Check block production
    echo -e "${BLUE}Checking block production...${NC}"
    local block_height1=$(solana block-height --url "$RPC_URL")
    sleep 2
    local block_height2=$(solana block-height --url "$RPC_URL")
    
    if [[ $block_height2 -gt $block_height1 ]]; then
        echo -e "${GREEN}✅ Blocks being produced (${block_height1} → ${block_height2})${NC}"
    else
        echo -e "${RED}❌ Block production stalled${NC}"
    fi
    
    # Check governance
    show_status
}

# Export authorities for backup
export_authorities() {
    echo -e "${BLUE}📤 Exporting Authority Information${NC}"
    
    local output_file="$PROJECT_ROOT/config/poa-governance/authorities-export-$(date +%Y%m%d-%H%M%S).json"
    
    echo -e "${BLUE}Creating authorities export...${NC}"
    
    cat > "$output_file" << EOF
{
  "export_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "cluster": "${CLUSTER}",
  "rpc_url": "${RPC_URL}",
  "authorities": {
    "university_authority": {
      "name": "University Engineering Department",
      "public_key": "$(solana-keygen pubkey "$KEYPAIR_DIR/university-authority.json")",
      "role": "Primary governance authority"
    },
    "sustainability_validator": {
      "name": "University Sustainability Office",
      "public_key": "$(solana-keygen pubkey "$KEYPAIR_DIR/sustainability-validator.json")",
      "role": "REC certification authority"
    },
    "engineering_validator": {
      "name": "University Engineering Department",
      "public_key": "$(solana-keygen pubkey "$KEYPAIR_DIR/engineering-validator.json")",
      "role": "REC certification authority"
    },
    "facilities_validator": {
      "name": "University Facilities Management", 
      "public_key": "$(solana-keygen pubkey "$KEYPAIR_DIR/facilities-validator.json")",
      "role": "REC certification authority"
    },
    "oracle_authority": {
      "name": "Oracle Authority",
      "public_key": "$(solana-keygen pubkey "$KEYPAIR_DIR/oracle-authority.json")",
      "role": "AMI data processing"
    },
    "rec_validator": {
      "name": "REC Validator",
      "public_key": "$(solana-keygen pubkey "$KEYPAIR_DIR/rec-validator.json")",
      "role": "REC validation services"
    },
    "emergency_authority": {
      "name": "Emergency Authority",
      "public_key": "$(solana-keygen pubkey "$KEYPAIR_DIR/emergency-authority.json")",
      "role": "Emergency system control"
    }
  }
}
EOF

    echo -e "${GREEN}✅ Authorities exported to:${NC}"
    echo -e "${YELLOW}   ${output_file}${NC}"
}

# Main command processing
case "$1" in
    status)
        check_prerequisites
        show_status
        ;;
    list-validators)
        check_prerequisites
        list_validators
        ;;
    emergency-pause)
        check_prerequisites
        emergency_pause
        ;;
    emergency-unpause)
        check_prerequisites
        emergency_unpause
        ;;
    add-validator)
        check_prerequisites
        shift
        add_validator "$@"
        ;;
    network-health)
        network_health
        ;;
    export-authorities)
        export_authorities
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        if [[ -z "$1" ]]; then
            usage
        else
            echo -e "${RED}❌ Unknown command: $1${NC}"
            echo ""
            usage
            exit 1
        fi
        ;;
esac