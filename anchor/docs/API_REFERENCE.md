# API Reference

Complete TypeScript/JavaScript API reference for interacting with GridTokenX Anchor programs.

## Installation

```bash
npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token
# or
pnpm add @coral-xyz/anchor @solana/web3.js @solana/spl-token
```

## Setup

### Initialize Connection

```typescript
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';

// Create connection
const connection = new Connection('http://localhost:8899', 'confirmed');

// Load wallet
const wallet = new NodeWallet(Keypair.fromSecretKey(/* your secret key */));

// Create provider
const provider = new AnchorProvider(connection, wallet, {
  commitment: 'confirmed',
});

// Load programs
import registryIdl from './idl/registry.json';
import energyTokenIdl from './idl/energy_token.json';
import tradingIdl from './idl/trading.json';
import oracleIdl from './idl/oracle.json';
import governanceIdl from './idl/governance.json';

const registryProgram = new Program(registryIdl, provider);
const energyTokenProgram = new Program(energyTokenIdl, provider);
const tradingProgram = new Program(tradingIdl, provider);
const oracleProgram = new Program(oracleIdl, provider);
const governanceProgram = new Program(governanceIdl, provider);
```

## Registry Program API

### Types

```typescript
enum UserType {
  Prosumer = 'prosumer',
  Consumer = 'consumer',
  GridOperator = 'gridOperator',
  Validator = 'validator',
}

enum UserStatus {
  Active = 'active',
  Suspended = 'suspended',
  Inactive = 'inactive',
}

enum MeterType {
  SolarProsumer = 'solarProsumer',
  GridConsumer = 'gridConsumer',
  HybridProsumer = 'hybridProsumer',
  BatteryStorage = 'batteryStorage',
}

enum MeterStatus {
  Active = 'active',
  Inactive = 'inactive',
  Maintenance = 'maintenance',
  Faulty = 'faulty',
}
```

### Methods

#### registerUser()

```typescript
async function registerUser(
  userType: UserType,
  location: string
): Promise<string> {
  const [userAccountPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('user'), provider.wallet.publicKey.toBuffer()],
    registryProgram.programId
  );

  const [registryPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('registry')],
    registryProgram.programId
  );

  const tx = await registryProgram.methods
    .registerUser({ [userType]: {} }, location)
    .accounts({
      userAccount: userAccountPDA,
      registry: registryPDA,
      userAuthority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}
```

#### registerMeter()

```typescript
async function registerMeter(
  meterId: string,
  meterType: MeterType
): Promise<string> {
  const [meterAccountPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('meter'),
      Buffer.from(meterId),
      provider.wallet.publicKey.toBuffer(),
    ],
    registryProgram.programId
  );

  const [userAccountPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('user'), provider.wallet.publicKey.toBuffer()],
    registryProgram.programId
  );

  const [registryPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('registry')],
    registryProgram.programId
  );

  const tx = await registryProgram.methods
    .registerMeter(meterId, { [meterType]: {} })
    .accounts({
      meterAccount: meterAccountPDA,
      userAccount: userAccountPDA,
      registry: registryPDA,
      userAuthority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}
```

#### getUserAccount()

```typescript
async function getUserAccount(userPublicKey: PublicKey) {
  const [userAccountPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('user'), userPublicKey.toBuffer()],
    registryProgram.programId
  );

  const account = await registryProgram.account.userAccount.fetch(
    userAccountPDA
  );

  return {
    authority: account.authority,
    userType: Object.keys(account.userType)[0],
    location: account.location,
    status: Object.keys(account.status)[0],
    registeredAt: new Date(account.registeredAt.toNumber() * 1000),
    meterCount: account.meterCount,
  };
}
```

#### getMeterAccount()

