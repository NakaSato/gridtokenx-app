# Trading Program Documentation

**Program ID**: `E8yQoNXhSpSrw6whxUobTmHv4Bxk7EqmYB1fZ9e6aBXq`

## Overview

The Trading Program implements a decentralized order book and marketplace for P2P energy trading. It enables prosumers to sell excess energy and consumers to purchase energy at competitive prices through an automated matching system.

## Key Concepts

### Order Types

```rust
pub enum OrderType {
    Sell,  // Offer to sell energy
    Buy,   // Offer to buy energy
}
```

### Order Status

```rust
pub enum OrderStatus {
    Active,      // Available for matching
    Filled,      // Completely filled
    Cancelled,   // Cancelled by user
    Expired,     // Expired due to time limit
}
```

### Market State

The trading market operates with:
- **Continuous Trading**: Orders can be placed and matched at any time
- **Market Clearing**: Periodic batch clearing for optimal price discovery
- **Fee Structure**: 0.25% (25 basis points) default market fee

## Account Structures

### Market Account

```rust
pub struct Market {
    pub authority: Pubkey,          // Market authority
    pub active_orders: u64,         // Number of active orders
    pub total_volume: u64,          // Total trading volume (Wh)
    pub total_trades: u64,          // Total number of trades
    pub created_at: i64,            // Market creation timestamp
    pub clearing_enabled: bool,     // Market clearing enabled
    pub market_fee_bps: u16,        // Market fee in basis points (25 = 0.25%)
}
```

**Size**: 8 + 32 + 8 + 8 + 8 + 8 + 1 + 2 = 75 bytes

### Order Account

```rust
pub struct Order {
    pub order_id: u64,              // Unique order ID
    pub owner: Pubkey,              // Order creator
    pub order_type: OrderType,      // Buy or Sell
    pub energy_amount: u64,         // Energy amount in Wh
    pub price_per_kwh: u64,         // Price per kWh in tokens (6 decimals)
    pub filled_amount: u64,         // Amount filled so far
    pub status: OrderStatus,        // Current order status
    pub created_at: i64,            // Creation timestamp
    pub expires_at: i64,            // Expiration timestamp
}
```

**Size**: 8 + 8 + 32 + 1 + 8 + 8 + 8 + 1 + 8 + 8 = 90 bytes

### Trade Account

```rust
pub struct Trade {
    pub trade_id: u64,              // Unique trade ID
    pub buyer: Pubkey,              // Buyer's wallet
    pub seller: Pubkey,             // Seller's wallet
    pub energy_amount: u64,         // Energy traded (Wh)
    pub price_per_kwh: u64,         // Execution price
    pub total_price: u64,           // Total transaction value
    pub market_fee: u64,            // Market fee collected
    pub executed_at: i64,           // Execution timestamp
}
```

**Size**: 8 + 8 + 32 + 32 + 8 + 8 + 8 + 8 + 8 = 120 bytes

## Instructions

### 1. Initialize Market

Initialize the trading market.

**Accounts:**
- `market` - Market account (init, payer = authority)
- `authority` - Market authority (signer)
- `system_program` - System program

**Parameters:** None

**Example:**

```typescript
await tradingProgram.methods
  .initializeMarket()
  .accounts({
    market: marketPDA,
    authority: authority.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

**Events Emitted:**
```rust
MarketInitialized {
    authority: Pubkey,
    timestamp: i64,
}
```

---

### 2. Create Sell Order

Create a sell order for energy.

**Accounts:**
- `order` - Order account (init, payer = seller)
- `market` - Market account (mut)
- `seller` - Seller's wallet (signer)
- `system_program` - System program

**Parameters:**
- `energy_amount: u64` - Energy amount in Wh (e.g., 5000 = 5 kWh)
- `price_per_kwh: u64` - Price per kWh in tokens with 6 decimals (e.g., 250000 = 0.25 tokens/kWh)

**Example:**

```typescript
import { BN } from '@coral-xyz/anchor';

