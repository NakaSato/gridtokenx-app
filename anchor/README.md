# GridTokenX Anchor Programs

**Decentralized P2P Energy Trading Platform on Solana**

This repository contains the Solana smart contracts (Anchor programs) for the GridTokenX platform - a peer-to-peer energy trading system designed for university campus networks and residential communities.

## 🏗️ Architecture Overview

GridTokenX consists of five interconnected Anchor programs that work together to enable decentralized energy trading:

```
┌─────────────────────────────────────────────────────────────┐
│                     GridTokenX Platform                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Registry   │  │ Energy Token │  │   Trading    │      │
│  │   Program    │◄─┤   Program    │◄─┤   Program    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ▲                  ▲                  ▲              │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│         ┌──────────────────┴──────────────────┐             │
│         │                                      │             │
│  ┌──────▼──────┐                      ┌───────▼──────┐      │
│  │   Oracle    │                      │  Governance  │      │
│  │   Program   │                      │   Program    │      │
│  └─────────────┘                      └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Programs

### 1. **Registry Program** (`A1AMxAnFAKpVpCtBQneXR48KyCxEthh4Tq9bY3az1ddJ`)
Manages user and smart meter registration in the P2P energy trading system.

**Key Features:**
- User registration (prosumers, consumers, grid operators)
- Smart meter registration and management
- User and meter status tracking
- Location-based organization

**Main Instructions:**
- `initialize` - Initialize the registry
- `register_user` - Register a new user
- `register_meter` - Register a smart meter
- `update_user_status` - Update user status (admin)
- `update_meter_status` - Update meter status (admin)

[📖 Full Documentation](./docs/REGISTRY.md)

---

### 2. **Energy Token Program** (`GizasjPBdHw9tkme1jwpVSsa14USHBaYDCuRqziUdfaa`)
SPL token wrapper for energy credits with REC (Renewable Energy Certificate) validation.

**Key Features:**
- Energy token minting and burning
- REC validator management
- Token transfer with validation
- Total supply tracking

**Main Instructions:**
- `initialize_token` - Initialize energy token
- `add_rec_validator` - Add REC validator
- `transfer_tokens` - Transfer energy tokens
- `burn_tokens` - Burn tokens (energy consumption)

[📖 Full Documentation](./docs/ENERGY_TOKEN.md)

---

### 3. **Trading Program** (`E8yQoNXhSpSrw6whxUobTmHv4Bxk7EqmYB1fZ9e6aBXq`)
Order book and marketplace for P2P energy trading.

**Key Features:**
- Buy/sell order creation
- Automated order matching
- Market clearing mechanism
- Fee management (0.25% default)
- Trading volume and statistics

**Main Instructions:**
- `initialize_market` - Initialize trading market
- `create_sell_order` - Create energy sell order
- `create_buy_order` - Create energy buy order
- `match_orders` - Match buy/sell orders
- `cancel_order` - Cancel active order
- `update_market_params` - Update market parameters

[📖 Full Documentation](./docs/TRADING.md)

---

### 4. **Oracle Program** (`5DF1fmjrXTtG7qsFaLUm5TjJMG7M1a2V7kyTWPjoADV5`)
Bridges off-chain smart meter data with on-chain trading logic.

**Key Features:**
- Meter reading submission (via API Gateway)
- Market clearing triggers
- Data validation and verification
- Reading timestamp tracking

**Main Instructions:**
- `initialize` - Initialize oracle with API Gateway
- `submit_meter_reading` - Submit meter data (gateway only)
- `trigger_market_clearing` - Trigger market clearing
- `update_oracle_status` - Update oracle status

[📖 Full Documentation](./docs/ORACLE.md)

---

### 5. **Governance Program** (`HGMERbTnVUT344mjFkWBvt2pB7h67u2GKrKT8AhdttRe`)
Proof of Authority (PoA) governance with university Engineering Department control.

**Key Features:**
- Single authority governance (Engineering Department)
- ERC (Energy Renewable Certificate) issuance
- Emergency pause/unpause functionality
- System parameter management
- Maintenance mode control

**Main Instructions:**
- `initialize_poa` - Initialize PoA governance
- `issue_erc` - Issue renewable energy certificate
- `validate_erc` - Validate ERC
- `revoke_erc` - Revoke ERC
- `emergency_pause` - Emergency system pause
- `emergency_unpause` - Resume system operations

[📖 Full Documentation](./docs/GOVERNANCE.md)

---

## 🚀 Quick Start

### Prerequisites

- **Rust** 1.75.0 or later
- **Solana CLI** 1.18.0 or later
- **Anchor CLI** 0.31.1
- **Node.js** 18+ and **pnpm**

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd anchor

# Install dependencies
pnpm install

# Build all programs
anchor build

# Run tests
anchor test
```

