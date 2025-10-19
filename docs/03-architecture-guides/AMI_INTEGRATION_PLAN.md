# AMI Integration Specification for P2P Energy Trading System

## **Executive Summary**

Advanced Metering Infrastructure (AMI) integration specification for P2P Energy Trading System with cryptographically secure, API-based communication protocol between smart meters and blockchain system.

**Technical Requirements:**
- RSA-4096/ECDSA-P256 cryptographic authentication
- X.509 PKI certificate management infrastructure
- Sub-millisecond data validation pipeline
- 99.99% uptime with automatic failover
- 10,000+ concurrent device connections per API gateway

## **System Architecture**

**Core Components:**
- Smart Meters with RSA-4096 authentication
- Load Balancer with rate limiting (4 req/min)
- API Gateway (Rust/Axum) with JWT/OAuth2
- Blockchain Layer (Solana/Anchor)
- PostgreSQL Device Registry with JSONB metadata
- Redis Cache (15min TTL)
- TimescaleDB for time series (1sec resolution)
- Prometheus monitoring

**Security Infrastructure:**
- Hardware Security Module (HSM) for private key protection
- PKI Infrastructure with self-signed root CA (4096-bit RSA)
- Sub-100ms signature verification pipeline
- Kubernetes-ready microservice architecture

## **Database Schema Requirements**

### **Smart Meter Device Registry**

**Primary Table: smart_meters**
- UUID primary key with meter_id as UUID (generated automatically)
- Device identification: serial, manufacturer, model, firmware_version, hardware_revision
- Cryptographic security: RSA-4096 public key, X.509 certificate, HSM fingerprint
- Network configuration: MAC address, IP, protocol (mqtt_tls, coap_dtls, https_rest, websocket_secure)
- Blockchain integration: wallet_address, owner_wallet, solana_program_account
- Physical installation: location (JSONB), GPS coordinates, security level
- Operational status: device_status enum, health_score (0.00-1.00), maintenance schedules
- Device capabilities: JSONB with current limits, voltage ranges, encryption algorithms
- Security profile: JSONB with tamper detection, secure boot, TPM 2.0 settings
- Performance metrics: JSONB with uptime, response times, integrity scores

**Device Status Types:**
- pending_registration, provisioning, active, inactive, maintenance, firmware_update, compromised, quarantined, decommissioned

**Security Level Types:**
- basic, standard, high, critical_infrastructure

### **Device Authentication Infrastructure**

**Table: device_auth_tokens**
- Token management: SHA-512 hash, token types (api_key, jwt_bearer, oauth2_client_credentials, x509_certificate, mutual_tls, hardware_attestation)
- Cryptographic details: AES-256-GCM encryption, PBKDF2-SHA256 key derivation
- Lifecycle: issued_at, expires_at, usage tracking
- Access control: IP ranges, endpoint restrictions, rate limiting (4 req/min)

**Table: device_security_events**
- Event classification: security_event_type, severity (info, low, medium, high, critical, emergency)
- Context information: source IP, request details, response metrics
- Threat intelligence: IoC data, geolocation, device fingerprinting
- Machine learning: anomaly scores, model versions, feature vectors

**Security Event Types:**
- authentication_failure/success, authorization_failure, certificate issues
- suspicious_activity, anomalous_behavior, data integrity violations
- network intrusion attempts, device tampering, physical security breaches

### **Wallet Verification System**

**Table: wallet_verifications**
- Verification types: kyc_basic, kyc_advanced, engineering_faculty, engineering_student, utility_company
- Verification status: pending, verified, rejected, expired
- JSONB verification data with timestamps and verifier references

## **Security Architecture Specification**

### **Multi-Layer Cryptographic Security**

**Layer 1: Hardware Security Module (HSM)**
- TPM 2.0/HSM integration for private key storage
- Hardware attestation with boot chain verification
- Secure element for cryptographic operations

**Layer 2: API Authentication & Authorization**
- X.509 certificate validation
- Digital signature verification (RSA-4096, ECDSA-P256, Ed25519)
- Wallet ownership verification
- Behavioral analysis and policy engine

### **Security Validation Pipeline Requirements**
- TLS 1.3 with client certificates
- Rate limiting checks (4 requests/minute per device)
- Certificate and hardware attestation validation
- Trust score calculation (threshold: 0.7)
- Real-time threat detection with ML anomaly scoring

## **API Specification**

### **Core API Endpoints**

**Device Registration & Lifecycle**
- `POST /api/meters/register` - Register new smart meter
- `GET /api/meters/{meter_id}` - Get meter details  
- `DELETE /api/meters/{meter_id}` - Decommission meter