await tradingProgram.methods
  .createSellOrder(
    new BN(5_000_000),  // 5 kWh in Wh
    new BN(250_000)     // 0.25 tokens/kWh
  )
  .accounts({
    order: orderPDA,
    market: marketPDA,
    seller: seller.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([seller])
  .rpc();
```

**Events Emitted:**
```rust
SellOrderCreated {
    order_id: u64,
    seller: Pubkey,
    energy_amount: u64,
    price_per_kwh: u64,
    timestamp: i64,
}
```

**Errors:**
- `InvalidAmount` - Energy amount is zero
- `InvalidPrice` - Price is zero or exceeds maximum

---

### 3. Create Buy Order

Create a buy order for energy.

**Accounts:**
- `order` - Order account (init, payer = buyer)
- `market` - Market account (mut)
- `buyer` - Buyer's wallet (signer)
- `system_program` - System program

**Parameters:**
- `energy_amount: u64` - Energy amount in Wh
- `max_price_per_kwh: u64` - Maximum price per kWh willing to pay

**Example:**

```typescript
await tradingProgram.methods
  .createBuyOrder(
    new BN(3_000_000),  // 3 kWh in Wh
    new BN(300_000)     // Max 0.30 tokens/kWh
  )
  .accounts({
    order: orderPDA,
    market: marketPDA,
    buyer: buyer.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([buyer])
  .rpc();
```

**Events Emitted:**
```rust
BuyOrderCreated {
    order_id: u64,
    buyer: Pubkey,
    energy_amount: u64,
    max_price_per_kwh: u64,
    timestamp: i64,
}
```

**Errors:**
- `InvalidAmount` - Energy amount is zero
- `InvalidPrice` - Price is zero or exceeds maximum

---

### 4. Match Orders

Match a buy order with a sell order.

**Accounts:**
- `buy_order` - Buy order account (mut)
- `sell_order` - Sell order account (mut)
- `trade` - Trade account (init, payer = authority)
- `market` - Market account (mut)
- `buyer` - Buyer's wallet
- `seller` - Seller's wallet
- `authority` - Market authority (signer)
- `system_program` - System program

**Parameters:** None (automatically matches based on price-time priority)

**Example:**

```typescript
await tradingProgram.methods
  .matchOrders()
  .accounts({
    buyOrder: buyOrderPDA,
    sellOrder: sellOrderPDA,
    trade: tradePDA,
    market: marketPDA,
    buyer: buyer.publicKey,
    seller: seller.publicKey,
    authority: authority.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

**Events Emitted:**
```rust
OrdersMatched {
    trade_id: u64,
    buy_order_id: u64,
    sell_order_id: u64,
    buyer: Pubkey,
    seller: Pubkey,
    energy_amount: u64,
    price_per_kwh: u64,
    total_price: u64,
    market_fee: u64,
    timestamp: i64,
}
```

**Matching Logic:**
1. Buy order max price >= Sell order price
2. Execution price = Sell order price
3. Market fee = 0.25% of total price
4. Orders updated or marked as filled

**Errors:**
- `PriceMismatch` - Buy price < Sell price
- `OrderNotActive` - One or both orders not active
- `InsufficientAmount` - Not enough energy to match

---

### 5. Cancel Order

Cancel an active order.

**Accounts:**
- `order` - Order account (mut)
- `market` - Market account (mut)
- `owner` - Order owner (signer)

**Parameters:**
- `order_id: u64` - Order ID to cancel

**Example:**

```typescript
await tradingProgram.methods
  .cancelOrder(new BN(12345))
  .accounts({
    order: orderPDA,
    market: marketPDA,
    owner: user.publicKey,
  })
  .signers([user])
  .rpc();
```

**Events Emitted:**
```rust
OrderCancelled {
    order_id: u64,
    owner: Pubkey,
    timestamp: i64,
}
```

**Errors:**
- `UnauthorizedOwner` - Caller is not the order owner
- `OrderNotActive` - Order is not in active status
- `OrderNotFound` - Order does not exist

---

### 6. Update Market Params

Update market parameters (admin only).

**Accounts:**
- `market` - Market account (mut)
- `authority` - Market authority (signer)

**Parameters:**
- `market_fee_bps: u16` - New market fee in basis points (max 1000 = 10%)
- `clearing_enabled: bool` - Enable/disable market clearing

**Example:**

```typescript
await tradingProgram.methods
  .updateMarketParams(
    30,    // 0.30% fee
    true   // Clearing enabled
  )
  .accounts({
    market: marketPDA,
    authority: authority.publicKey,
  })
  .rpc();
```

**Events Emitted:**
```rust
MarketParamsUpdated {
    authority: Pubkey,
    market_fee_bps: u16,
    clearing_enabled: bool,
    timestamp: i64,
}
```

**Errors:**
- `UnauthorizedAuthority` - Caller is not market authority
- `InvalidFee` - Fee exceeds maximum (10%)

---

## PDA (Program Derived Address) Seeds

### Market PDA
```typescript
const [marketPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("market")],
  tradingProgram.programId
);
```

### Order PDA
```typescript
const orderIdBuffer = Buffer.alloc(8);
orderIdBuffer.writeBigUInt64LE(BigInt(orderId));

const [orderPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("order"),
    orderIdBuffer,
    owner.toBuffer()
  ],
  tradingProgram.programId
);
```

### Trade PDA
```typescript
const tradeIdBuffer = Buffer.alloc(8);
tradeIdBuffer.writeBigUInt64LE(BigInt(tradeId));

const [tradePDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("trade"),
    tradeIdBuffer
  ],
  tradingProgram.programId
);
```

## Error Codes

```rust
pub enum ErrorCode {
    #[msg("Unauthorized authority")]
    UnauthorizedAuthority = 6000,
    
    #[msg("Unauthorized order owner")]
    UnauthorizedOwner = 6001,
    
    #[msg("Invalid energy amount")]
    InvalidAmount = 6002,
    
    #[msg("Invalid price")]
    InvalidPrice = 6003,
    
    #[msg("Price mismatch - cannot match orders")]
    PriceMismatch = 6004,
    
    #[msg("Order not active")]
    OrderNotActive = 6005,
    
    #[msg("Order not found")]
    OrderNotFound = 6006,
    
    #[msg("Insufficient amount to match")]
    InsufficientAmount = 6007,
    
    #[msg("Invalid market fee (max 10%)")]
    InvalidFee = 6008,
}
```

## Trading Scenarios

### Scenario 1: Simple Trade

```typescript
// Prosumer creates sell order
await tradingProgram.methods
  .createSellOrder(
    new BN(10_000_000),  // 10 kWh
    new BN(200_000)      // 0.20 tokens/kWh
  )
  .accounts({ /* ... */ })
  .rpc();

// Consumer creates buy order
await tradingProgram.methods
  .createBuyOrder(
    new BN(10_000_000),  // 10 kWh
    new BN(250_000)      // Max 0.25 tokens/kWh
  )
  .accounts({ /* ... */ })
  .rpc();

// System matches orders
// Execution price: 0.20 tokens/kWh (seller's price)
// Total: 2.0 tokens
// Fee: 0.005 tokens (0.25%)
// Seller receives: 1.995 tokens
```

### Scenario 2: Partial Fill

```typescript
// Large sell order
await tradingProgram.methods
  .createSellOrder(
    new BN(20_000_000),  // 20 kWh
    new BN(200_000)      // 0.20 tokens/kWh
  )
  .accounts({ /* ... */ })
  .rpc();

// Small buy order
await tradingProgram.methods
  .createBuyOrder(
    new BN(5_000_000),   // 5 kWh
    new BN(250_000)      // Max 0.25 tokens/kWh
  )
  .accounts({ /* ... */ })
  .rpc();

// After matching:
// - Buy order: Filled (5 kWh)
// - Sell order: Partially filled (5/20 kWh), remains active for 15 kWh
```

## Price Calculation

### Token Amounts (6 decimals)

```
1 token = 1,000,000 (6 decimals)
0.25 tokens = 250,000
0.01 tokens = 10,000
```

### Energy Amounts (Wh)

```
1 kWh = 1,000 Wh
5 kWh = 5,000 Wh
10 kWh = 10,000 Wh
```

### Total Price Calculation

```rust
// Example: 5 kWh at 0.25 tokens/kWh
let energy_kwh = 5_000_000 / 1_000;  // 5000 Wh = 5 kWh
let price = 250_000;                  // 0.25 tokens/kWh
let total = (energy_kwh * price) / 1_000_000;  // 1.25 tokens

// Market fee (0.25%)
let fee = (total * 25) / 10_000;     // 0.003125 tokens

// Seller receives
let seller_amount = total - fee;      // 1.246875 tokens
```

## Best Practices

1. **Order Sizing**: Create orders in standard increments (e.g., 1 kWh, 5 kWh, 10 kWh)
2. **Price Discovery**: Monitor recent trades to set competitive prices
3. **Order Expiration**: Set reasonable expiration times (e.g., 1 hour, 24 hours)
4. **Partial Fills**: Handle partial fills gracefully in client applications
5. **Fee Awareness**: Factor in 0.25% market fee when calculating profitability

## Integration with Other Programs

The Trading Program interacts with:

- **Registry Program**: Validates user registration before order creation
- **Energy Token Program**: Handles token transfers for trades
- **Oracle Program**: Receives market clearing triggers

## Monitoring

Monitor these events for market activity:

- `SellOrderCreated` / `BuyOrderCreated` - Track order flow
- `OrdersMatched` - Monitor trade execution
- `OrderCancelled` - Track order cancellations
- `MarketParamsUpdated` - Monitor parameter changes

## Security Considerations

1. **Authority Control**: Only market authority can match orders and update parameters
2. **Owner Verification**: Users can only cancel their own orders
3. **Price Validation**: Prices are validated to prevent overflow
4. **Fee Limits**: Market fee capped at 10% maximum
5. **Atomic Matching**: Order matching is atomic to prevent race conditions

---

**Last Updated**: 2025-09-30
