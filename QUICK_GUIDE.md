# Quick Deployment & Management Guide

## Current Status

✅ **Infrastructure Deployed** - 6 of 14 services running
- PostgreSQL (Database)
- Redis (Cache)
- Kafka (Message Queue)
- Zookeeper (Coordination)
- Prometheus (Monitoring)
- Grafana (Dashboards)

🔧 **Pending** - Custom services with build issues
- Solana Validator (SSL certificate issue in Docker build)
- API Gateway, Frontend, and supporting services

---

## 🚀 Quick Start Commands

### View Current Services
```bash
cd /Users/chanthawat/Developments/gridtokenx-app
docker-compose ps
```

### Access Services

**PostgreSQL**
```bash
docker-compose exec postgres psql -U p2p_user -d p2p_energy_trading
```

**Redis**
```bash
docker-compose exec redis redis-cli
```

**Grafana**
```
URL: http://localhost:3001
Username: admin
Password: admin
```

**Prometheus**
```
URL: http://localhost:9090
```

---

## 📊 Service Monitoring

### Check Health
```bash
# All services
docker-compose ps

# Specific service logs
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f kafka

# Real-time stats
docker stats
```

### Database Verification
```bash
# List tables
docker-compose exec postgres psql -U p2p_user -d p2p_energy_trading -c "\dt"

# Check connections
docker-compose exec postgres psql -U p2p_user -d p2p_energy_trading -c "SELECT * FROM pg_stat_activity;"

# Database size
docker-compose exec postgres psql -U p2p_user -d p2p_energy_trading -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

---

## 🔧 Fixing Solana Validator Build

### Option 1: Use Pre-built Docker Image (Recommended)
```bash
# Edit docker/solana-validator/Dockerfile
# Replace custom build with:
FROM solanalabs/solana:v1.18.17

# Instead of building from source
```

### Option 2: Skip Custom Build (For Development)
```bash
# Use devnet or testnet instead
# Edit .env:
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com
```

### Option 3: Build Solana Locally
```bash
# Install Solana CLI locally (takes ~30 minutes)
curl https://release.solana.com/v1.18.17/install | sh

# Then deploy programs:
cd anchor
anchor build
```

---

## 🛠️ Common Management Tasks

### Restart a Service
```bash
docker-compose restart postgres
docker-compose restart redis
```

### View Service Logs
```bash
# Follow logs in real-time
docker-compose logs -f api-gateway

# Last 50 lines
docker-compose logs --tail=50 postgres

# All services
docker-compose logs
```

### Stop All Services
```bash
docker-compose down
```

### Remove All Data (CAUTION!)
```bash
docker-compose down -v
```

### Rebuild an Image
```bash
docker-compose build --no-cache api-gateway
```

---

## 🔒 Production Secrets

### Update Before Production Deployment
```bash
# Edit .env file:
JWT_SECRET=your-production-secret-here
API_KEY_SECRET=your-api-key-secret-here
ENGINEERING_API_KEY=your-engineering-key-here
```

### Secure Database
```bash
# Change PostgreSQL password in docker-compose.yml:
POSTGRES_PASSWORD=your-strong-password-here
DATABASE_URL=postgresql://p2p_user:your-strong-password-here@postgres:5432/p2p_energy_trading
```

---

## 📈 Performance Tuning

### PostgreSQL
```bash
# Check current settings
docker-compose exec postgres psql -U p2p_user -d p2p_energy_trading -c "SHOW shared_buffers; SHOW work_mem;"

# Common settings for production
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 2GB
max_wal_size = 8GB
```

### Redis
```bash
# Monitor commands
docker-compose exec redis redis-cli INFO stats

# Clear expired keys
docker-compose exec redis redis-cli BGREWRITEAOF

# Memory usage
docker-compose exec redis redis-cli INFO memory
```

---

## 🧪 Testing Connectivity

### Test Database
```bash
docker-compose exec postgres pg_isready -U p2p_user -h postgres
```

### Test Redis
```bash
docker-compose exec redis redis-cli ping
# Should return: PONG
```

### Test Kafka
```bash
docker-compose exec kafka kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --list
```

---

## 💾 Backup & Recovery

### Backup Database
```bash
docker-compose exec postgres pg_dump -U p2p_user p2p_energy_trading > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Restore Database
```bash
docker-compose exec -T postgres psql -U p2p_user p2p_energy_trading < backup-20251019-230000.sql
```

### Backup Redis
```bash
docker-compose exec redis redis-cli --rdb /data/dump.rdb
docker cp p2p-redis:/data/dump.rdb ./redis-backup.rdb
```

---

## 🚨 Troubleshooting

### Service Won't Start
```bash
# Check logs
docker-compose logs [service-name]

# Force remove and recreate
docker-compose rm [service-name]
docker-compose up -d [service-name]
```

### Database Connection Failed
```bash
# Check if service is running
docker-compose exec postgres pg_isready -U p2p_user

# Check network
docker network inspect gridtokenx-app_p2p-network

# Recreate network
docker-compose down --remove-orphans
docker-compose up -d
```

### High Memory Usage
```bash
# Check container stats
docker stats --no-stream

# Limit container memory
# Edit docker-compose.yml and add under service:
# deploy:
#   resources:
#     limits:
#       memory: 2G
```

---

## 📋 Deployment Checklist

When deploying to production, verify:

- [ ] `.env` file configured with production values
- [ ] SSL certificates installed (if needed)
- [ ] Database backups tested
- [ ] Solana validator operational
- [ ] Anchor programs deployed successfully
- [ ] API Gateway running and responding to health checks
- [ ] Frontend accessible and loading
- [ ] Monitoring active in Grafana
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Rollback plan documented

---

## 📞 Support Resources

- **Docker Compose Docs**: https://docs.docker.com/compose/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Redis Docs**: https://redis.io/documentation
- **Solana Docs**: https://docs.solana.com/
- **Project Docs**: See `/docs` directory

---

## Architecture Reference

```
GridTokenX Stack (Docker Compose)

Monitoring Layer
├─ Prometheus (Metrics Collection)
└─ Grafana (Visualization)

Application Layer (Pending)
├─ Frontend (React + Vite)
├─ API Gateway (Rust)
└─ Nginx (Reverse Proxy)

Blockchain Layer (Pending)
├─ Solana Validator
└─ Anchor Programs (5 programs)

Data Layer (✅ Running)
├─ PostgreSQL (Relational Data)
├─ Redis (Cache & Sessions)
├─ Kafka (Message Queue)
└─ Zookeeper (Coordination)
```

---

## Environment Variables Reference

```bash
# Blockchain
SOLANA_RPC_URL=http://solana-validator:8899
SOLANA_WS_URL=ws://solana-validator:8900
SOLANA_CLUSTER=localnet

# Database
DATABASE_URL=postgresql://p2p_user:p2p_password@postgres:5432/p2p_energy_trading
TIMESCALE_URL=postgresql://p2p_user:p2p_password@postgres:5432/p2p_energy_trading

# Cache
REDIS_URL=redis://redis:6379

# Message Queue
KAFKA_BOOTSTRAP_SERVERS=kafka:9092

# Monitoring
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000

# API Security
JWT_SECRET=your-jwt-secret
API_KEY_SECRET=your-api-secret
ENGINEERING_API_KEY=your-engineering-key

# Application
ENVIRONMENT=production
PORT=8080
LOG_LEVEL=info
```

---

**Last Updated:** 2025-10-19  
**Status:** Infrastructure Ready ✅ | Blockchain Pending 🔧
