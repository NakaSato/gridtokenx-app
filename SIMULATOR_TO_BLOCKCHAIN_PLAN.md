# Smart Meter Simulator → API Gateway → Blockchain Integration Plan

**Project**: GridTokenX P2P Energy Trading Platform  
**Date**: 2025-09-30  
**Status**: Week 1 Complete, Ready for Full Integration

---

## 🎯 Overview

Complete end-to-end data flow implementation from smart meters through API Gateway to Solana blockchain.

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Smart Meter     │─────▶│  API Gateway    │─────▶│   Blockchain    │
│   Simulator     │ HTTP │    (Rust)       │ RPC  │    (Solana)     │
│   (Python)      │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
     25 meters           Validation & Store        Oracle Program
     15s intervals       Blockchain Submit         On-chain Storage
```

---

## 📊 Current Status

### ✅ Completed (Week 1)

**API Gateway → Blockchain**:
- ✅ Blockchain service implementation
- ✅ Transaction builders
- ✅ Handler integration
- ✅ Error handling
- ✅ Unit tests (10/10 passing)
- ✅ Documentation

**Smart Meter Simulator**:
- ✅ 25 meter simulation
- ✅ Realistic consumption patterns
- ✅ Solar generation modeling
- ✅ Battery management
- ✅ InfluxDB storage
- ✅ WebSocket broadcasting

### ⏳ To Be Implemented

**Simulator → API Gateway Integration**:
- ⏳ HTTP client in simulator
- ⏳ JWT authentication
- ⏳ Retry logic
- ⏳ Error handling

**Full End-to-End**:
- ⏳ Oracle program deployment
- ⏳ Integration testing
- ⏳ Performance optimization

---

## 🗺️ Implementation Roadmap

### Phase 1: Simulator → API Gateway (Week 2, Days 1-2)

**Objective**: Enable simulator to publish readings to API Gateway

#### Tasks

**1.1 Add HTTP Client to Simulator** (2 hours)
```python
# File: smart-meter-simulator/gateway_client.py

import aiohttp
import asyncio
from typing import Dict, Optional
import logging

class APIGatewayClient:
    def __init__(self, base_url: str, jwt_token: str):
        self.base_url = base_url
        self.jwt_token = jwt_token
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={
                "Authorization": f"Bearer {self.jwt_token}",
                "Content-Type": "application/json"
            }
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
            
    async def submit_reading(self, reading: Dict) -> Dict:
        """Submit meter reading to API Gateway"""
        url = f"{self.base_url}/api/v1/meters/readings"
        
        async with self.session.post(url, json=reading) as response:
            response.raise_for_status()
            return await response.json()
```

**1.2 Integrate with Simulator** (1 hour)
```python
# File: smart-meter-simulator/simulator.py

async def publish_to_gateway(meter_data: Dict):
    """Publish meter reading to API Gateway"""
    try:
        async with APIGatewayClient(
            base_url=config.API_GATEWAY_URL,
            jwt_token=config.API_GATEWAY_JWT
        ) as client:
            
            reading = {
                "meter_id": meter_data["meter_id"],
                "timestamp": meter_data["timestamp"],
                "energy_generated": meter_data["energy_generated"],
                "energy_consumed": meter_data["energy_consumed"],
                "solar_irradiance": meter_data.get("solar_irradiance"),
                "temperature": meter_data.get("temperature"),
                "engineering_authority_signature": generate_signature(meter_data),
                "metadata": {
                    "location": meter_data.get("location"),
                    "device_type": "smart_meter"
                }
            }
            
            result = await client.submit_reading(reading)
            logger.info(f"Published reading for {meter_data['meter_id']}: {result['id']}")
            
    except Exception as e:
        logger.error(f"Failed to publish reading: {e}")
        # Store in local queue for retry
        await retry_queue.add(reading)
```

**1.3 Add Configuration** (30 minutes)
```python
# File: smart-meter-simulator/.env

