# Governance Program Documentation

**Program ID**: `HGMERbTnVUT344mjFkWBvt2pB7h67u2GKrKT8AhdttRe`

## Overview

The Governance Program implements a Proof of Authority (PoA) model with the University Engineering Department as the sole authority. It manages Energy Renewable Certificates (ERCs), system parameters, and emergency controls for the GridTokenX platform.

## Key Concepts

### Proof of Authority (PoA)

GridTokenX uses a single-authority governance model:
- **Authority**: University Engineering Department
- **Responsibilities**: ERC issuance, validation, system management
- **Benefits**: Fast finality, regulatory compliance, academic oversight

### Energy Renewable Certificates (ERCs)

ERCs certify that energy tokens represent actual renewable energy generation:
- **Issuance**: Only by Engineering Department
- **Validation**: Automated or manual validation
- **Revocation**: Can be revoked if fraudulent
- **Validity**: 1 year default validity period

## Account Structures

### PoA Config Account

```rust
pub struct PoaConfig {
    pub authority: Pubkey,              // Engineering Department authority
    pub authority_name: String,         // Authority name
    pub contact_info: String,           // Contact information
    pub emergency_paused: bool,         // Emergency pause status
    pub emergency_timestamp: Option<i64>, // When emergency was triggered
    pub emergency_reason: Option<String>, // Reason for emergency
    pub created_at: i64,                // Creation timestamp
    pub last_updated: i64,              // Last update timestamp
    pub erc_validation_enabled: bool,   // ERC validation enabled
    pub max_erc_amount: u64,            // Max energy per ERC (Wh)
    pub total_ercs_issued: u64,         // Total ERCs issued
    pub total_ercs_validated: u64,      // Total ERCs validated
    pub version: u32,                   // Config version
    pub delegation_enabled: bool,       // Delegation enabled (future)
    pub oracle_authority: Option<Pubkey>, // Oracle authority (optional)
    pub min_energy_amount: u64,         // Min energy per ERC (Wh)
    pub erc_validity_period: i64,       // ERC validity in seconds
    pub maintenance_mode: bool,         // Maintenance mode status
}
```

**Size**: 8 + 32 + (4 + 64) + (4 + 64) + 1 + (1 + 8) + (1 + 4 + 128) + 8 + 8 + 1 + 8 + 8 + 8 + 4 + 1 + (1 + 32) + 8 + 8 + 1 = ~400 bytes

### ERC Certificate Account

```rust
pub struct ErcCertificate {
    pub certificate_id: String,         // Unique certificate ID
    pub issuer: Pubkey,                 // Issuer (Engineering Dept)
    pub recipient: Pubkey,              // Certificate recipient
    pub energy_amount: u64,             // Energy amount (Wh)
    pub renewable_source: String,       // Energy source (Solar, Wind, etc.)
    pub validation_data: String,        // Validation metadata
    pub issued_at: i64,                 // Issuance timestamp
    pub expires_at: i64,                // Expiration timestamp
    pub validated: bool,                // Validation status
    pub validated_at: Option<i64>,      // Validation timestamp
    pub revoked: bool,                  // Revocation status
    pub revoked_at: Option<i64>,        // Revocation timestamp
    pub revocation_reason: Option<String>, // Revocation reason
}
```

**Size**: 8 + (4 + 64) + 32 + 32 + 8 + (4 + 64) + (4 + 256) + 8 + 8 + 1 + (1 + 8) + 1 + (1 + 8) + (1 + 4 + 128) = ~650 bytes

## Instructions

### 1. Initialize PoA

Initialize PoA governance with Engineering Department authority.

**Accounts:**
- `poa_config` - PoA config account (init, payer = authority)
- `authority` - Engineering Department authority (signer)
- `system_program` - System program

**Parameters:** None

**Example:**

```typescript
await governanceProgram.methods
  .initializePoa()
  .accounts({
    poaConfig: poaConfigPDA,
    authority: engineeringDept.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

**Events Emitted:**
```rust
PoAInitialized {
    authority: Pubkey,
    authority_name: String,
    timestamp: i64,
}
```

**Default Configuration:**
- Authority: Engineering Department
- Max ERC: 1,000,000 kWh
- Min ERC: 100 kWh
- Validity: 1 year
- Emergency paused: false
- Maintenance mode: false

---

### 2. Issue ERC

Issue an Energy Renewable Certificate (Engineering Department only).

**Accounts:**
- `poa_config` - PoA config account (mut)
- `erc_certificate` - ERC certificate account (init, payer = authority)
- `recipient` - Certificate recipient
- `authority` - Engineering Department (signer)
- `system_program` - System program

**Parameters:**
- `certificate_id: String` - Unique certificate ID (max 64 chars)
- `energy_amount: u64` - Energy amount in Wh
- `renewable_source: String` - Energy source (max 64 chars)
- `validation_data: String` - Validation metadata (max 256 chars)

**Example:**

```typescript
import { BN } from '@coral-xyz/anchor';

