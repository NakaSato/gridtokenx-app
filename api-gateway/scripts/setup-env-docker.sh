#!/bin/bash
# Setup .env file with Docker Compose database credentials

echo "Setting up .env file with Docker Compose credentials..."

cat > .env << 'EOF'
# Environment Configuration
ENVIRONMENT=development

# Server Configuration
PORT=8080

# Database Configuration - Docker Compose
DATABASE_URL=postgresql://p2p_user:p2p_password@localhost:5432/p2p_energy_trading
TIMESCALE_URL=postgresql://timescale_user:timescale_password@localhost:5433/p2p_timeseries

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_POOL_SIZE=20

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ENGINEERING_API_KEY=engineering-department-api-key-2025

# Solana Configuration
SOLANA_RPC_URL=http://localhost:8899
SOLANA_WS_URL=ws://localhost:8900
ORACLE_PROGRAM_ID=5DF1fmjrXTtG7qsFaLUm5TjJMG7M1a2V7kyTWPjoADV5
API_GATEWAY_KEYPAIR_PATH=./keys/api-gateway-keypair.json
BLOCKCHAIN_ENABLED=true

# Connection Pool Configuration
MAX_CONNECTIONS=50
REQUEST_TIMEOUT=30
RATE_LIMIT_WINDOW=60

# Logging Configuration
LOG_LEVEL=info
AUDIT_LOG_ENABLED=true
EOF

echo "✅ .env file created with Docker Compose credentials"
echo ""
echo "Database URL: postgresql://p2p_user:p2p_password@localhost:5432/p2p_energy_trading"
echo ""
echo "Next steps:"
echo "  1. Start Docker services: docker-compose up -d"
echo "  2. Build API Gateway: cargo build"
echo "  3. Run migrations: sqlx migrate run"