**Energy Data Management**
- `POST /api/meters/{meter_id}/energy` - Submit energy data
- `GET /api/meters/{meter_id}/energy` - Query historical energy data
- `GET /api/meters/{meter_id}/energy/latest` - Get latest energy data
- `POST /api/meters/energy/batch` - High-speed batch processing (10K energy records/sec)

**Authentication & Security**
- `POST /api/meters/{meter_id}/auth/attest` - Hardware attestation
- `POST /api/meters/{meter_id}/auth/challenge` - Authentication challenge
- `GET /api/meters/{meter_id}/auth/status` - Authentication status
- `GET /api/meters/{meter_id}/security/status` - Real-time security monitoring
- `POST /api/meters/{meter_id}/quarantine` - Threat isolation

**Blockchain Integration**
- `POST /api/meters/{meter_id}/link-wallet` - Link meter to Solana wallet
- `POST /api/meters/{meter_id}/verify-ownership` - Cryptographic ownership proof
- `GET /api/meters/wallet/{wallet_address}` - Get all owned meters

**Real-time Communication**
- `WebSocket /api/meters/{meter_id}/stream/energy` - Real-time energy data
- `WebSocket /api/meters/{meter_id}/stream/status` - Device status updates
- `WebSocket /api/meters/{meter_id}/stream/alerts` - Device-specific alerts

### **API Performance Requirements**
- Response time: <50ms for meter operations
- Data processing: 10,000 readings/second sustained throughput
- Concurrent connections: 50,000+ simultaneous meter connections
- Batch processing: 1,000 meters registered in <2 seconds

### **API Request & Response Examples**

#### **Device Registration**
```json
POST /api/meters/register
Request:
{
  "device_serial": "SM2025-ENG-001-ABC123",
  "manufacturer": "SmartGrid Technologies",
  "model": "SGT-AMI-Pro-4000",
  "firmware_version": "2.1.5",
  "wallet_address": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "installation_location": {
    "building": "ENG_MAIN_BUILDING",
    "room": "E101",
    "gps_coordinates": {
      "latitude": 37.7749,
      "longitude": -122.4194
    }
  },
  "device_certificate": "-----BEGIN CERTIFICATE-----\n..."
}

Response (201 Created):
{
  "status": "success",
  "data": {
    "meter_id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "pending_registration",
    "registration_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2025-09-26T10:15:00Z"
  }
}
```

#### **Energy Data Submission**
```json
POST /api/meters/{meter_id}/energy
Request:
{
  "timestamp": "2025-09-25T10:15:00Z",
  "energy_data": {
    "energy_generated_kwh": 12.75,
    "energy_consumed_kwh": 8.50,
    "instantaneous_power_kw": 3.2,
    "voltage_avg_v": 240.2,
    "current_avg_a": 13.3,
    "power_factor": 0.95,
    "frequency_hz": 59.98
  },
  "device_signature": "ECDSA_P256_signature_here",
  "wallet_signature": "Ed25519_wallet_signature_here"
}

Response (200 OK):
{
  "status": "success",
  "data": {
    "record_id": "rec_20250925_101500_001",
    "timestamp": "2025-09-25T10:15:00Z",
    "validation_status": "verified",
    "blockchain_tx": "5J1sbNdBiZFGFhcXsXzc7UK9DuQT8QoJ5qkrDY8Zq8z4",
    "oracle_updated": true
  }
}
```

#### **Get Latest Energy Data**
```json
GET /api/meters/{meter_id}/energy/latest
Response (200 OK):
{
  "status": "success",
  "data": {
    "meter_id": "123e4567-e89b-12d3-a456-426614174000",
    "timestamp": "2025-09-25T10:15:00Z",
    "energy_data": {
      "energy_generated_kwh": 12.75,
      "energy_consumed_kwh": 8.50,
      "instantaneous_power_kw": 3.2,
      "voltage_avg_v": 240.2,
      "current_avg_a": 13.3,
      "power_factor": 0.95,
      "frequency_hz": 59.98
    },
    "data_quality": {
      "measurement_accuracy": 0.995,
      "sensor_health_score": 0.98,
      "calibration_status": "valid"
    },
    "blockchain_verified": true
  }
}
```

#### **Hardware Attestation**
```json
POST /api/meters/{meter_id}/auth/attest
Request:
{
  "attestation_data": {
    "tpm_version": "2.0",
    "attestation_key_certificate": "base64_encoded_ak_cert",
    "quote_signature": "tpm_quote_signature",
    "pcr_values": {
      "0": "sha256_pcr0_value",
      "1": "sha256_pcr1_value",
      "7": "sha256_pcr7_value"
    }
  },
  "challenge_response": "hardware_challenge_response",
  "timestamp": "2025-09-25T10:15:00Z"
}

Response (200 OK):
{
  "status": "success",
  "data": {
    "attestation_verified": true,
    "trust_score": 0.95,
    "hardware_integrity": "validated",
    "certificate_valid": true,
    "auth_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2025-09-25T11:15:00Z"
  }
}
```

