# Energy Token Program Documentation

**Program ID**: `GizasjPBdHw9tkme1jwpVSsa14USHBaYDCuRqziUdfaa`

## Overview

The Energy Token Program is an SPL token wrapper that manages energy credits in the GridTokenX platform. It provides functionality for minting, transferring, and burning energy tokens, with integrated REC (Renewable Energy Certificate) validation.

## Key Concepts

### Energy Token Model

- **1 Token = 1 kWh** of energy
- **Decimals**: 6 (for fractional kWh representation)
- **Minting**: Only authorized validators can mint tokens
- **Burning**: Tokens are burned when energy is consumed
- **Transfer**: Tokens can be transferred between users

### REC Validation

Renewable Energy Certificates (RECs) validate that energy tokens represent actual renewable energy generation. Only approved validators can certify energy production.

## Account Structures

### Token Info Account

```rust
pub struct TokenInfo {
    pub authority: Pubkey,          // Program authority
    pub mint: Pubkey,               // Token mint address
    pub total_supply: u64,          // Total tokens in circulation
    pub created_at: i64,            // Creation timestamp
}
```

**Size**: 8 + 32 + 32 + 8 + 8 = 88 bytes

### REC Validator Account

```rust
pub struct RecValidator {
    pub validator_pubkey: Pubkey,   // Validator's public key
    pub authority_name: String,     // Name of validating authority
    pub is_active: bool,            // Validator status
    pub total_validated: u64,       // Total energy validated (Wh)
    pub registered_at: i64,         // Registration timestamp
}
```

**Size**: 8 + 32 + (4 + 64) + 1 + 8 + 8 = 125 bytes

## Instructions

### 1. Initialize

Initialize the energy token program.

**Accounts:**
- `authority` - Program authority (signer)

**Parameters:** None

**Example:**

```typescript
await energyTokenProgram.methods
  .initialize()
  .accounts({
    authority: authority.publicKey,
  })
  .rpc();
```

---

### 2. Initialize Token

Initialize the energy token with mint account.

**Accounts:**
- `token_info` - Token info account (init, payer = authority)
- `mint` - Token mint account (init, payer = authority)
- `authority` - Program authority (signer)
- `token_program` - SPL Token program
- `system_program` - System program
- `rent` - Rent sysvar

**Parameters:** None

**Example:**

```typescript
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

await energyTokenProgram.methods
  .initializeToken()
  .accounts({
    tokenInfo: tokenInfoPDA,
    mint: mintPDA,
    authority: authority.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .rpc();
```

**Events Emitted:**
```rust
TokenInitialized {
    authority: Pubkey,
    mint: Pubkey,
    timestamp: i64,
}
```

---

### 3. Add REC Validator

Add a REC validator to the system (admin only).

**Accounts:**
- `token_info` - Token info account
- `rec_validator` - REC validator account (init, payer = authority)
- `authority` - Program authority (signer)
- `system_program` - System program

**Parameters:**
- `validator_pubkey: Pubkey` - Validator's public key
- `authority_name: String` - Name of validating authority (max 64 chars)

**Example:**

```typescript
await energyTokenProgram.methods
  .addRecValidator(
    validatorPublicKey,
    "University Engineering Department"
  )
  .accounts({
    tokenInfo: tokenInfoPDA,
    recValidator: recValidatorPDA,
    authority: authority.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

**Events Emitted:**
```rust
RecValidatorAdded {
    validator: Pubkey,
    authority_name: String,
    timestamp: i64,
}
```

**Errors:**
- `UnauthorizedAuthority` - Caller is not the token authority
- `AuthorityNameTooLong` - Authority name exceeds 64 characters

---

### 4. Mint Tokens

Mint energy tokens (REC validator only).

**Accounts:**
- `token_info` - Token info account (mut)
- `mint` - Token mint account (mut)
- `to_token_account` - Recipient token account (mut)
- `rec_validator` - REC validator account (mut)
- `validator_authority` - Validator's wallet (signer)
- `token_program` - SPL Token program

**Parameters:**
- `amount: u64` - Amount to mint (in token base units, 6 decimals)
- `energy_source: String` - Source of energy (e.g., "Solar", "Wind")
- `certificate_id: String` - REC certificate ID

**Example:**

```typescript
import { BN } from '@coral-xyz/anchor';