# API Gateway Configuration
API_GATEWAY_URL=http://localhost:8080
API_GATEWAY_JWT=your-jwt-token-here
PUBLISH_TO_GATEWAY=true
PUBLISH_INTERVAL=15

# Retry Configuration
MAX_RETRIES=3
RETRY_DELAY=5
RETRY_BACKOFF=2
```

**1.4 Add Retry Logic** (2 hours)
```python
# File: smart-meter-simulator/retry_queue.py

import asyncio
from collections import deque
from typing import Dict
import time

class RetryQueue:
    def __init__(self, max_retries: int = 3):
        self.queue = deque()
        self.max_retries = max_retries
        
    async def add(self, reading: Dict):
        """Add reading to retry queue"""
        self.queue.append({
            "reading": reading,
            "attempts": 0,
            "next_retry": time.time() + 5  # 5 seconds
        })
        
    async def process(self, client: APIGatewayClient):
        """Process retry queue"""
        while True:
            if not self.queue:
                await asyncio.sleep(1)
                continue
                
            item = self.queue[0]
            
            if time.time() < item["next_retry"]:
                await asyncio.sleep(1)
                continue
                
            # Try to submit
            try:
                await client.submit_reading(item["reading"])
                self.queue.popleft()  # Success, remove from queue
                
            except Exception as e:
                item["attempts"] += 1
                
                if item["attempts"] >= self.max_retries:
                    logger.error(f"Max retries reached for reading: {item['reading']}")
                    self.queue.popleft()  # Give up
                else:
                    # Exponential backoff
                    delay = 5 * (2 ** item["attempts"])
                    item["next_retry"] = time.time() + delay
                    logger.warning(f"Retry {item['attempts']}/{self.max_retries} in {delay}s")
```

**Deliverables**:
- ✅ HTTP client implementation
- ✅ Simulator integration
- ✅ Configuration management
- ✅ Retry logic
- ✅ Error handling
- ✅ Unit tests

**Time Estimate**: 5-6 hours

---

### Phase 2: Cryptographic Signatures (Week 2, Day 3)

**Objective**: Add real Ed25519 signatures to readings

#### Tasks

**2.1 Generate Engineering Authority Keypair** (30 minutes)
```python
# File: smart-meter-simulator/scripts/generate_signing_key.py

from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
import base64

def generate_keypair():
    """Generate Ed25519 keypair for signing"""
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    
    # Save private key
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    with open("keys/engineering_authority_private.pem", "wb") as f:
        f.write(private_pem)
    
    # Save public key
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    with open("keys/engineering_authority_public.pem", "wb") as f:
        f.write(public_pem)
    
    print(f"Public key (base64): {base64.b64encode(public_pem).decode()}")

if __name__ == "__main__":
    generate_keypair()
```

**2.2 Implement Signature Service** (2 hours)
```python
# File: smart-meter-simulator/signature_service.py

from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
import json
import base64

class SignatureService:
    def __init__(self, private_key_path: str):
        with open(private_key_path, "rb") as f:
            self.private_key = serialization.load_pem_private_key(
                f.read(),
                password=None
            )
    
    def sign_reading(self, reading: Dict) -> str:
        """Sign a meter reading"""
        # Create canonical message
        message = self._create_canonical_message(reading)
        
        # Sign
        signature = self.private_key.sign(message.encode())
        
        # Return base64-encoded signature
        return base64.b64encode(signature).decode()
    
    def _create_canonical_message(self, reading: Dict) -> str:
        """Create canonical message for signing"""
        # Sort keys for consistent hashing
        canonical = {
            "meter_id": reading["meter_id"],
            "timestamp": reading["timestamp"],
            "energy_generated": reading["energy_generated"],
            "energy_consumed": reading["energy_consumed"],
        }
        return json.dumps(canonical, sort_keys=True)
```

**2.3 Add Signature Verification to API Gateway** (2 hours)
```rust
// File: api-gateway/src/services/signature_verification.rs

