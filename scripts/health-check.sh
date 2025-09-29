#!/bin/bash

# Health check script for Solana validator
# Returns 0 if healthy, 1 if unhealthy

# Check if solana CLI is available
if ! command -v solana &> /dev/null; then
    echo "solana CLI not found"
    exit 1
fi

# Check if validator is responding
if curl -s --max-time 5 http://localhost:8899 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getVersion"}' | grep -q "result"; then
    echo "Solana validator is healthy"
    exit 0
else
    echo "Solana validator is not responding"
    exit 1
fi