// Mint 10 kWh (10,000,000 base units with 6 decimals)
await energyTokenProgram.methods
  .mintTokens(
    new BN(10_000_000),
    "Solar",
    "REC-2025-001"
  )
  .accounts({
    tokenInfo: tokenInfoPDA,
    mint: mintPDA,
    toTokenAccount: recipientTokenAccount,
    recValidator: recValidatorPDA,
    validatorAuthority: validator.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([validator])
  .rpc();
```

**Events Emitted:**
```rust
TokensMinted {
    validator: Pubkey,
    recipient: Pubkey,
    amount: u64,
    energy_source: String,
    certificate_id: String,
    timestamp: i64,
}
```

**Errors:**
- `UnauthorizedValidator` - Caller is not an active validator
- `InvalidAmount` - Amount is zero
- `ValidatorInactive` - Validator is not active

---

### 5. Transfer Tokens

Transfer energy tokens between accounts.

**Accounts:**
- `from_token_account` - Source token account (mut)
- `to_token_account` - Destination token account (mut)
- `from_authority` - Source account authority (signer)
- `token_program` - SPL Token program

**Parameters:**
- `amount: u64` - Amount to transfer

**Example:**

```typescript
await energyTokenProgram.methods
  .transferTokens(new BN(5_000_000))  // 5 kWh
  .accounts({
    fromTokenAccount: senderTokenAccount,
    toTokenAccount: recipientTokenAccount,
    fromAuthority: sender.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([sender])
  .rpc();
```

**Events Emitted:**
```rust
TokensTransferred {
    from: Pubkey,
    to: Pubkey,
    amount: u64,
    timestamp: i64,
}
```

**Errors:**
- `InsufficientBalance` - Not enough tokens to transfer
- `InvalidAmount` - Amount is zero

---

### 6. Burn Tokens

Burn energy tokens (for energy consumption).

**Accounts:**
- `token_info` - Token info account (mut)
- `mint` - Token mint account (mut)
- `token_account` - Token account to burn from (mut)
- `authority` - Token account authority (signer)
- `token_program` - SPL Token program

**Parameters:**
- `amount: u64` - Amount to burn

**Example:**

```typescript
// Burn 3 kWh when energy is consumed
await energyTokenProgram.methods
  .burnTokens(new BN(3_000_000))
  .accounts({
    tokenInfo: tokenInfoPDA,
    mint: mintPDA,
    tokenAccount: userTokenAccount,
    authority: user.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([user])
  .rpc();
```

**Events Emitted:**
```rust
TokensBurned {
    owner: Pubkey,
    amount: u64,
    timestamp: i64,
}
```

**Errors:**
- `InsufficientBalance` - Not enough tokens to burn
- `InvalidAmount` - Amount is zero

---

### 7. Deactivate Validator

Deactivate a REC validator (admin only).

**Accounts:**
- `token_info` - Token info account
- `rec_validator` - REC validator account (mut)
- `authority` - Program authority (signer)

**Parameters:**
- `validator_pubkey: Pubkey` - Validator to deactivate

**Example:**

```typescript
await energyTokenProgram.methods
  .deactivateValidator(validatorPublicKey)
  .accounts({
    tokenInfo: tokenInfoPDA,
    recValidator: recValidatorPDA,
    authority: authority.publicKey,
  })
  .rpc();
```

**Events Emitted:**
```rust
ValidatorDeactivated {
    validator: Pubkey,
    timestamp: i64,
}
```

**Errors:**
- `UnauthorizedAuthority` - Caller is not the token authority
- `ValidatorNotFound` - Validator does not exist

---

## PDA (Program Derived Address) Seeds

### Token Info PDA
```typescript
const [tokenInfoPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("token_info")],
  energyTokenProgram.programId
);
```

### Mint PDA
```typescript
const [mintPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("mint")],
  energyTokenProgram.programId
);
```

### REC Validator PDA
```typescript
const [recValidatorPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("rec_validator"),
    validatorPublicKey.toBuffer()
  ],
  energyTokenProgram.programId
);
```

### User Token Account
```typescript
import { getAssociatedTokenAddress } from '@solana/spl-token';

const userTokenAccount = await getAssociatedTokenAddress(
  mintPDA,
  userPublicKey
);
```

## Error Codes

```rust
pub enum ErrorCode {
    #[msg("Unauthorized authority")]
    UnauthorizedAuthority = 6000,
    
    #[msg("Unauthorized validator")]
    UnauthorizedValidator = 6001,
    
    #[msg("Invalid amount (must be > 0)")]
    InvalidAmount = 6002,
    
    #[msg("Insufficient token balance")]
    InsufficientBalance = 6003,
    
    #[msg("Validator is not active")]
    ValidatorInactive = 6004,
    
    #[msg("Validator not found")]
    ValidatorNotFound = 6005,
    
    #[msg("Authority name too long (max 64 characters)")]
    AuthorityNameTooLong = 6006,
}
```

## Token Economics

### Decimal Precision

```
Decimals: 6
1 token = 1,000,000 base units
0.001 kWh = 1,000 base units
```

### Example Conversions

```typescript
// kWh to base units
function kWhToBaseUnits(kwh: number): BN {
  return new BN(kwh * 1_000_000);
}

// Base units to kWh
function baseUnitsToKWh(baseUnits: BN): number {
  return baseUnits.toNumber() / 1_000_000;
}

// Examples
kWhToBaseUnits(10);      // 10,000,000 base units
kWhToBaseUnits(0.5);     // 500,000 base units
baseUnitsToKWh(new BN(3_000_000));  // 3 kWh
```

## Usage Examples

### Complete Token Lifecycle

```typescript
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction 
} from '@solana/spl-token';

// 1. Initialize Token (one-time, by admin)
const [tokenInfoPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("token_info")],
  energyTokenProgram.programId
);

const [mintPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("mint")],
  energyTokenProgram.programId
);