use ed25519_dalek::{PublicKey, Signature, Verifier};
use base64::{Engine as _, engine::general_purpose};
use serde_json::json;

pub struct SignatureVerifier {
    public_key: PublicKey,
}

impl SignatureVerifier {
    pub fn new(public_key_pem: &str) -> Result<Self> {
        // Load public key from PEM
        let public_key = Self::load_public_key(public_key_pem)?;
        Ok(Self { public_key })
    }
    
    pub fn verify_reading(
        &self,
        reading: &MeterReadingSubmission,
        signature_b64: &str,
    ) -> Result<bool> {
        // Decode signature
        let signature_bytes = general_purpose::STANDARD
            .decode(signature_b64)
            .map_err(|e| ApiError::BadRequest(format!("Invalid signature: {}", e)))?;
        
        let signature = Signature::from_bytes(&signature_bytes)
            .map_err(|e| ApiError::BadRequest(format!("Invalid signature: {}", e)))?;
        
        // Create canonical message
        let message = self.create_canonical_message(reading);
        
        // Verify
        Ok(self.public_key.verify(message.as_bytes(), &signature).is_ok())
    }
    
    fn create_canonical_message(&self, reading: &MeterReadingSubmission) -> String {
        let canonical = json!({
            "meter_id": reading.meter_id,
            "timestamp": reading.timestamp,
            "energy_generated": reading.energy_generated,
            "energy_consumed": reading.energy_consumed,
        });
        serde_json::to_string(&canonical).unwrap()
    }
}
```

**2.4 Update Handler to Verify Signatures** (1 hour)
```rust
// File: api-gateway/src/handlers/meters.rs

pub async fn submit_meter_reading(
    State(state): State<AppState>,
    user: AuthenticatedUser,
    Json(payload): Json<MeterReadingSubmission>,
) -> Result<Json<MeterReadingResponse>> {
    // Verify signature
    if let Some(signature) = &payload.engineering_authority_signature {
        let verifier = SignatureVerifier::new(&state.config.engineering_public_key)?;
        
        if !verifier.verify_reading(&payload, signature)? {
            return Err(ApiError::Unauthorized("Invalid signature".to_string()));
        }
    } else {
        return Err(ApiError::BadRequest("Signature required".to_string()));
    }
    
    // Continue with existing logic...
}
```

**Deliverables**:
- ✅ Keypair generation script
- ✅ Signature service (Python)
- ✅ Signature verification (Rust)
- ✅ Handler integration
- ✅ Unit tests
- ✅ Documentation

**Time Estimate**: 5-6 hours

---

### Phase 3: Oracle Deployment & Integration (Week 2, Days 4-5)

**Objective**: Deploy Oracle program and test end-to-end flow

#### Tasks

**3.1 Deploy Oracle Program** (1 hour)
```bash
# Deploy to devnet
cd anchor
anchor build
anchor deploy --provider.cluster devnet

# Get program ID
ORACLE_PROGRAM_ID=$(solana address -k target/deploy/oracle-keypair.json)

# Update API Gateway .env
echo "ORACLE_PROGRAM_ID=$ORACLE_PROGRAM_ID" >> ../api-gateway/.env
```

**3.2 Initialize Oracle** (30 minutes)
```bash
# Get API Gateway pubkey
GATEWAY_PUBKEY=$(solana-keygen pubkey ../api-gateway/keys/api-gateway-keypair.json)

# Initialize Oracle
anchor run initialize-oracle -- --api-gateway $GATEWAY_PUBKEY --cluster devnet
```

**3.3 End-to-End Integration Test** (2 hours)
```bash
# File: scripts/e2e-test.sh

#!/bin/bash
set -e

echo "=== End-to-End Integration Test ==="

# 1. Start services
echo "Starting services..."
docker-compose up -d postgres redis

# 2. Start API Gateway
echo "Starting API Gateway..."
cd api-gateway
cargo run &
API_GATEWAY_PID=$!
sleep 5