await governanceProgram.methods
  .issueErc(
    "ERC-2025-001",
    new BN(50_000),  // 50 kWh
    "Solar",
    "Verified by Engineering Dept - Panel ID: SP-A-301"
  )
  .accounts({
    poaConfig: poaConfigPDA,
    ercCertificate: ercCertificatePDA,
    recipient: prosumer.publicKey,
    authority: engineeringDept.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

**Events Emitted:**
```rust
ErcIssued {
    certificate_id: String,
    issuer: Pubkey,
    recipient: Pubkey,
    energy_amount: u64,
    renewable_source: String,
    timestamp: i64,
}
```

**Validation Rules:**
- System not in emergency pause
- System not in maintenance mode
- ERC validation enabled
- Energy amount >= min_energy_amount (100 kWh)
- Energy amount <= max_erc_amount (1,000,000 kWh)
- Certificate ID <= 64 characters
- Renewable source <= 64 characters
- Validation data <= 256 characters

**Errors:**
- `SystemPaused` - System is in emergency pause
- `MaintenanceMode` - System is in maintenance mode
- `ErcValidationDisabled` - ERC validation is disabled
- `BelowMinimumEnergy` - Energy amount below minimum
- `ExceedsMaximumEnergy` - Energy amount exceeds maximum
- `CertificateIdTooLong` - Certificate ID too long
- `SourceNameTooLong` - Source name too long
- `ValidationDataTooLong` - Validation data too long

---

### 3. Validate ERC

Validate an issued ERC (Engineering Department only).

**Accounts:**
- `poa_config` - PoA config account (mut)
- `erc_certificate` - ERC certificate account (mut)
- `authority` - Engineering Department (signer)

**Parameters:**
- `certificate_id: String` - Certificate ID to validate

**Example:**

```typescript
await governanceProgram.methods
  .validateErc("ERC-2025-001")
  .accounts({
    poaConfig: poaConfigPDA,
    ercCertificate: ercCertificatePDA,
    authority: engineeringDept.publicKey,
  })
  .rpc();
```

**Events Emitted:**
```rust
ErcValidated {
    certificate_id: String,
    validator: Pubkey,
    timestamp: i64,
}
```

**Errors:**
- `CertificateNotFound` - Certificate does not exist
- `CertificateAlreadyValidated` - Certificate already validated
- `CertificateRevoked` - Certificate has been revoked
- `CertificateExpired` - Certificate has expired

---

### 4. Revoke ERC

Revoke an ERC (Engineering Department only).

**Accounts:**
- `poa_config` - PoA config account
- `erc_certificate` - ERC certificate account (mut)
- `authority` - Engineering Department (signer)

**Parameters:**
- `certificate_id: String` - Certificate ID to revoke
- `reason: String` - Revocation reason (max 128 chars)

**Example:**

```typescript
await governanceProgram.methods
  .revokeErc(
    "ERC-2025-001",
    "Fraudulent generation data detected"
  )
  .accounts({
    poaConfig: poaConfigPDA,
    ercCertificate: ercCertificatePDA,
    authority: engineeringDept.publicKey,
  })
  .rpc();
```

**Events Emitted:**
```rust
ErcRevoked {
    certificate_id: String,
    revoker: Pubkey,
    reason: String,
    timestamp: i64,
}
```

**Errors:**
- `CertificateNotFound` - Certificate does not exist
- `CertificateAlreadyRevoked` - Certificate already revoked
- `RevocationReasonTooLong` - Reason exceeds 128 characters

---

### 5. Emergency Pause

Activate emergency pause (Engineering Department only).

**Accounts:**
- `poa_config` - PoA config account (mut)
- `authority` - Engineering Department (signer)

**Parameters:** None

**Example:**

```typescript
await governanceProgram.methods
  .emergencyPause()
  .accounts({
    poaConfig: poaConfigPDA,
    authority: engineeringDept.publicKey,
  })
  .rpc();
```

**Events Emitted:**
```rust
EmergencyPauseActivated {
    authority: Pubkey,
    timestamp: i64,
}
```

**Effects:**
- All ERC issuance stopped
- All trading operations paused
- System enters safe mode

**Errors:**
- `AlreadyPaused` - System already in emergency pause

---

### 6. Emergency Unpause

Deactivate emergency pause (Engineering Department only).

**Accounts:**
- `poa_config` - PoA config account (mut)
- `authority` - Engineering Department (signer)

**Parameters:** None

**Example:**

```typescript
await governanceProgram.methods
  .emergencyUnpause()
  .accounts({
    poaConfig: poaConfigPDA,
    authority: engineeringDept.publicKey,
  })
  .rpc();
```

**Events Emitted:**
```rust
EmergencyPauseDeactivated {
    authority: Pubkey,
    timestamp: i64,
}
```

**Errors:**
- `NotPaused` - System is not in emergency pause

---

### 7. Update PoA Config

Update PoA configuration parameters (Engineering Department only).

**Accounts:**
- `poa_config` - PoA config account (mut)
- `authority` - Engineering Department (signer)

**Parameters:**
- `max_erc_amount: Option<u64>` - New max ERC amount
- `min_energy_amount: Option<u64>` - New min energy amount
- `erc_validity_period: Option<i64>` - New validity period
- `erc_validation_enabled: Option<bool>` - Enable/disable validation
- `maintenance_mode: Option<bool>` - Enable/disable maintenance

**Example:**

```typescript
await governanceProgram.methods
  .updatePoaConfig(
    new BN(2_000_000),  // 2M kWh max
    new BN(50),         // 50 kWh min
    new BN(63_072_000), // 2 years validity
    true,               // Validation enabled
    false               // Maintenance off
  )
  .accounts({
    poaConfig: poaConfigPDA,
    authority: engineeringDept.publicKey,
  })
  .rpc();
```

**Events Emitted:**
```rust
PoaConfigUpdated {
    authority: Pubkey,
    timestamp: i64,
}
```

**Errors:**
- `UnauthorizedAuthority` - Caller is not the authority
- `InvalidConfiguration` - Invalid parameter values

---

## PDA (Program Derived Address) Seeds

### PoA Config PDA
```typescript
const [poaConfigPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("poa_config")],
  governanceProgram.programId
);
```

### ERC Certificate PDA
```typescript
const [ercCertificatePDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("erc"),
    Buffer.from(certificateId),
    recipient.toBuffer()
  ],
  governanceProgram.programId
);
```

## Error Codes

```rust
pub enum GovernanceError {
    #[msg("Unauthorized authority")]
    UnauthorizedAuthority = 6000,
    
    #[msg("System is in emergency pause")]
    SystemPaused = 6001,
    
    #[msg("System is already paused")]
    AlreadyPaused = 6002,
    
    #[msg("System is not paused")]
    NotPaused = 6003,
    
    #[msg("System is in maintenance mode")]
    MaintenanceMode = 6004,
    
    #[msg("ERC validation is disabled")]
    ErcValidationDisabled = 6005,
    
    #[msg("Energy amount below minimum")]
    BelowMinimumEnergy = 6006,
    
    #[msg("Energy amount exceeds maximum")]
    ExceedsMaximumEnergy = 6007,
    
    #[msg("Certificate ID too long (max 64 characters)")]
    CertificateIdTooLong = 6008,
    
    #[msg("Source name too long (max 64 characters)")]
    SourceNameTooLong = 6009,
    
    #[msg("Validation data too long (max 256 characters)")]
    ValidationDataTooLong = 6010,
    
    #[msg("Revocation reason too long (max 128 characters)")]
    RevocationReasonTooLong = 6011,
    
    #[msg("Certificate not found")]
    CertificateNotFound = 6012,
    
    #[msg("Certificate already validated")]
    CertificateAlreadyValidated = 6013,
    
    #[msg("Certificate already revoked")]
    CertificateAlreadyRevoked = 6014,
    
    #[msg("Certificate has been revoked")]
    CertificateRevoked = 6015,
    
    #[msg("Certificate has expired")]
    CertificateExpired = 6016,
    
    #[msg("Invalid configuration parameters")]
    InvalidConfiguration = 6017,
}
```

## Usage Examples

### Complete Governance Setup

```typescript
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

// 1. Initialize PoA (one-time, by Engineering Department)
const [poaConfigPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("poa_config")],
  governanceProgram.programId
);

await governanceProgram.methods
  .initializePoa()
  .accounts({
    poaConfig: poaConfigPDA,
    authority: engineeringDept.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

console.log("PoA governance initialized");

// 2. Issue ERC for prosumer
const certificateId = "ERC-2025-001";
const [ercCertificatePDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("erc"),
    Buffer.from(certificateId),
    prosumer.publicKey.toBuffer()
  ],
  governanceProgram.programId
);

await governanceProgram.methods
  .issueErc(
    certificateId,
    new BN(100_000),  // 100 kWh
    "Solar",
    "Verified by Engineering Dept - Panel ID: SP-A-301-001"
  )
  .accounts({
    poaConfig: poaConfigPDA,
    ercCertificate: ercCertificatePDA,
    recipient: prosumer.publicKey,
    authority: engineeringDept.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

console.log("ERC issued:", certificateId);

// 3. Validate ERC
await governanceProgram.methods
  .validateErc(certificateId)
  .accounts({
    poaConfig: poaConfigPDA,
    ercCertificate: ercCertificatePDA,
    authority: engineeringDept.publicKey,
  })
  .rpc();

console.log("ERC validated");

// 4. Query ERC certificate
const ercAccount = await governanceProgram.account.ercCertificate.fetch(
  ercCertificatePDA
);

console.log("ERC Details:", {
  certificateId: ercAccount.certificateId,
  energyAmount: ercAccount.energyAmount.toNumber(),
  source: ercAccount.renewableSource,
  validated: ercAccount.validated,
  revoked: ercAccount.revoked,
  expiresAt: new Date(ercAccount.expiresAt.toNumber() * 1000)
});
```

### Emergency Pause Example

```typescript
// Activate emergency pause
console.log("Activating emergency pause...");
await governanceProgram.methods
  .emergencyPause()
  .accounts({
    poaConfig: poaConfigPDA,
    authority: engineeringDept.publicKey,
  })
  .rpc();

console.log("System paused - all operations halted");

// ... investigate issue ...

// Deactivate emergency pause
console.log("Deactivating emergency pause...");
await governanceProgram.methods
  .emergencyUnpause()
  .accounts({
    poaConfig: poaConfigPDA,
    authority: engineeringDept.publicKey,
  })
  .rpc();

console.log("System resumed - operations restored");
```

## Best Practices

1. **Authority Security**: Protect Engineering Department key with HSM
2. **ERC Validation**: Validate all ERCs promptly after issuance
3. **Certificate IDs**: Use consistent naming convention (e.g., ERC-YYYY-NNN)
4. **Emergency Procedures**: Document emergency pause procedures
5. **Audit Trail**: Monitor all governance events for compliance
6. **Regular Reviews**: Review and revoke fraudulent certificates promptly

## Integration with Other Programs

The Governance Program is referenced by:

- **Energy Token Program**: Validates ERCs before token minting
- **Oracle Program**: May have oracle authority delegation
- **Trading Program**: Checks emergency pause status
- **Registry Program**: Validates user authorization

## Monitoring

Monitor these events for governance activity:

- `ErcIssued` - Track certificate issuance
- `ErcValidated` - Monitor validation activity
- `ErcRevoked` - Track revocations for fraud detection
- `EmergencyPauseActivated` / `EmergencyPauseDeactivated` - Critical system events
- `PoaConfigUpdated` - Track configuration changes

## Security Considerations

1. **Single Authority**: Engineering Department has full control
2. **Emergency Controls**: Immediate pause capability for critical issues
3. **Audit Trail**: All actions are logged on-chain
4. **Certificate Validation**: Multi-step validation process
5. **Revocation**: Fraudulent certificates can be revoked

## Compliance & Auditing

### ERC Lifecycle Tracking

```typescript
// Query all ERCs for a recipient
const ercs = await governanceProgram.account.ercCertificate.all([
  {
    memcmp: {
      offset: 8 + 68,  // After discriminator and certificate_id
      bytes: recipient.publicKey.toBase58(),
    }
  }
]);

console.log(`Total ERCs: ${ercs.length}`);
console.log(`Validated: ${ercs.filter(e => e.account.validated).length}`);
console.log(`Revoked: ${ercs.filter(e => e.account.revoked).length}`);
```

---

**Last Updated**: 2025-09-30
