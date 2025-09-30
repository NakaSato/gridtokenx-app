# Registry Program Documentation

**Program ID**: `A1AMxAnFAKpVpCtBQneXR48KyCxEthh4Tq9bY3az1ddJ`

## Overview

The Registry Program is the foundational component of the GridTokenX platform, managing user and smart meter registration. It maintains a comprehensive database of all participants in the P2P energy trading ecosystem.

## Key Concepts

### User Types

```rust
pub enum UserType {
    Prosumer,      // Produces and consumes energy (solar panels + consumption)
    Consumer,      // Only consumes energy
    GridOperator,  // Manages grid infrastructure
    Validator,     // Validates transactions and data
}
```

### User Status

```rust
pub enum UserStatus {
    Active,        // Can participate in trading
    Suspended,     // Temporarily disabled
    Inactive,      // Permanently disabled
}
```

### Meter Types

```rust
pub enum MeterType {
    SolarProsumer,      // Solar generation + consumption
    GridConsumer,       // Grid-only consumption
    HybridProsumer,     // Solar + battery storage
    BatteryStorage,     // Battery storage only
}
```

### Meter Status

```rust
pub enum MeterStatus {
    Active,        // Operational and reporting
    Inactive,      // Not reporting
    Maintenance,   // Under maintenance
    Faulty,        // Requires repair
}
```

## Account Structures

### Registry Account

```rust
pub struct Registry {
    pub authority: Pubkey,          // Program authority
    pub user_count: u64,            // Total registered users
    pub meter_count: u64,           // Total registered meters
    pub created_at: i64,            // Creation timestamp
}
```

**Size**: 8 + 32 + 8 + 8 + 8 = 64 bytes

### User Account

```rust
pub struct UserAccount {
    pub authority: Pubkey,          // User's wallet address
    pub user_type: UserType,        // Type of user
    pub location: String,           // Physical location
    pub status: UserStatus,         // Current status
    pub registered_at: i64,         // Registration timestamp
    pub meter_count: u32,           // Number of meters owned
    pub created_at: i64,            // Account creation timestamp
}
```

**Size**: 8 + 32 + 1 + (4 + 64) + 1 + 8 + 4 + 8 = 130 bytes

### Meter Account

```rust
pub struct MeterAccount {
    pub meter_id: String,           // Unique meter identifier
    pub owner: Pubkey,              // Owner's wallet address
    pub meter_type: MeterType,      // Type of meter
    pub status: MeterStatus,        // Current status
    pub registered_at: i64,         // Registration timestamp
    pub last_reading_at: i64,       // Last reading timestamp
    pub total_generation: u64,      // Total energy generated (Wh)
    pub total_consumption: u64,     // Total energy consumed (Wh)
}
```

**Size**: 8 + (4 + 32) + 32 + 1 + 1 + 8 + 8 + 8 + 8 = 110 bytes

## Instructions

### 1. Initialize

Initialize the registry with university authority.

**Accounts:**
- `registry` - Registry account (init, payer = authority)
- `authority` - Program authority (signer)
- `system_program` - System program

**Parameters:** None

**Example:**

