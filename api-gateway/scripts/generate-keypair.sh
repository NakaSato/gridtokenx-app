#!/bin/bash
# Generate API Gateway Keypair for Solana blockchain interaction
# This script creates a new keypair and saves it to the keys directory

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== API Gateway Keypair Generator ===${NC}"
echo ""

# Create keys directory if it doesn't exist
KEYS_DIR="./keys"
if [ ! -d "$KEYS_DIR" ]; then
    echo "Creating keys directory..."
    mkdir -p "$KEYS_DIR"
fi

# Keypair file path
KEYPAIR_FILE="$KEYS_DIR/api-gateway-keypair.json"

# Check if keypair already exists
if [ -f "$KEYPAIR_FILE" ]; then
    echo -e "${YELLOW}Warning: Keypair file already exists at $KEYPAIR_FILE${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted. Existing keypair preserved."
        exit 0
    fi
fi

# Generate new keypair using solana-keygen
echo "Generating new keypair..."
solana-keygen new --no-bip39-passphrase --outfile "$KEYPAIR_FILE" --force

# Get the public key
PUBKEY=$(solana-keygen pubkey "$KEYPAIR_FILE")

echo ""
echo -e "${GREEN}✅ Keypair generated successfully!${NC}"
echo ""
echo "Keypair file: $KEYPAIR_FILE"
echo "Public key:   $PUBKEY"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT SECURITY NOTES:${NC}"
echo "1. Keep this keypair file secure and never commit it to version control"
echo "2. Add 'keys/' to your .gitignore file"
echo "3. This keypair must be authorized in the Oracle program"
echo "4. Fund this address with SOL for transaction fees"
echo ""
echo "Next steps:"
echo "1. Update your .env file with: API_GATEWAY_KEYPAIR_PATH=$KEYPAIR_FILE"
echo "2. Fund the address: solana airdrop 2 $PUBKEY --url devnet"
echo "3. Initialize Oracle program with this public key as authorized gateway"
echo ""