#### **Link Wallet**
```json
POST /api/meters/{meter_id}/link-wallet
Request:
{
  "wallet_address": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "ownership_proof": {
    "message": "I own smart meter 123e4567-e89b-12d3-a456-426614174000 at 2025-09-25T10:15:00Z",
    "signature": "ed25519_signature_of_message",
    "public_key": "wallet_public_key_here"
  },
  "device_confirmation": {
    "meter_signature": "device_ecdsa_signature",
    "timestamp": "2025-09-25T10:15:00Z"
  }
}

Response (200 OK):
{
  "status": "success",
  "data": {
    "meter_id": "123e4567-e89b-12d3-a456-426614174000",
    "wallet_address": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    "ownership_verified": true,
    "blockchain_tx": "linking_transaction_hash",
    "oracle_account": "oracle_program_derived_address",
    "linked_at": "2025-09-25T10:15:00Z"
  }
}
```

#### **Error Response Format**
```json
Response (400/401/403/500):
{
  "status": "error",
  "error": {
    "code": "DEVICE_AUTHENTICATION_FAILED",
    "message": "Hardware attestation validation failed",
    "details": {
      "error_id": "err_2025092501_001",
      "timestamp": "2025-09-25T10:15:00Z",
      "validation_steps": {
        "certificate_valid": true,
        "signature_valid": false,
        "hardware_attestation": false
      },
      "retry_after_seconds": 300
    },
    "correlation_id": "corr_abc123def456"
  }
}
```

### **Rate Limiting Specification**
- Authentication endpoints: 10 requests/min
- Data submission endpoints: 4 requests/min
- Status/health endpoints: 60 requests/min
- Analytics queries: 20 requests/min
- Emergency endpoints: 100 requests/min (no limit during incidents)

### **Communication Protocols**
- HTTPS REST with TLS 1.3
- MQTT with TLS encryption
- WebSocket Secure (WSS)
- CoAP with DTLS

### **Security Requirements**
- Hardware-backed authentication (TPM 2.0/HSM)
- Mutual TLS (mTLS) authentication
- Certificate pinning for trusted CA
- End-to-end AES-256-GCM encryption
- HMAC message integrity verification
- Hardware attestation with boot chain verification

## **Implementation Specifications**

### **Development Phases**
1. **Database Schema & Basic API** (Weeks 1-2)
2. **Security Layer Implementation** (Weeks 3-4)
3. **Data Processing Pipeline** (Weeks 5-6)
4. **Testing & Integration** (Weeks 7-8)

### **Deployment Requirements**

**Smart Meter Locations**
- Main Building (Solar + Consumption): UUID auto-generated
- Main Building Units (4 meters): UUID auto-generated each
- Research Labs (High Consumption, 5 meters): UUID auto-generated each
- Dormitory Buildings (Mixed Usage, 5 meters): UUID auto-generated each

**Network Configuration**
- Primary: WiFi (WPA3-Enterprise)
- Backup: Ethernet (VLAN isolated)
- Security: Enterprise Grade
- Encryption: AES-256-GCM
- Certificate Authority: Engineering Campus CA

### **Device Security Requirements**
- Hardware Security Module (HSM) for key storage
- Secure boot with verified signatures
- Tamper detection and response
- OTA update capability with signature verification
- Network isolation and firewall protection

## **Performance & Monitoring Specifications**

### **Key Performance Indicators**
- Device uptime: >99.5%
- Data transmission success rate: >99.9%
- Security incidents: <1 per month
- Average response time: <200ms
- Energy reading accuracy: >99.5%

### **System Availability Requirements**
- Uptime: 99.99% (4.38 minutes downtime/year)
- Data integrity: 99.999% accuracy with cryptographic verification
- Fault tolerance: Automatic failover in <100ms
- Recovery time: <30 seconds for full system recovery

### **Security & Compliance**
- Threat detection: 99.5% accuracy with <0.01% false positives
- Hardware-backed authentication for every device
- End-to-end AES-256-GCM encryption
- SOC 2, ISO 27001, GDPR compliance ready

---

## **Technical Summary**

This specification defines a comprehensive AMI integration for P2P Energy Trading System with cryptographically secure smart meter communication, blockchain integration, and enterprise-grade security. The system supports 10,000+ concurrent connections with sub-millisecond validation and 99.99% uptime requirements.