```typescript
async function getMeterAccount(meterId: string, ownerPublicKey: PublicKey) {
  const [meterAccountPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('meter'),
      Buffer.from(meterId),
      ownerPublicKey.toBuffer(),
    ],
    registryProgram.programId
  );

  const account = await registryProgram.account.meterAccount.fetch(
    meterAccountPDA
  );

  return {
    meterId: account.meterId,
    owner: account.owner,
    meterType: Object.keys(account.meterType)[0],
    status: Object.keys(account.status)[0],
    registeredAt: new Date(account.registeredAt.toNumber() * 1000),
    lastReadingAt: new Date(account.lastReadingAt.toNumber() * 1000),
    totalGeneration: account.totalGeneration.toNumber(),
    totalConsumption: account.totalConsumption.toNumber(),
  };
}
```

## Energy Token Program API

### Methods

#### mintTokens()

```typescript
import { BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

async function mintTokens(
  recipientPublicKey: PublicKey,
  amountKWh: number,
  energySource: string,
  certificateId: string
): Promise<string> {
  const [tokenInfoPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('token_info')],
    energyTokenProgram.programId
  );

  const [mintPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('mint')],
    energyTokenProgram.programId
  );

  const [recValidatorPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('rec_validator'),
      provider.wallet.publicKey.toBuffer(),
    ],
    energyTokenProgram.programId
  );

  const recipientTokenAccount = await getAssociatedTokenAddress(
    mintPDA,
    recipientPublicKey
  );

  const amount = new BN(amountKWh * 1_000_000); // Convert to base units

  const tx = await energyTokenProgram.methods
    .mintTokens(amount, energySource, certificateId)
    .accounts({
      tokenInfo: tokenInfoPDA,
      mint: mintPDA,
      toTokenAccount: recipientTokenAccount,
      recValidator: recValidatorPDA,
      validatorAuthority: provider.wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return tx;
}
```

#### transferTokens()

```typescript
async function transferTokens(
  recipientPublicKey: PublicKey,
  amountKWh: number
): Promise<string> {
  const [mintPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('mint')],
    energyTokenProgram.programId
  );

  const senderTokenAccount = await getAssociatedTokenAddress(
    mintPDA,
    provider.wallet.publicKey
  );

  const recipientTokenAccount = await getAssociatedTokenAddress(
    mintPDA,
    recipientPublicKey
  );

  const amount = new BN(amountKWh * 1_000_000);

  const tx = await energyTokenProgram.methods
    .transferTokens(amount)
    .accounts({
      fromTokenAccount: senderTokenAccount,
      toTokenAccount: recipientTokenAccount,
      fromAuthority: provider.wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return tx;
}
```

#### burnTokens()

```typescript
async function burnTokens(amountKWh: number): Promise<string> {
  const [tokenInfoPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('token_info')],
    energyTokenProgram.programId
  );

  const [mintPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('mint')],
    energyTokenProgram.programId
  );

  const userTokenAccount = await getAssociatedTokenAddress(
    mintPDA,
    provider.wallet.publicKey
  );

  const amount = new BN(amountKWh * 1_000_000);

  const tx = await energyTokenProgram.methods
    .burnTokens(amount)
    .accounts({
      tokenInfo: tokenInfoPDA,
      mint: mintPDA,
      tokenAccount: userTokenAccount,
      authority: provider.wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return tx;
}
```

#### getTokenBalance()

```typescript
import { getAccount } from '@solana/spl-token';

async function getTokenBalance(userPublicKey: PublicKey): Promise<number> {
  const [mintPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('mint')],
    energyTokenProgram.programId
  );

  const tokenAccount = await getAssociatedTokenAddress(
    mintPDA,
    userPublicKey
  );

  const account = await getAccount(connection, tokenAccount);
  
  return Number(account.amount) / 1_000_000; // Convert to kWh
}
```

## Trading Program API

### Methods

#### createSellOrder()

