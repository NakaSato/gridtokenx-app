#!/bin/bash
set -euo pipefail

# GridTokenX Solana Validator Startup Script
# Optimized for P2P energy trading system

LEDGER_PATH="/opt/solana/ledger"
CONFIG_PATH="/opt/solana/config"
LOG_PATH="/opt/solana/logs"
FAUCET_KEYPAIR="$CONFIG_PATH/faucet-keypair.json"
VALIDATOR_KEYPAIR="$CONFIG_PATH/validator-keypair.json"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_PATH/validator.log"
}

# Initialize directories
mkdir -p "$LEDGER_PATH" "$CONFIG_PATH" "$LOG_PATH"

log "Starting GridTokenX Solana Test Validator..."

# Generate keypairs if they don't exist
if [[ ! -f "$FAUCET_KEYPAIR" ]]; then
    log "Generating faucet keypair..."
    solana-keygen new --no-bip39-passphrase --silent --outfile "$FAUCET_KEYPAIR"
fi

if [[ ! -f "$VALIDATOR_KEYPAIR" ]]; then
    log "Generating validator identity keypair..."
    solana-keygen new --no-bip39-passphrase --silent --outfile "$VALIDATOR_KEYPAIR"
fi

# Set Solana config
export SOLANA_CONFIG_FILE="$CONFIG_PATH/cli-config.yml"
solana config set --keypair "$FAUCET_KEYPAIR" --url http://127.0.0.1:8899 >/dev/null 2>&1

log "Configuration complete. Starting test validator..."

# Start the test validator with optimized settings for development
exec solana-test-validator \
    --ledger "$LEDGER_PATH" \
    --bind-address 0.0.0.0 \
    --rpc-port 8899 \
    --gossip-port 8001 \
    --dynamic-port-range 8002-8020 \
    --log \
    --reset \
    --slots-per-epoch 32 \
    --faucet-sol 10000000 \
    --compute-unit-limit 1000000 \
    --account-index program-id \
    --account-index spl-token-owner \
    --account-index spl-token-mint \
    "$@"