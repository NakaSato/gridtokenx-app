# Oracle Program Documentation

**Program ID**: `5DF1fmjrXTtG7qsFaLUm5TjJMG7M1a2V7kyTWPjoADV5`

## Overview

The Oracle Program serves as a bridge between off-chain smart meter data and on-chain trading logic. It receives meter readings from the API Gateway, validates them, and triggers market clearing operations. This program is critical for maintaining data integrity in the P2P energy trading system.

## Key Concepts

### Oracle Role

The Oracle acts as a trusted intermediary that:
- **Receives** meter readings from the API Gateway
- **Validates** data authenticity and format
- **Triggers** market clearing operations
- **Maintains** reading history and statistics

### API Gateway Authorization

Only the designated API Gateway can submit data to the Oracle, ensuring:
- Data comes from verified smart meters
- Readings are authenticated
- System integrity is maintained

## Account Structures

### Oracle Data Account

```rust
pub struct OracleData {
    pub authority: Pubkey,              // Oracle authority (admin)
    pub api_gateway: Pubkey,            // Authorized API Gateway
    pub total_readings: u64,            // Total readings submitted
    pub last_reading_timestamp: i64,    // Last reading timestamp
    pub last_clearing: i64,             // Last market clearing timestamp
    pub active: bool,                   // Oracle active status
    pub created_at: i64,                // Creation timestamp
}
```

**Size**: 8 + 32 + 32 + 8 + 8 + 8 + 1 + 8 = 105 bytes

### Meter Reading Record

```rust
pub struct MeterReadingRecord {
    pub meter_id: String,               // Meter identifier
    pub energy_produced: u64,           // Energy produced (Wh)
    pub energy_consumed: u64,           // Energy consumed (Wh)
    pub reading_timestamp: i64,         // Reading timestamp
    pub submitted_by: Pubkey,           // Submitter (API Gateway)
    pub submitted_at: i64,              // Submission timestamp
    pub validated: bool,                // Validation status
}
```

**Size**: 8 + (4 + 32) + 8 + 8 + 8 + 32 + 8 + 1 = 109 bytes

## Instructions

### 1. Initialize

Initialize the Oracle program with API Gateway authorization.

**Accounts:**
- `oracle_data` - Oracle data account (init, payer = authority)
- `authority` - Oracle authority (signer)
- `system_program` - System program

**Parameters:**
- `api_gateway: Pubkey` - Authorized API Gateway public key

**Example:**

```typescript
await oracleProgram.methods
  .initialize(apiGatewayPublicKey)
  .accounts({
    oracleData: oracleDataPDA,
    authority: authority.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

**Events Emitted:**
```rust
OracleInitialized {
    authority: Pubkey,
    api_gateway: Pubkey,
    timestamp: i64,
}
```

---

### 2. Submit Meter Reading

Submit meter reading data from AMI (Advanced Metering Infrastructure). Only the authorized API Gateway can call this instruction.

**Accounts:**
- `oracle_data` - Oracle data account (mut)
- `meter_reading_record` - Meter reading record (init, payer = authority)
- `authority` - API Gateway (signer)
- `system_program` - System program

**Parameters:**
- `meter_id: String` - Unique meter identifier (max 32 chars)
- `energy_produced: u64` - Energy produced in Wh
- `energy_consumed: u64` - Energy consumed in Wh
- `reading_timestamp: i64` - Unix timestamp of the reading

**Example:**

```typescript
import { BN } from '@coral-xyz/anchor';

