# Week 2 Planning: Enhanced Simulator & Error Handling

**Planning Date**: 2025-09-30  
**Start Date**: TBD (After Week 1 Testing Complete)  
**Duration**: 5 days  
**Team**: Engineering Department

---

## Overview

Week 2 focuses on enhancing the reliability and robustness of the simulator and API gateway integration. Key objectives include implementing retry logic, cryptographic signatures, batch submissions, and comprehensive integration testing.

## Prerequisites

- ✅ Week 1 complete (blockchain integration)
- ✅ Local testing successful
- ✅ Oracle program deployed and initialized
- ⏳ Performance baseline established

## Goals

1. **Reliability**: Implement retry logic for failed blockchain submissions
2. **Security**: Add real cryptographic signatures
3. **Performance**: Optimize with batch submissions
4. **Quality**: Comprehensive integration testing

---

## Day 1-2: Retry Logic with Exponential Backoff

### Objectives

Implement robust retry mechanism for failed blockchain submissions to ensure data consistency and reliability.

### Tasks

#### 1. Retry Queue Implementation (API Gateway)

**File**: `api-gateway/src/services/retry_queue.rs`

```rust
pub struct RetryQueue {
    queue: Arc<Mutex<VecDeque<RetryItem>>>,
    max_retries: u32,
    base_delay_ms: u64,
}

pub struct RetryItem {
    pub reading_id: Uuid,
    pub meter_id: String,
    pub energy_generated: f64,
    pub energy_consumed: f64,
    pub timestamp: i64,
    pub attempt: u32,
    pub last_error: Option<String>,
    pub next_retry_at: DateTime<Utc>,
}

impl RetryQueue {
    pub async fn enqueue(&self, item: RetryItem) -> Result<()>;
    pub async fn process_queue(&self) -> Result<()>;
    pub fn calculate_backoff(&self, attempt: u32) -> Duration;
}
```

**Features**:
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Maximum 5 retry attempts
- Dead letter queue for permanent failures
- Persistent storage in PostgreSQL

#### 2. Database Schema

**Migration**: `api-gateway/migrations/add_retry_queue.sql`

```sql
CREATE TABLE blockchain_retry_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reading_id UUID NOT NULL REFERENCES energy_readings(id),
    meter_id VARCHAR(100) NOT NULL,
    energy_generated NUMERIC(10, 2) NOT NULL,
    energy_consumed NUMERIC(10, 2) NOT NULL,
    reading_timestamp TIMESTAMPTZ NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    last_error TEXT,
    next_retry_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE blockchain_dead_letter_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reading_id UUID NOT NULL,
    meter_id VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    final_error TEXT NOT NULL,
    attempts INT NOT NULL,
    failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_retry_queue_next_retry ON blockchain_retry_queue(next_retry_at);
CREATE INDEX idx_retry_queue_reading_id ON blockchain_retry_queue(reading_id);
```

#### 3. Background Worker

**File**: `api-gateway/src/workers/retry_worker.rs`

```rust
pub struct RetryWorker {
    retry_queue: Arc<RetryQueue>,
    blockchain_service: Arc<BlockchainService>,
    interval: Duration,
}

impl RetryWorker {
    pub async fn start(&self) {
        loop {
            self.process_retries().await;
            tokio::time::sleep(self.interval).await;
        }
    }
    
    async fn process_retries(&self) -> Result<()> {
        let items = self.retry_queue.get_ready_items().await?;
        
        for item in items {
            match self.retry_submission(&item).await {
                Ok(_) => {
                    self.retry_queue.remove(&item.id).await?;
                }
                Err(e) if item.attempt >= item.max_attempts => {
                    self.move_to_dead_letter(&item, e).await?;
                }
                Err(e) => {
                    self.retry_queue.update_retry(&item, e).await?;
                }
            }
        }
        
        Ok(())
    }
}
```

#### 4. Integration with Meter Handler

**Update**: `api-gateway/src/handlers/meters.rs`

```rust
// On blockchain submission failure
if let Err(e) = blockchain_service.submit_meter_reading(...).await {
    tracing::error!("Blockchain submission failed: {}", e);
    
    // Enqueue for retry
    retry_queue.enqueue(RetryItem {
        reading_id,
        meter_id: payload.meter_id.clone(),
        energy_generated: payload.energy_generated,
        energy_consumed: payload.energy_consumed,
        timestamp: payload.timestamp.timestamp(),
        attempt: 0,
        last_error: Some(e.to_string()),
        next_retry_at: Utc::now() + Duration::seconds(1),
    }).await?;
}
```

### Testing

- Unit tests for backoff calculation
- Integration tests for retry queue
- Failure scenario testing
- Dead letter queue verification

### Deliverables

- [ ] Retry queue implementation
- [ ] Database migrations
- [ ] Background worker
- [ ] Handler integration
- [ ] Unit tests
- [ ] Integration tests
- [ ] Documentation

---

## Day 3: Cryptographic Signature Generation

### Objectives

Replace placeholder signatures with real Ed25519 cryptographic signatures for engineering authority validation.

### Tasks

