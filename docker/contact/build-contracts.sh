#!/bin/bash

# Simple build script for Solana contracts
set -e

WORKSPACE="/workspaces/p2p"
ARTIFACTS="/opt/deployer/artifacts"

# Simple logging
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

main() {
    log "Building contracts..."
    
    cd "$WORKSPACE"
    
    # Clean and build
    [ -d "target" ] && rm -rf target
    [ -d "$ARTIFACTS" ] && rm -rf "$ARTIFACTS"/* || true  # Clean contents, not directory
    
    # Build all programs
    anchor build
    
    # Copy artifacts
    if [ -d "target" ]; then
        mkdir -p "$ARTIFACTS"
        
        # Copy for each program
        for program in registry energy-token governance oracle trading; do
            if [ -d "programs/$program" ]; then
                mkdir -p "$ARTIFACTS/$program"
                
                # Copy IDL and binary if they exist
                [ -f "target/idl/$program.json" ] && cp "target/idl/$program.json" "$ARTIFACTS/$program/"
                [ -f "target/deploy/$program.so" ] && cp "target/deploy/$program.so" "$ARTIFACTS/$program/"
            fi
        done
    fi
    
    log "Build completed!"
}

main "$@"