await oracleProgram.methods
  .submitMeterReading(
    "METER-A-301-001",
    new BN(5_000),      // 5 kWh produced
    new BN(3_000),      // 3 kWh consumed
    new BN(Date.now() / 1000)
  )
  .accounts({
    oracleData: oracleDataPDA,
    meterReadingRecord: meterReadingRecordPDA,
    authority: apiGateway.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([apiGateway])
  .rpc();
```

**Events Emitted:**
```rust
MeterReadingSubmitted {
    meter_id: String,
    energy_produced: u64,
    energy_consumed: u64,
    timestamp: i64,
    submitter: Pubkey,
}
```

**Validation Rules:**
- Oracle must be active
- Caller must be the authorized API Gateway
- Meter ID must not exceed 32 characters
- Energy values must be non-negative
- Timestamp must be reasonable (not too far in past/future)

**Errors:**
- `OracleInactive` - Oracle is not active
- `UnauthorizedGateway` - Caller is not the authorized API Gateway
- `InvalidMeterId` - Meter ID is invalid or too long
- `InvalidTimestamp` - Timestamp is invalid

---

### 3. Trigger Market Clearing

Trigger the market clearing process. Only the authorized API Gateway can call this instruction.

**Accounts:**
- `oracle_data` - Oracle data account (mut)
- `authority` - API Gateway (signer)

**Parameters:** None

**Example:**

```typescript
await oracleProgram.methods
  .triggerMarketClearing()
  .accounts({
    oracleData: oracleDataPDA,
    authority: apiGateway.publicKey,
  })
  .signers([apiGateway])
  .rpc();
```

**Events Emitted:**
```rust
MarketClearingTriggered {
    authority: Pubkey,
    timestamp: i64,
}
```

**Market Clearing Process:**
1. Oracle validates clearing conditions
2. Event is emitted for off-chain systems
3. Trading program processes pending orders
4. Settlements are executed

**Errors:**
- `OracleInactive` - Oracle is not active
- `UnauthorizedGateway` - Caller is not the authorized API Gateway

---

### 4. Update Oracle Status

Update oracle active status (admin only).

**Accounts:**
- `oracle_data` - Oracle data account (mut)
- `authority` - Oracle authority (signer)

**Parameters:**
- `active: bool` - New active status

**Example:**

```typescript
// Deactivate oracle
await oracleProgram.methods
  .updateOracleStatus(false)
  .accounts({
    oracleData: oracleDataPDA,
    authority: authority.publicKey,
  })
  .rpc();

// Reactivate oracle
await oracleProgram.methods
  .updateOracleStatus(true)
  .accounts({
    oracleData: oracleDataPDA,
    authority: authority.publicKey,
  })
  .rpc();
```

**Events Emitted:**
```rust
OracleStatusUpdated {
    authority: Pubkey,
    active: bool,
    timestamp: i64,
}
```

**Errors:**
- `UnauthorizedAuthority` - Caller is not the oracle authority

---

### 5. Update API Gateway

Update the authorized API Gateway (admin only).

**Accounts:**
- `oracle_data` - Oracle data account (mut)
- `authority` - Oracle authority (signer)

**Parameters:**
- `new_api_gateway: Pubkey` - New API Gateway public key

**Example:**

```typescript
await oracleProgram.methods
  .updateApiGateway(newApiGatewayPublicKey)
  .accounts({
    oracleData: oracleDataPDA,
    authority: authority.publicKey,
  })
  .rpc();
```

**Events Emitted:**
```rust
ApiGatewayUpdated {
    old_gateway: Pubkey,
    new_gateway: Pubkey,
    timestamp: i64,
}
```

**Errors:**
- `UnauthorizedAuthority` - Caller is not the oracle authority

---

## PDA (Program Derived Address) Seeds

### Oracle Data PDA
```typescript
const [oracleDataPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("oracle")],
  oracleProgram.programId
);
```

### Meter Reading Record PDA
```typescript
const [meterReadingRecordPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("reading"),
    Buffer.from(meterId),
    timestampBuffer  // 8-byte timestamp
  ],
  oracleProgram.programId
);
```

## Error Codes

```rust
pub enum ErrorCode {
    #[msg("Oracle is not active")]
    OracleInactive = 6000,
    
    #[msg("Unauthorized API Gateway")]
    UnauthorizedGateway = 6001,
    
    #[msg("Unauthorized authority")]
    UnauthorizedAuthority = 6002,
    
    #[msg("Invalid meter ID")]
    InvalidMeterId = 6003,
    
    #[msg("Invalid timestamp")]
    InvalidTimestamp = 6004,
    
    #[msg("Invalid energy values")]
    InvalidEnergyValues = 6005,
    
    #[msg("Reading already submitted")]
    DuplicateReading = 6006,
}
```

## Data Flow

### Meter Reading Submission Flow

```
┌─────────────┐
│ Smart Meter │
└──────┬──────┘
       │ IEEE 2030.5
       ▼
┌─────────────┐
│ Smart Meter │
│  Simulator  │
└──────┬──────┘
       │ REST API
       ▼
┌─────────────┐
│ API Gateway │
│   (Rust)    │
└──────┬──────┘
       │ submit_meter_reading()
       ▼
┌─────────────┐
│   Oracle    │
│   Program   │
└──────┬──────┘
       │ Event: MeterReadingSubmitted
       ▼
┌─────────────┐
│  Off-chain  │
│  Listeners  │
└─────────────┘
```

### Market Clearing Flow

```
┌─────────────┐
│ API Gateway │
│  (Cron Job) │
└──────┬──────┘
       │ trigger_market_clearing()
       ▼
┌─────────────┐
│   Oracle    │
│   Program   │
└──────┬──────┘
       │ Event: MarketClearingTriggered
       ▼
┌─────────────┐
│   Trading   │
│   Program   │
└──────┬──────┘
       │ match_orders()
       ▼