#### 1. Signature Service (Simulator)

**File**: `smart-meter-simulator/signature_service.py`

```python
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization
import base64
import json

class SignatureService:
    def __init__(self, private_key_path: str):
        self.private_key = self._load_private_key(private_key_path)
        self.public_key = self.private_key.public_key()
    
    def sign_reading(self, reading: Dict) -> str:
        """Generate Ed25519 signature for meter reading"""
        # Create canonical message
        message = self._create_canonical_message(reading)
        
        # Sign message
        signature = self.private_key.sign(message.encode())
        
        # Return base64-encoded signature
        return base64.b64encode(signature).decode()
    
    def _create_canonical_message(self, reading: Dict) -> str:
        """Create canonical message for signing"""
        return json.dumps({
            "meter_id": reading["meter_id"],
            "timestamp": reading["timestamp"],
            "energy_generated": reading["energy_generated"],
            "energy_consumed": reading["energy_consumed"],
        }, sort_keys=True)
    
    def get_public_key_base64(self) -> str:
        """Get base64-encoded public key"""
        public_bytes = self.public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )
        return base64.b64encode(public_bytes).decode()
```

#### 2. Key Generation Script

**File**: `smart-meter-simulator/scripts/generate-signing-key.py`

```python
#!/usr/bin/env python3
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization
import json

# Generate new key pair
private_key = Ed25519PrivateKey.generate()
public_key = private_key.public_key()

# Serialize private key
private_bytes = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

# Serialize public key
public_bytes = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

# Save keys
with open("keys/engineering-private-key.pem", "wb") as f:
    f.write(private_bytes)

with open("keys/engineering-public-key.pem", "wb") as f:
    f.write(public_bytes)

print("✅ Engineering authority keys generated")
print(f"Private key: keys/engineering-private-key.pem")
print(f"Public key: keys/engineering-public-key.pem")
```

#### 3. Signature Verification (API Gateway)

**File**: `api-gateway/src/services/signature_verification.rs`

```rust
use ed25519_dalek::{PublicKey, Signature, Verifier};
use base64::{Engine as _, engine::general_purpose};

pub struct SignatureVerifier {
    public_key: PublicKey,
}

impl SignatureVerifier {
    pub fn new(public_key_base64: &str) -> Result<Self> {
        let public_key_bytes = general_purpose::STANDARD
            .decode(public_key_base64)?;
        let public_key = PublicKey::from_bytes(&public_key_bytes)?;
        
        Ok(Self { public_key })
    }
    
    pub fn verify_reading(
        &self,
        reading: &EnergyReadingSubmission,
        signature_base64: &str,
    ) -> Result<bool> {
        // Create canonical message
        let message = self.create_canonical_message(reading)?;
        
        // Decode signature
        let signature_bytes = general_purpose::STANDARD
            .decode(signature_base64)?;
        let signature = Signature::from_bytes(&signature_bytes)?;
        
        // Verify signature
        Ok(self.public_key.verify(message.as_bytes(), &signature).is_ok())
    }
    
    fn create_canonical_message(
        &self,
        reading: &EnergyReadingSubmission,
    ) -> Result<String> {
        Ok(serde_json::to_string(&json!({
            "meter_id": reading.meter_id,
            "timestamp": reading.timestamp.to_rfc3339(),
            "energy_generated": reading.energy_generated,
            "energy_consumed": reading.energy_consumed,
        }))?))
    }
}
```

#### 4. Integration

**Update**: `api-gateway/src/handlers/meters.rs`

```rust
// Verify signature before processing
let signature_verifier = state.signature_verifier.as_ref()
    .ok_or_else(|| ApiError::ConfigError("Signature verification not configured"))?;

if !signature_verifier.verify_reading(&payload, &payload.engineering_authority_signature)? {
    return Err(ApiError::Unauthorized("Invalid engineering authority signature"));
}
```

### Testing

- Signature generation tests
- Signature verification tests
- Invalid signature rejection
- Key rotation testing

### Deliverables

- [ ] Signature service (simulator)
- [ ] Key generation script
- [ ] Signature verification (gateway)
- [ ] Handler integration
- [ ] Tests
- [ ] Documentation

---

## Day 4: Batch Submission Optimization

### Objectives

Optimize blockchain submissions by batching multiple readings into single transactions.

### Tasks

#### 1. Batch Collector

**File**: `api-gateway/src/services/batch_collector.rs`

```rust
pub struct BatchCollector {
    batch: Arc<Mutex<Vec<MeterReading>>>,
    max_batch_size: usize,
    batch_timeout: Duration,
}

impl BatchCollector {
    pub async fn add_reading(&self, reading: MeterReading) -> Result<()> {
        let mut batch = self.batch.lock().await;
        batch.push(reading);
        
        if batch.len() >= self.max_batch_size {
            self.flush_batch().await?;
        }
        
        Ok(())
    }
    
    pub async fn flush_batch(&self) -> Result<()> {
        let mut batch = self.batch.lock().await;
        
        if batch.is_empty() {
            return Ok(());
        }
        
        let readings = batch.drain(..).collect::<Vec<_>>();
        drop(batch);
        
        self.submit_batch(readings).await
    }
}
```