# 3. Run simulator (single meter, 5 readings)
echo "Running simulator..."
cd ../smart-meter-simulator
python simulator.py --test-mode --readings 5

# 4. Verify readings in database
echo "Verifying database..."
psql $DATABASE_URL -c "SELECT COUNT(*) FROM energy_readings WHERE created_at > NOW() - INTERVAL '1 minute';"

# 5. Verify blockchain submissions
echo "Verifying blockchain..."
cd ../api-gateway
cargo test --test blockchain_integration_test -- --ignored

# 6. Cleanup
kill $API_GATEWAY_PID
docker-compose down

echo "=== Test Complete ==="
```

**3.4 Performance Testing** (2 hours)
```python
# File: tests/load_test.py

import asyncio
import aiohttp
import time
from statistics import mean, median

async def load_test(num_requests: int = 100):
    """Load test API Gateway with meter readings"""
    
    latencies = []
    errors = 0
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        
        for i in range(num_requests):
            task = submit_reading(session, i)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, Exception):
                errors += 1
            else:
                latencies.append(result)
    
    # Calculate metrics
    print(f"Total Requests: {num_requests}")
    print(f"Successful: {len(latencies)}")
    print(f"Failed: {errors}")
    print(f"Average Latency: {mean(latencies):.2f}ms")
    print(f"Median Latency: {median(latencies):.2f}ms")
    print(f"p95 Latency: {sorted(latencies)[int(len(latencies) * 0.95)]:.2f}ms")
    print(f"Throughput: {num_requests / (max(latencies) / 1000):.2f} req/s")

async def submit_reading(session, index):
    """Submit a single reading and measure latency"""
    start = time.time()
    
    reading = {
        "meter_id": f"TEST-{index}",
        "timestamp": datetime.utcnow().isoformat(),
        "energy_generated": 5.5,
        "energy_consumed": 3.2,
        "engineering_authority_signature": "test-sig"
    }
    
    async with session.post(
        "http://localhost:8080/api/v1/meters/readings",
        json=reading,
        headers={"Authorization": f"Bearer {JWT_TOKEN}"}
    ) as response:
        await response.json()
        
    return (time.time() - start) * 1000  # Convert to ms

if __name__ == "__main__":
    asyncio.run(load_test(100))
```

**Deliverables**:
- ✅ Oracle deployed to devnet
- ✅ Oracle initialized
- ✅ End-to-end test script
- ✅ Load testing script
- ✅ Performance metrics
- ✅ Documentation

**Time Estimate**: 5-6 hours

---

## 📊 Success Criteria

### Phase 1: Simulator → API Gateway
- [ ] Simulator successfully publishes readings to API Gateway
- [ ] All 25 meters publishing every 15 seconds
- [ ] Retry logic handles failures gracefully
- [ ] <1% error rate under normal conditions
- [ ] Readings stored in PostgreSQL

### Phase 2: Cryptographic Signatures
- [ ] All readings signed with Ed25519
- [ ] API Gateway verifies signatures
- [ ] Invalid signatures rejected
- [ ] Performance impact <10ms per reading

### Phase 3: End-to-End Integration
- [ ] Readings flow from simulator to blockchain
- [ ] Oracle program stores data on-chain
- [ ] Transaction confirmation <2 seconds
- [ ] System handles 100+ readings/minute
- [ ] <1% failure rate

---

## 🎯 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Simulator → Gateway Latency | <100ms | HTTP response time |
| Gateway → Blockchain Latency | <500ms | Transaction confirmation |
| End-to-End Latency | <2s | Total time |
| Throughput | >100 readings/min | Load test |
| Success Rate | >99% | Error rate monitoring |
| Database Write | <50ms | PostgreSQL metrics |

---

## 🔧 Configuration

### Simulator Configuration
```python
# .env
API_GATEWAY_URL=http://localhost:8080
API_GATEWAY_JWT=<your-jwt-token>
PUBLISH_TO_GATEWAY=true
PUBLISH_INTERVAL=15
MAX_RETRIES=3
RETRY_DELAY=5
ENGINEERING_PRIVATE_KEY_PATH=./keys/engineering_authority_private.pem
```

### API Gateway Configuration
```bash
# .env
BLOCKCHAIN_ENABLED=true
SOLANA_RPC_URL=https://api.devnet.solana.com
ORACLE_PROGRAM_ID=<deployed-program-id>
API_GATEWAY_KEYPAIR_PATH=./keys/api-gateway-keypair.json
ENGINEERING_PUBLIC_KEY_PATH=./keys/engineering_authority_public.pem
```

---

## 📅 Timeline

### Week 2 Schedule

**Day 1-2: Simulator → API Gateway**
- Implement HTTP client
- Add retry logic
- Integration testing
- **Milestone**: Simulator publishing to Gateway

**Day 3: Cryptographic Signatures**
- Generate keypairs
- Implement signing/verification
- Update handlers
- **Milestone**: Signed readings verified

**Day 4: Oracle Deployment**
- Deploy to devnet
- Initialize Oracle
- Basic integration test
- **Milestone**: Oracle operational

**Day 5: End-to-End Testing**
- Full integration test
- Load testing
- Performance optimization
- **Milestone**: Production-ready system

---

## 🚀 Quick Start Commands

### Setup
```bash
# 1. Generate signing keypair
cd smart-meter-simulator
python scripts/generate_signing_key.py

