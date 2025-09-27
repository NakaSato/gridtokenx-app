#!/bin/bash

# Contract interaction script for Oracle Simulator
# This script provides functions to interact with deployed smart contracts

# Configuration
NODE_URL="${SOLANA_RPC_URL:-http://solana-validator:8899}"
ORACLE_ACCOUNT="${ORACLE_ACCOUNT_SEED:-//Alice}"
CONTRACT_ADDRESSES_PATH="${CONTRACT_ADDRESSES_PATH:-/tmp/contract_addresses}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Wait for contract addresses to be available
wait_for_contracts() {
    echo -e "${YELLOW}Waiting for contract deployment to complete...${NC}"
    
    while [ ! -f "$CONTRACT_ADDRESSES_PATH/deployment_summary.json" ]; do
        echo "Waiting for contracts to be deployed..."
        sleep 5
    done
    
    echo -e "${GREEN}✅ Contracts are deployed and ready!${NC}"
}

# Load contract addresses
load_contract_addresses() {
    if [ -f "$CONTRACT_ADDRESSES_PATH/deployment_summary.json" ]; then
        REGISTRY_ADDRESS=$(jq -r '.deployment_summary.contracts.registry.address' "$CONTRACT_ADDRESSES_PATH/deployment_summary.json")
        TOKEN_ADDRESS=$(jq -r '.deployment_summary.contracts.grid_token.address' "$CONTRACT_ADDRESSES_PATH/deployment_summary.json")
        TRADING_ADDRESS=$(jq -r '.deployment_summary.contracts.trading.address' "$CONTRACT_ADDRESSES_PATH/deployment_summary.json")
        ORACLE_ADDRESS=$(jq -r '.deployment_summary.contracts.oracle_client.address' "$CONTRACT_ADDRESSES_PATH/deployment_summary.json")
        
        echo -e "${GREEN}Contract addresses loaded:${NC}"
        echo "Registry: $REGISTRY_ADDRESS"
        echo "Token: $TOKEN_ADDRESS"
        echo "Trading: $TRADING_ADDRESS"
        echo "Oracle: $ORACLE_ADDRESS"
    else
        echo -e "${RED}❌ Contract addresses not found!${NC}"
        return 1
    fi
}

# Function to register a user
register_user() {
    local user_account=$1
    local user_type=$2
    local location=$3
    
    echo -e "${YELLOW}Registering user: $user_account as $user_type at $location${NC}"
    
    cargo contract call \
        --contract $REGISTRY_ADDRESS \
        --message register_user \
        --args $user_account $user_type "$location" \
        --suri $ORACLE_ACCOUNT \
        --url $NODE_URL \
        --skip-confirm \
        --output-json
}

# Function to assign a meter to a user
assign_meter() {
    local meter_id=$1
    local owner=$2
    
    echo -e "${YELLOW}Assigning meter $meter_id to $owner${NC}"
    
    cargo contract call \
        --contract $REGISTRY_ADDRESS \
        --message assign_meter \
        --args "$meter_id" $owner \
        --suri $ORACLE_ACCOUNT \
        --url $NODE_URL \
        --skip-confirm \
        --output-json
}

# Function to mint tokens (representing energy generation)
mint_tokens() {
    local to=$1
    local amount=$2
    local meter_id=$3
    
    echo -e "${YELLOW}Minting $amount GRID tokens to $to from meter $meter_id${NC}"
    
    cargo contract call \
        --contract $TOKEN_ADDRESS \
        --message mint \
        --args $to $amount "$meter_id" \
        --suri $ORACLE_ACCOUNT \
        --url $NODE_URL \
        --skip-confirm \
        --output-json
}

# Function to check if market clearing is needed
check_market_clearing() {
    echo -e "${YELLOW}Checking if market clearing is needed...${NC}"
    
    cargo contract call \
        --contract $TRADING_ADDRESS \
        --message needs_market_clearing \
        --suri $ORACLE_ACCOUNT \
        --url $NODE_URL \
        --skip-confirm \
        --output-json \
        --dry-run
}

# Function to execute market clearing
execute_market_clearing() {
    echo -e "${YELLOW}Executing market clearing...${NC}"
    
    cargo contract call \
        --contract $TRADING_ADDRESS \
        --message match_orders \
        --suri $ORACLE_ACCOUNT \
        --url $NODE_URL \
        --skip-confirm \
        --output-json
}

# Function to get user balance
get_user_balance() {
    local user=$1
    
    echo -e "${YELLOW}Getting balance for user: $user${NC}"
    
    cargo contract call \
        --contract $TOKEN_ADDRESS \
        --message balance_of \
        --args $user \
        --suri $ORACLE_ACCOUNT \
        --url $NODE_URL \
        --skip-confirm \
        --output-json \
        --dry-run
}

# Function to setup demo users and data
setup_demo_data() {
    echo -e "${GREEN}=== Setting up demo data ===${NC}"
    
    # Demo accounts (pre-funded accounts in Solana validator)
    ALICE="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
    BOB="5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
    CHARLIE="5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y"
    
    # Register users
    register_user $ALICE "Prosumer" "Building A"
    sleep 2
    register_user $BOB "Consumer" "Building B"
    sleep 2
    register_user $CHARLIE "Prosumer" "Building C"
    sleep 2
    
    # Assign meters
    assign_meter "METER_001" $ALICE
    sleep 2
    assign_meter "METER_002" $BOB
    sleep 2
    assign_meter "METER_003" $CHARLIE
    sleep 2
    
    # Mint some initial tokens (representing energy generation)
    mint_tokens $ALICE "1000000000000000000000" "METER_001"  # 1000 GRID
    sleep 2
    mint_tokens $CHARLIE "500000000000000000000" "METER_003"  # 500 GRID
    
    echo -e "${GREEN}✅ Demo data setup complete!${NC}"
}

# Function to display status
show_status() {
    echo -e "${GREEN}=== Contract Status ===${NC}"
    
    if load_contract_addresses; then
        echo -e "\n${YELLOW}User Balances:${NC}"
        ALICE="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
        BOB="5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
        CHARLIE="5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y"
        
        get_user_balance $ALICE
        get_user_balance $BOB
        get_user_balance $CHARLIE
        
        echo -e "\n${YELLOW}Market Status:${NC}"
        check_market_clearing
    fi
}

# Main execution based on parameters
case "${1:-help}" in
    "wait")
        wait_for_contracts
        ;;
    "setup")
        wait_for_contracts
        load_contract_addresses
        setup_demo_data
        ;;
    "clear-market")
        load_contract_addresses
        execute_market_clearing
        ;;
    "status")
        show_status
        ;;
    "help"|*)
        echo "Usage: $0 {wait|setup|clear-market|status}"
        echo "  wait         - Wait for contracts to be deployed"
        echo "  setup        - Setup demo users and data"
        echo "  clear-market - Execute market clearing"
        echo "  status       - Show contract status"
        ;;
esac
