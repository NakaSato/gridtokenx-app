#!/bin/bash
set -e

# Set PATH to include Solana CLI binaries for macOS
export PATH="/Users/$USER/.local/share/solana/install/active_release/bin:${PATH}"

echo "[$(date)] Starting GridTokenX Solana Test Validator..."

# Ensure we're in the right directory
mkdir -p "$HOME/solana-test-validator"
cd "$HOME/solana-test-validator"

# Set Solana config
export SOLANA_CONFIG_FILE="$HOME/solana-test-validator/config/solana.toml"

# Create config directory if it doesn't exist
mkdir -p "$HOME/solana-test-validator/config"

# Generate faucet keypair if it doesn't exist
if [ ! -f "$HOME/solana-test-validator/config/faucet-keypair.json" ]; then
    echo "[$(date)] Generating faucet keypair..."
    solana-keygen new --no-passphrase --outfile "$HOME/solana-test-validator/config/faucet-keypair.json"
fi

# Start the test validator
echo "[$(date)] Starting Solana test validator..."
exec solana-test-validator \
    --ledger "$HOME/solana-test-validator/ledger" \
    --rpc-port 8899 \
    --faucet-port 9900 \
    --bind-address 0.0.0.0 \
    --log