### Local Development

```bash
# Start local validator
solana-test-validator

# Deploy to localnet
anchor deploy

# Run TypeScript client tests
pnpm test
```

## 📝 Configuration

### Anchor.toml

```toml
[programs.localnet]
energy_token = "GizasjPBdHw9tkme1jwpVSsa14USHBaYDCuRqziUdfaa"
governance = "HGMERbTnVUT344mjFkWBvt2pB7h67u2GKrKT8AhdttRe"
oracle = "5DF1fmjrXTtG7qsFaLUm5TjJMG7M1a2V7kyTWPjoADV5"
registry = "A1AMxAnFAKpVpCtBQneXR48KyCxEthh4Tq9bY3az1ddJ"
trading = "E8yQoNXhSpSrw6whxUobTmHv4Bxk7EqmYB1fZ9e6aBXq"

[provider]
cluster = "localnet"
wallet = "~/.config/solana/id.json"
```

## 🧪 Testing

```bash
# Run all tests
anchor test

# Run specific program tests
anchor test --skip-build -- --test energy_token
anchor test --skip-build -- --test trading
anchor test --skip-build -- --test registry
anchor test --skip-build -- --test oracle
anchor test --skip-build -- --test governance

# Run with detailed logs
RUST_LOG=debug anchor test
```

## 📊 Program Interactions

### Typical User Flow

1. **Registration** (Registry Program)
   ```
   User → register_user() → User Account Created
   User → register_meter() → Meter Account Created
   ```

2. **Energy Generation** (Oracle + Energy Token)
   ```
   Smart Meter → API Gateway → submit_meter_reading()
   Oracle validates → Energy tokens minted
   ```

3. **Trading** (Trading Program)
   ```
   Prosumer → create_sell_order() → Order in book
   Consumer → create_buy_order() → Order in book
   System → match_orders() → Trade executed
   ```

4. **REC Certification** (Governance Program)
   ```
   Engineering Dept → issue_erc() → Certificate issued
   System → validate_erc() → Certificate validated
   ```

## 🔐 Security Features

- **PoA Governance**: Single authority model for university control
- **API Gateway Authorization**: Only authorized gateway can submit meter data
- **Emergency Controls**: Pause/unpause functionality for critical situations
- **Account Validation**: Strict ownership and authority checks
- **Overflow Protection**: Safe math operations throughout

## 🏛️ Governance Model

GridTokenX uses a **Proof of Authority (PoA)** model:

- **Authority**: University Engineering Department
- **Responsibilities**:
  - Issue and validate RECs
  - Manage system parameters
  - Emergency controls
  - User/meter status management
- **Benefits**:
  - Fast transaction finality
  - Known and trusted authority
  - Regulatory compliance
  - Academic oversight

## 📈 Monitoring & Events

All programs emit events for monitoring:

- `UserRegistered`, `MeterRegistered`
- `MarketInitialized`, `OrderCreated`, `TradeExecuted`
- `MeterReadingSubmitted`, `MarketClearingTriggered`
- `ErcIssued`, `ErcValidated`, `EmergencyPauseActivated`

## 🔗 Integration

### TypeScript Client

```typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { GridTokenXApp } from './gridtokenxapp-exports';

// Initialize provider
const provider = AnchorProvider.env();

// Load programs
const registryProgram = new Program(/* ... */);
const tradingProgram = new Program(/* ... */);

// Register user
await registryProgram.methods
  .registerUser({ prosumer: {} }, "Building A, Floor 3")
  .accounts({ /* ... */ })
  .rpc();
```

### API Gateway Integration

The Oracle program is designed to work with the API Gateway:

```rust
// Only API Gateway can submit readings
require!(
    ctx.accounts.authority.key() == oracle_data.api_gateway,
    ErrorCode::UnauthorizedGateway
);
```

## 📚 Additional Resources

- [Anchor Framework Documentation](https://www.anchor-lang.com/)
- [Solana Documentation](https://docs.solana.com/)
- [SPL Token Program](https://spl.solana.com/token)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

[Add your license here]

## 👥 Team

GridTokenX - University P2P Energy Trading Platform
Engineering Department Authority

---

**Built with ❤️ using Anchor Framework on Solana**