# 2. Deploy Oracle
cd ../anchor
anchor build
anchor deploy --provider.cluster devnet

# 3. Initialize Oracle
GATEWAY_PUBKEY=$(solana-keygen pubkey ../api-gateway/keys/api-gateway-keypair.json)
anchor run initialize-oracle -- --api-gateway $GATEWAY_PUBKEY

# 4. Start services
docker-compose up -d

# 5. Start API Gateway
cd ../api-gateway
cargo run

# 6. Start simulator
cd ../smart-meter-simulator
python simulator.py
```

### Testing
```bash
# End-to-end test
./scripts/e2e-test.sh

# Load test
python tests/load_test.py

# Integration test
cd api-gateway
cargo test --test blockchain_integration_test -- --ignored
```

---

## 📚 Documentation

### To Be Created

1. **SIMULATOR_INTEGRATION_GUIDE.md** - How to integrate simulator with API Gateway
2. **SIGNATURE_GUIDE.md** - Cryptographic signature implementation
3. **E2E_TESTING_GUIDE.md** - End-to-end testing procedures
4. **PERFORMANCE_TUNING.md** - Performance optimization guide

---

## ✅ Checklist

### Pre-Implementation
- [ ] Week 1 complete (API Gateway → Blockchain)
- [ ] Oracle program ready for deployment
- [ ] Development environment set up
- [ ] Documentation reviewed

### Phase 1
- [ ] HTTP client implemented
- [ ] Retry logic added
- [ ] Configuration management
- [ ] Unit tests passing
- [ ] Integration tests passing

### Phase 2
- [ ] Keypairs generated
- [ ] Signature service implemented
- [ ] Verification added to Gateway
- [ ] Tests passing

### Phase 3
- [ ] Oracle deployed
- [ ] Oracle initialized
- [ ] End-to-end test passing
- [ ] Load test passing
- [ ] Performance targets met

---

## 🎉 Expected Outcome

After completing this plan:

✅ **Complete Data Flow**: Meter → Simulator → Gateway → Blockchain  
✅ **Secure**: Cryptographically signed readings  
✅ **Reliable**: Retry logic and error handling  
✅ **Performant**: >100 readings/minute, <2s latency  
✅ **Tested**: Unit, integration, and load tests  
✅ **Documented**: Complete guides and procedures  

**Status**: Ready for production deployment! 🚀

---

**Created**: 2025-09-30  
**Last Updated**: 2025-09-30  
**Version**: 1.0