```typescript
await registryProgram.methods
  .initialize()
  .accounts({
    registry: registryPDA,
    authority: authority.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

**Events Emitted:**
```rust
RegistryInitialized {
    authority: Pubkey,
    timestamp: i64,
}
```

---

### 2. Register User

Register a new user in the P2P energy trading system.

**Accounts:**
- `user_account` - User account (init, payer = user_authority)
- `registry` - Registry account (mut)
- `user_authority` - User's wallet (signer)
- `system_program` - System program

**Parameters:**
- `user_type: UserType` - Type of user (Prosumer, Consumer, etc.)
- `location: String` - Physical location (max 64 chars)

**Example:**

```typescript
await registryProgram.methods
  .registerUser(
    { prosumer: {} },  // UserType enum
    "Building A, Floor 3, Room 301"
  )
  .accounts({
    userAccount: userAccountPDA,
    registry: registryPDA,
    userAuthority: user.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

**Events Emitted:**
```rust
UserRegistered {
    user: Pubkey,
    user_type: UserType,
    location: String,
    timestamp: i64,
}
```

**Errors:**
- `LocationTooLong` - Location string exceeds 64 characters

---

### 3. Register Meter

Register a smart meter for an existing user.

**Accounts:**
- `meter_account` - Meter account (init, payer = user_authority)
- `user_account` - User account (mut)
- `registry` - Registry account (mut)
- `user_authority` - User's wallet (signer)
- `system_program` - System program

**Parameters:**
- `meter_id: String` - Unique meter identifier (max 32 chars)
- `meter_type: MeterType` - Type of meter

**Example:**

```typescript
await registryProgram.methods
  .registerMeter(
    "METER-A-301-001",
    { solarProsumer: {} }  // MeterType enum
  )
  .accounts({
    meterAccount: meterAccountPDA,
    userAccount: userAccountPDA,
    registry: registryPDA,
    userAuthority: user.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

**Events Emitted:**
```rust
MeterRegistered {
    meter_id: String,
    owner: Pubkey,
    meter_type: MeterType,
    timestamp: i64,
}
```

**Errors:**
- `UnauthorizedUser` - Caller is not the user account owner
- `MeterIdTooLong` - Meter ID exceeds 32 characters

---

### 4. Update User Status

Update user status (admin only).

**Accounts:**
- `user_account` - User account (mut)
- `registry` - Registry account
- `authority` - Registry authority (signer)

**Parameters:**
- `new_status: UserStatus` - New status (Active, Suspended, Inactive)

**Example:**

```typescript
await registryProgram.methods
  .updateUserStatus({ suspended: {} })
  .accounts({
    userAccount: userAccountPDA,
    registry: registryPDA,
    authority: authority.publicKey,
  })
  .rpc();
```

**Events Emitted:**
```rust
UserStatusUpdated {
    user: Pubkey,
    old_status: UserStatus,
    new_status: UserStatus,
    timestamp: i64,
}
```

**Errors:**
- `UnauthorizedAuthority` - Caller is not the registry authority

---

### 5. Update Meter Status

Update meter status (admin only).

**Accounts:**
- `meter_account` - Meter account (mut)
- `registry` - Registry account
- `authority` - Registry authority (signer)

**Parameters:**
- `new_status: MeterStatus` - New status (Active, Inactive, Maintenance, Faulty)

**Example:**

```typescript
await registryProgram.methods
  .updateMeterStatus({ maintenance: {} })
  .accounts({
    meterAccount: meterAccountPDA,
    registry: registryPDA,
    authority: authority.publicKey,
  })
  .rpc();
```

**Events Emitted:**
```rust
MeterStatusUpdated {
    meter_id: String,
    old_status: MeterStatus,
    new_status: MeterStatus,
    timestamp: i64,
}
```

**Errors:**
- `UnauthorizedAuthority` - Caller is not the registry authority

---

### 6. Update Meter Reading

Update meter reading statistics.

**Accounts:**
- `meter_account` - Meter account (mut)
- `user_account` - User account
- `user_authority` - User's wallet (signer)

**Parameters:**
- `energy_generated: u64` - Energy generated in Wh
- `energy_consumed: u64` - Energy consumed in Wh

**Example:**

```typescript
await registryProgram.methods
  .updateMeterReading(
    new BN(5000),  // 5 kWh generated
    new BN(3000)   // 3 kWh consumed
  )
  .accounts({
    meterAccount: meterAccountPDA,
    userAccount: userAccountPDA,
    userAuthority: user.publicKey,
  })
  .rpc();
```

**Events Emitted:**
```rust
MeterReadingUpdated {
    meter_id: String,
    energy_generated: u64,
    energy_consumed: u64,
    timestamp: i64,
}
```

**Errors:**
- `UnauthorizedUser` - Caller is not the meter owner

---

## PDA (Program Derived Address) Seeds

### Registry PDA
```typescript
const [registryPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("registry")],
  registryProgram.programId
);
```

### User Account PDA
```typescript
const [userAccountPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("user"),
    userAuthority.toBuffer()
  ],
  registryProgram.programId
);
```

### Meter Account PDA
```typescript
const [meterAccountPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("meter"),
    Buffer.from(meterId),
    userAuthority.toBuffer()
  ],
  registryProgram.programId
);
```

## Error Codes

```rust
pub enum ErrorCode {
    #[msg("Unauthorized user")]
    UnauthorizedUser = 6000,
    