#### 2. Batch Transaction Builder

**Update**: `api-gateway/src/services/blockchain.rs`

```rust
pub async fn submit_meter_readings_batch(
    &self,
    readings: Vec<(String, f64, f64, i64)>,
) -> Result<Signature> {
    let mut instructions = Vec::new();
    
    for (meter_id, generated, consumed, timestamp) in readings {
        let instruction = self.build_submit_meter_reading_instruction(
            oracle_data_pda,
            meter_reading_record_pda,
            meter_id,
            (generated * 1000.0) as u64,
            (consumed * 1000.0) as u64,
            timestamp,
        )?;
        
        instructions.push(instruction);
    }
    
    self.send_transaction(instructions).await
}
```

#### 3. Performance Comparison

**File**: `api-gateway/benches/batch_vs_single.rs`

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn benchmark_single_submissions(c: &mut Criterion) {
    c.bench_function("single_submission", |b| {
        b.iter(|| {
            // Submit single reading
        });
    });
}

fn benchmark_batch_submissions(c: &mut Criterion) {
    c.bench_function("batch_submission_10", |b| {
        b.iter(|| {
            // Submit batch of 10 readings
        });
    });
}

criterion_group!(benches, benchmark_single_submissions, benchmark_batch_submissions);
criterion_main!(benches);
```

### Testing

- Batch collection tests
- Transaction size limits
- Performance benchmarks
- Failure handling in batches

### Deliverables

- [ ] Batch collector
- [ ] Batch transaction builder
- [ ] Performance benchmarks
- [ ] Configuration options
- [ ] Tests
- [ ] Documentation

---

## Day 5: Integration Testing

### Objectives

Comprehensive end-to-end testing of the complete flow from simulator to blockchain.

### Test Scenarios

#### 1. Happy Path Testing

```bash
# Test: Normal operation with 25 meters
- Start simulator with 25 meters
- Verify all readings submitted to gateway
- Verify all readings submitted to blockchain
- Verify blockchain signatures stored
- Verify no errors in logs
```

#### 2. Load Testing

```bash
# Test: 100+ readings/minute sustained load
- Configure simulator for 15s intervals
- Run for 10 minutes
- Measure throughput, latency, error rate
- Verify system stability
```

#### 3. Failure Scenarios

```bash
# Test: Blockchain unavailable
- Stop Solana validator
- Submit readings
- Verify readings stored in database
- Verify retry queue populated
- Restart validator
- Verify retries succeed

# Test: Database unavailable
- Stop PostgreSQL
- Submit readings
- Verify graceful error handling
- Restart PostgreSQL
- Verify recovery

# Test: Invalid signatures
- Submit reading with invalid signature
- Verify rejection
- Verify error logged
```

#### 4. Performance Testing

```bash
# Metrics to measure:
- Submission latency (p50, p95, p99)
- Throughput (readings/second)
- Error rate
- Retry success rate
- Resource utilization (CPU, memory, network)
```

### Deliverables

- [ ] Test suite implementation
- [ ] Load testing scripts
- [ ] Performance benchmarks
- [ ] Test report
- [ ] Bug fixes
- [ ] Documentation updates

---

## Success Criteria

### Functional Requirements

- [ ] Retry logic successfully recovers from transient failures
- [ ] Cryptographic signatures properly generated and verified
- [ ] Batch submissions reduce transaction costs by >50%
- [ ] All integration tests pass

### Performance Requirements

- [ ] Transaction success rate >99%
- [ ] Submission latency p95 <1s
- [ ] Throughput >100 readings/minute
- [ ] Retry success rate >95%

### Quality Requirements

- [ ] Code coverage >80%
- [ ] All documentation updated
- [ ] No critical bugs
- [ ] Performance benchmarks documented

---

## Dependencies

### External

- Solana test validator running
- Oracle program deployed
- PostgreSQL/TimescaleDB running
- Redis running

### Internal

- Week 1 blockchain integration complete
- API Gateway running
- Simulator operational

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Batch size too large | Transaction failures | Medium | Configurable batch size, testing |
| Retry queue overflow | Memory issues | Low | Dead letter queue, monitoring |
| Signature verification slow | Performance impact | Low | Caching, optimization |
| Integration test complexity | Delayed completion | Medium | Incremental testing, automation |

---

## Timeline

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| 1-2 | Retry logic | Retry queue, worker, tests |
| 3 | Signatures | Signature service, verification |
| 4 | Batch optimization | Batch collector, benchmarks |
| 5 | Integration testing | Test suite, report |

---

## Resources

### Documentation

- Week 1 implementation docs
- Solana transaction documentation
- Ed25519 signature specification

### Tools

- Rust testing framework
- Python cryptography library
- k6 or Locust for load testing
- Grafana for monitoring

---

**Status**: Planning Complete  
**Ready to Start**: After Week 1 testing  
**Estimated Duration**: 5 days  
**Team Size**: 1-2 engineers

**Last Updated**: 2025-09-30