await energyTokenProgram.methods
  .initializeToken()
  .accounts({
    tokenInfo: tokenInfoPDA,
    mint: mintPDA,
    authority: admin.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .rpc();

// 2. Add REC Validator
const [recValidatorPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("rec_validator"),
    validator.publicKey.toBuffer()
  ],
  energyTokenProgram.programId
);

await energyTokenProgram.methods
  .addRecValidator(
    validator.publicKey,
    "Engineering Department"
  )
  .accounts({
    tokenInfo: tokenInfoPDA,
    recValidator: recValidatorPDA,
    authority: admin.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// 3. Create Associated Token Account for User
const userTokenAccount = await getAssociatedTokenAddress(
  mintPDA,
  user.publicKey
);

const createAtaIx = createAssociatedTokenAccountInstruction(
  admin.publicKey,  // payer
  userTokenAccount,
  user.publicKey,   // owner
  mintPDA
);

// 4. Mint Tokens (by validator)
await energyTokenProgram.methods
  .mintTokens(
    new BN(10_000_000),  // 10 kWh
    "Solar",
    "REC-2025-001"
  )
  .accounts({
    tokenInfo: tokenInfoPDA,
    mint: mintPDA,
    toTokenAccount: userTokenAccount,
    recValidator: recValidatorPDA,
    validatorAuthority: validator.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([validator])
  .rpc();

// 5. Transfer Tokens
const recipientTokenAccount = await getAssociatedTokenAddress(
  mintPDA,
  recipient.publicKey
);

await energyTokenProgram.methods
  .transferTokens(new BN(3_000_000))  // 3 kWh
  .accounts({
    fromTokenAccount: userTokenAccount,
    toTokenAccount: recipientTokenAccount,
    fromAuthority: user.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([user])
  .rpc();

// 6. Burn Tokens (energy consumption)
await energyTokenProgram.methods
  .burnTokens(new BN(2_000_000))  // 2 kWh consumed
  .accounts({
    tokenInfo: tokenInfoPDA,
    mint: mintPDA,
    tokenAccount: userTokenAccount,
    authority: user.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([user])
  .rpc();

console.log("Token lifecycle completed!");
```

### Query Token Balance

```typescript
import { getAccount } from '@solana/spl-token';

const tokenAccount = await getAccount(
  connection,
  userTokenAccount
);

const balanceKWh = Number(tokenAccount.amount) / 1_000_000;
console.log(`Balance: ${balanceKWh} kWh`);
```

## Best Practices

1. **Validator Management**: Regularly audit active validators
2. **Minting Controls**: Only mint tokens for verified energy generation
3. **Burning Tracking**: Log all token burns for energy consumption auditing
4. **REC Certificates**: Use unique, traceable certificate IDs
5. **Decimal Handling**: Always use BN for token amounts to avoid precision loss

## Integration with Other Programs

The Energy Token Program is used by:

- **Trading Program**: Tokens are transferred during trade execution
- **Oracle Program**: Triggers token minting based on meter readings
- **Governance Program**: Validates REC certificates for token minting

## Monitoring

Monitor these events for token activity:

- `TokensMinted` - Track energy token creation
- `TokensTransferred` - Monitor token movements
- `TokensBurned` - Track energy consumption
- `RecValidatorAdded` / `ValidatorDeactivated` - Monitor validator changes

## Security Considerations

1. **Validator Authorization**: Only active validators can mint tokens
2. **Authority Control**: Only program authority can manage validators
3. **Overflow Protection**: All arithmetic uses safe math operations
4. **PDA Security**: All critical accounts use PDAs
5. **REC Validation**: Minting requires valid REC certificate

## Token Supply Management

```rust
// Total supply tracking
pub fn update_total_supply(token_info: &mut TokenInfo, delta: i64) {
    if delta > 0 {
        token_info.total_supply += delta as u64;  // Minting
    } else {
        token_info.total_supply -= (-delta) as u64;  // Burning
    }
}
```

---

**Last Updated**: 2025-09-30