    #[msg("Unauthorized authority")]
    UnauthorizedAuthority = 6001,
    
    #[msg("Location string too long (max 64 characters)")]
    LocationTooLong = 6002,
    
    #[msg("Meter ID too long (max 32 characters)")]
    MeterIdTooLong = 6003,
    
    #[msg("User account not found")]
    UserNotFound = 6004,
    
    #[msg("Meter account not found")]
    MeterNotFound = 6005,
}
```

## Usage Examples

### Complete User Registration Flow

```typescript
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

// 1. Initialize Registry (one-time, by admin)
const [registryPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("registry")],
  registryProgram.programId
);

await registryProgram.methods
  .initialize()
  .accounts({
    registry: registryPDA,
    authority: admin.publicKey,
    systemProgram: web3.SystemProgram.programId,
  })
  .rpc();

// 2. Register User
const [userAccountPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("user"), user.publicKey.toBuffer()],
  registryProgram.programId
);

await registryProgram.methods
  .registerUser({ prosumer: {} }, "Building A, Floor 3")
  .accounts({
    userAccount: userAccountPDA,
    registry: registryPDA,
    userAuthority: user.publicKey,
    systemProgram: web3.SystemProgram.programId,
  })
  .signers([user])
  .rpc();

// 3. Register Meter
const meterId = "METER-A-301-001";
const [meterAccountPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("meter"),
    Buffer.from(meterId),
    user.publicKey.toBuffer()
  ],
  registryProgram.programId
);

await registryProgram.methods
  .registerMeter(meterId, { solarProsumer: {} })
  .accounts({
    meterAccount: meterAccountPDA,
    userAccount: userAccountPDA,
    registry: registryPDA,
    userAuthority: user.publicKey,
    systemProgram: web3.SystemProgram.programId,
  })
  .signers([user])
  .rpc();

console.log("User and meter registered successfully!");
```

## Best Practices

1. **Location Format**: Use consistent location format (e.g., "Building, Floor, Room")
2. **Meter ID**: Use unique, descriptive meter IDs (e.g., "METER-{BUILDING}-{FLOOR}-{ROOM}")
3. **Status Management**: Only update status when necessary to minimize transaction costs
4. **PDA Derivation**: Cache PDAs to avoid repeated derivation
5. **Error Handling**: Always handle errors gracefully in client applications

## Integration with Other Programs

The Registry Program is referenced by:

- **Energy Token Program**: Validates user existence before token operations
- **Trading Program**: Verifies user registration before order creation
- **Oracle Program**: Validates meter registration before accepting readings

## Monitoring

Monitor these events for system health:

- `UserRegistered` - Track new user registrations
- `MeterRegistered` - Track new meter installations
- `UserStatusUpdated` - Monitor user suspensions/activations
- `MeterStatusUpdated` - Track meter maintenance and faults

## Security Considerations

1. **Authority Control**: Only registry authority can update statuses
2. **User Ownership**: Users can only register meters for themselves
3. **PDA Security**: All accounts use PDAs for deterministic addressing
4. **Input Validation**: String lengths are validated to prevent overflow

---

**Last Updated**: 2025-09-30