```typescript
async function createSellOrder(
  energyKWh: number,
  pricePerKWh: number
): Promise<string> {
  const orderId = Date.now(); // Use timestamp as order ID
  const orderIdBuffer = Buffer.alloc(8);
  orderIdBuffer.writeBigUInt64LE(BigInt(orderId));

  const [orderPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('order'),
      orderIdBuffer,
      provider.wallet.publicKey.toBuffer(),
    ],
    tradingProgram.programId
  );

  const [marketPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('market')],
    tradingProgram.programId
  );

  const energyWh = new BN(energyKWh * 1_000);
  const price = new BN(pricePerKWh * 1_000_000);

  const tx = await tradingProgram.methods
    .createSellOrder(energyWh, price)
    .accounts({
      order: orderPDA,
      market: marketPDA,
      seller: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}
```

#### createBuyOrder()

```typescript
async function createBuyOrder(
  energyKWh: number,
  maxPricePerKWh: number
): Promise<string> {
  const orderId = Date.now();
  const orderIdBuffer = Buffer.alloc(8);
  orderIdBuffer.writeBigUInt64LE(BigInt(orderId));

  const [orderPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('order'),
      orderIdBuffer,
      provider.wallet.publicKey.toBuffer(),
    ],
    tradingProgram.programId
  );

  const [marketPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('market')],
    tradingProgram.programId
  );

  const energyWh = new BN(energyKWh * 1_000);
  const maxPrice = new BN(maxPricePerKWh * 1_000_000);

  const tx = await tradingProgram.methods
    .createBuyOrder(energyWh, maxPrice)
    .accounts({
      order: orderPDA,
      market: marketPDA,
      buyer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}
```

#### getActiveOrders()

```typescript
async function getActiveOrders() {
  const orders = await tradingProgram.account.order.all([
    {
      memcmp: {
        offset: 8 + 8 + 32 + 1 + 8 + 8 + 8, // Offset to status field
        bytes: bs58.encode([0]), // Active status = 0
      },
    },
  ]);

  return orders.map((order) => ({
    orderId: order.account.orderId.toNumber(),
    owner: order.account.owner,
    orderType: Object.keys(order.account.orderType)[0],
    energyAmount: order.account.energyAmount.toNumber() / 1000, // Convert to kWh
    pricePerKwh: order.account.pricePerKwh.toNumber() / 1_000_000,
    filledAmount: order.account.filledAmount.toNumber() / 1000,
    status: Object.keys(order.account.status)[0],
    createdAt: new Date(order.account.createdAt.toNumber() * 1000),
  }));
}
```

## Oracle Program API

### Methods

#### submitMeterReading()

```typescript
async function submitMeterReading(
  meterId: string,
  energyProducedWh: number,
  energyConsumedWh: number
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const timestampBuffer = Buffer.alloc(8);
  timestampBuffer.writeBigInt64LE(BigInt(timestamp));

  const [oracleDataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('oracle')],
    oracleProgram.programId
  );

  const [meterReadingRecordPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('reading'),
      Buffer.from(meterId),
      timestampBuffer,
    ],
    oracleProgram.programId
  );

  const tx = await oracleProgram.methods
    .submitMeterReading(
      meterId,
      new BN(energyProducedWh),
      new BN(energyConsumedWh),
      new BN(timestamp)
    )
    .accounts({
      oracleData: oracleDataPDA,
      meterReadingRecord: meterReadingRecordPDA,
      authority: provider.wallet.publicKey, // Must be API Gateway
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}
```

#### triggerMarketClearing()

```typescript
async function triggerMarketClearing(): Promise<string> {
  const [oracleDataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('oracle')],
    oracleProgram.programId
  );

  const tx = await oracleProgram.methods
    .triggerMarketClearing()
    .accounts({
      oracleData: oracleDataPDA,
      authority: provider.wallet.publicKey, // Must be API Gateway
    })
    .rpc();

  return tx;
}
```

## Governance Program API

### Methods

#### issueERC()