┌─────────────┐
│   Trades    │
│  Executed   │
└─────────────┘
```

## Usage Examples

### Complete Oracle Setup

```typescript
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey, Keypair } from '@solana/web3.js';

// 1. Initialize Oracle (one-time, by admin)
const [oracleDataPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("oracle")],
  oracleProgram.programId
);

const apiGateway = Keypair.generate();

await oracleProgram.methods
  .initialize(apiGateway.publicKey)
  .accounts({
    oracleData: oracleDataPDA,
    authority: admin.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

console.log("Oracle initialized with API Gateway:", apiGateway.publicKey.toString());

// 2. Submit Meter Reading (by API Gateway)
const meterId = "METER-A-301-001";
const timestamp = Math.floor(Date.now() / 1000);

const timestampBuffer = Buffer.alloc(8);
timestampBuffer.writeBigInt64LE(BigInt(timestamp));

const [meterReadingRecordPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("reading"),
    Buffer.from(meterId),
    timestampBuffer
  ],
  oracleProgram.programId
);

await oracleProgram.methods
  .submitMeterReading(
    meterId,
    new BN(5_000),  // 5 kWh produced
    new BN(3_000),  // 3 kWh consumed
    new BN(timestamp)
  )
  .accounts({
    oracleData: oracleDataPDA,
    meterReadingRecord: meterReadingRecordPDA,
    authority: apiGateway.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([apiGateway])
  .rpc();

console.log("Meter reading submitted successfully!");

// 3. Trigger Market Clearing (by API Gateway)
await oracleProgram.methods
  .triggerMarketClearing()
  .accounts({
    oracleData: oracleDataPDA,
    authority: apiGateway.publicKey,
  })
  .signers([apiGateway])
  .rpc();

console.log("Market clearing triggered!");
```

### Event Listener

```typescript
// Listen for meter reading submissions
oracleProgram.addEventListener('MeterReadingSubmitted', (event, slot) => {
  console.log('New meter reading:', {
    meterId: event.meterId,
    produced: event.energyProduced.toNumber(),
    consumed: event.energyConsumed.toNumber(),
    timestamp: new Date(event.timestamp.toNumber() * 1000),
    slot: slot
  });
  
  // Process reading (e.g., update database, trigger token minting)
  processMeterReading(event);
});

// Listen for market clearing triggers
oracleProgram.addEventListener('MarketClearingTriggered', (event, slot) => {
  console.log('Market clearing triggered at:', new Date(event.timestamp.toNumber() * 1000));
  
  // Initiate order matching process
  initiateOrderMatching();
});
```

## Best Practices

1. **Gateway Security**: Protect API Gateway private key with HSM or secure vault
2. **Reading Validation**: Validate meter readings before submission
3. **Duplicate Prevention**: Check for duplicate readings before submission
4. **Timestamp Accuracy**: Use NTP-synchronized timestamps
5. **Error Handling**: Implement retry logic for failed submissions
6. **Event Monitoring**: Monitor events for system health

## Integration with Other Programs

The Oracle Program interacts with:

- **API Gateway**: Receives meter readings and clearing triggers
- **Energy Token Program**: Triggers token minting based on readings
- **Trading Program**: Initiates market clearing
- **Registry Program**: Validates meter registration

## Monitoring

Monitor these events for oracle activity:

- `MeterReadingSubmitted` - Track data ingestion
- `MarketClearingTriggered` - Monitor clearing frequency
- `OracleStatusUpdated` - Track system status changes
- `ApiGatewayUpdated` - Monitor gateway changes

## Security Considerations

1. **Gateway Authorization**: Only authorized gateway can submit data
2. **Authority Control**: Only oracle authority can update settings
3. **Active Status**: Oracle can be deactivated in emergencies
4. **Data Validation**: All inputs are validated before processing
5. **Timestamp Verification**: Timestamps are checked for reasonableness

## Performance Considerations

### Reading Submission Rate

```
Typical: 100-1000 readings/minute
Peak: 5000 readings/minute
Solana TPS: ~65,000 transactions/second
Oracle capacity: Well within limits
```

### Market Clearing Frequency

```
Recommended: Every 15 minutes
Minimum: Every 5 minutes
Maximum: Every 1 hour
```

## Troubleshooting

### Common Issues

**Issue**: `UnauthorizedGateway` error
- **Solution**: Verify API Gateway public key matches oracle configuration

**Issue**: `OracleInactive` error
- **Solution**: Check oracle status and reactivate if needed

**Issue**: `InvalidTimestamp` error
- **Solution**: Ensure timestamps are in Unix epoch seconds, not milliseconds

**Issue**: Duplicate reading errors
- **Solution**: Use unique PDA seeds (meter ID + timestamp)

---

**Last Updated**: 2025-09-30