```typescript
async function issueERC(
  certificateId: string,
  recipientPublicKey: PublicKey,
  energyKWh: number,
  renewableSource: string,
  validationData: string
): Promise<string> {
  const [poaConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('poa_config')],
    governanceProgram.programId
  );

  const [ercCertificatePDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('erc'),
      Buffer.from(certificateId),
      recipientPublicKey.toBuffer(),
    ],
    governanceProgram.programId
  );

  const energyWh = new BN(energyKWh * 1_000);

  const tx = await governanceProgram.methods
    .issueErc(certificateId, energyWh, renewableSource, validationData)
    .accounts({
      poaConfig: poaConfigPDA,
      ercCertificate: ercCertificatePDA,
      recipient: recipientPublicKey,
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}
```

#### validateERC()

```typescript
async function validateERC(
  certificateId: string,
  recipientPublicKey: PublicKey
): Promise<string> {
  const [poaConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('poa_config')],
    governanceProgram.programId
  );

  const [ercCertificatePDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('erc'),
      Buffer.from(certificateId),
      recipientPublicKey.toBuffer(),
    ],
    governanceProgram.programId
  );

  const tx = await governanceProgram.methods
    .validateErc(certificateId)
    .accounts({
      poaConfig: poaConfigPDA,
      ercCertificate: ercCertificatePDA,
      authority: provider.wallet.publicKey,
    })
    .rpc();

  return tx;
}
```

#### emergencyPause()

```typescript
async function emergencyPause(): Promise<string> {
  const [poaConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('poa_config')],
    governanceProgram.programId
  );

  const tx = await governanceProgram.methods
    .emergencyPause()
    .accounts({
      poaConfig: poaConfigPDA,
      authority: provider.wallet.publicKey,
    })
    .rpc();

  return tx;
}
```

## Event Listeners

### Listen to All Events

```typescript
// Registry events
registryProgram.addEventListener('UserRegistered', (event, slot) => {
  console.log('User registered:', event);
});

registryProgram.addEventListener('MeterRegistered', (event, slot) => {
  console.log('Meter registered:', event);
});

// Trading events
tradingProgram.addEventListener('SellOrderCreated', (event, slot) => {
  console.log('Sell order created:', event);
});

tradingProgram.addEventListener('OrdersMatched', (event, slot) => {
  console.log('Trade executed:', event);
});

// Oracle events
oracleProgram.addEventListener('MeterReadingSubmitted', (event, slot) => {
  console.log('Meter reading submitted:', event);
});

// Governance events
governanceProgram.addEventListener('ErcIssued', (event, slot) => {
  console.log('ERC issued:', event);
});
```

## Utility Functions

### Convert Units

```typescript
// kWh to base units (6 decimals)
function kWhToBaseUnits(kwh: number): BN {
  return new BN(kwh * 1_000_000);
}

// Base units to kWh
function baseUnitsToKWh(baseUnits: BN): number {
  return baseUnits.toNumber() / 1_000_000;
}

// Wh to kWh
function whToKWh(wh: number): number {
  return wh / 1_000;
}

// kWh to Wh
function kWhToWh(kwh: number): number {
  return kwh * 1_000;
}
```

### PDA Helpers

```typescript
class PDAHelper {
  static getRegistryPDA(programId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('registry')],
      programId
    );
  }

  static getUserAccountPDA(
    userPublicKey: PublicKey,
    programId: PublicKey
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('user'), userPublicKey.toBuffer()],
      programId
    );
  }

  static getMeterAccountPDA(
    meterId: string,
    ownerPublicKey: PublicKey,
    programId: PublicKey
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('meter'),
        Buffer.from(meterId),
        ownerPublicKey.toBuffer(),
      ],
      programId
    );
  }

  static getMarketPDA(programId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('market')],
      programId
    );
  }

  static getOraclePDA(programId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('oracle')],
      programId
    );
  }

  static getPoaConfigPDA(programId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('poa_config')],
      programId
    );
  }
}
```

---

**Last Updated**: 2025-09-30
