# C4 Model to Project Structure Mapping

## How C4 Model Maps to Your Codebase

This document explains how each C4 Model level corresponds to actual files and directories in the GridTokenX project.

---

## Level 1: System Context → Architecture Overview

### C4 Concept
```
System Context: GridTokenX interacts with users, blockchain, and data providers
```

### Project Mapping
```
/.github/copilot-instructions.md
├── System Overview section
└── Multi-Program Architecture section

/docs/
├── SYSTEM_ARCHITECTURE.md
├── ARCHITECTURE_GUIDE.md
└── ARCHITECTURE_OVERVIEW_SEQUENCE.puml
```

### Key File References
- **Users & Roles**: Defined in `anchor/programs/registry/`
- **External Systems**: 
  - Solana: `anchor/`
  - AMI: `docker/smart-meter-simulator/`
  - Oracle Data: `anchor/programs/oracle/`

---

## Level 2: Containers → Project Top-Level Organization

### C4 Concept
```
GridTokenX Platform contains:
├── Web Application
├── API Gateway
├── Smart Meter Simulator
├── Anchor Programs (5 programs)
├── PostgreSQL
└── TimescaleDB
```

### Project Directory Mapping
```
/Users/chanthawat/Developments/gridtokenx-app/
├── frontend/                    → Web Application (React/Vite)
├── api-gateway/                 → API Gateway (Rust/Actix)
├── docker/smart-meter-simulator/ → Smart Meter Simulator (Python)
├── anchor/                      → Anchor Programs & Blockchain
├── docker/postgres/             → PostgreSQL Database
└── docker/timescaledb/          → TimescaleDB Database
```

### Container Details

#### Frontend Container
```
/frontend/
├── src/
│   ├── components/              → Shared UI components
│   ├── features/                → Feature modules
│   │   ├── registry/
│   │   ├── trading/
│   │   ├── governance/
│   │   ├── meter/
│   │   └── account/
│   ├── App.tsx                  → Main app component
│   └── main.tsx                 → Entry point
├── vite.config.ts               → Build configuration
└── package.json                 → Dependencies
```

#### API Gateway Container
```
/api-gateway/
├── src/
│   ├── error.rs                 → Error handling
│   ├── main.rs                  → Server entry point
│   ├── handlers/                → HTTP route handlers
│   ├── services/                → Business logic
│   ├── models/                  → Data models
│   └── db/                      → Database access
├── migrations/                  → SQL migrations
├── Cargo.toml                   → Dependencies
└── tests/                       → Integration tests
```

#### Anchor Programs Container
```
/anchor/
├── programs/
│   ├── energy-token/            → REC token management
│   ├── governance/              → PoA governance
│   ├── oracle/                  → Data validation & pricing
│   ├── registry/                → Participant registration
│   └── trading/                 → P2P trading engine
├── src/
│   ├── lib.rs                   → Program exports
│   ├── gridtokenxapp-exports.ts → Generated clients
│   └── client/                  → Generated TypeScript
├── tests/                       → Anchor tests
├── Anchor.toml                  → Configuration
└── codama.js                    → Code generation
```

#### Smart Meter Simulator Container
```
/docker/smart-meter-simulator/
├── simulator.py                 → Main simulator
├── requirements.txt             → Dependencies
├── config.yaml                  → Configuration
└── Dockerfile                   → Container definition
```

#### Databases Container
```
/docker/
├── postgres/                    → PostgreSQL database
│   └── init.sql                 → Initial schema
├── timescaledb/                 → TimescaleDB database
│   └── init.sql                 → Time-series schema
```

---

## Level 3a: Frontend Components → React Feature Structure

### C4 Concept
```
React App contains:
├── Routing Layer (React Router)
├── Authentication (Wallet integration)
├── Data Management (React Query + Context)
├── Feature Modules
└── Generated Blockchain Clients
```

### Project Mapping
```
/frontend/src/
├── main.tsx                     → App entry point
│
├── App.tsx                      → Main router setup
│   └── src/components/app-providers.tsx  → Provider hierarchy
│
├── features/                    → Feature modules
│   ├── [feature-name]/
│   │   ├── data-access/         → React Query hooks & mutations
│   │   │   ├── use-[feature]-query.ts
│   │   │   └── use-[feature]-mutation.ts
│   │   ├── ui/                  → UI components
│   │   │   ├── [feature]-ui-component.tsx
│   │   │   └── index.ts
│   │   └── [feature]-feature.tsx → Feature entry point
│   │
│   ├── registry/                → Participant management
│   │   ├── data-access/
│   │   │   ├── use-gridtokenxapp-initialize-mutation.ts
│   │   │   ├── use-registry-query.ts
│   │   │   └── registry-api.ts
│   │   ├── ui/
│   │   │   ├── gridtokenxapp-ui-button-initialize.tsx
│   │   │   └── registry-ui-list.tsx
│   │   └── registry-feature.tsx
│   │
│   ├── trading/                 → P2P trading
│   │   ├── data-access/
│   │   │   ├── use-create-order-mutation.ts
│   │   │   ├── use-trading-orders-query.ts
│   │   │   └── trading-api.ts
│   │   ├── ui/
│   │   │   ├── trading-ui-order-form.tsx
│   │   │   ├── trading-ui-order-book.tsx
│   │   │   └── trading-ui-positions.tsx
│   │   └── trading-feature.tsx
│   │
│   ├── governance/              → Voting & proposals
│   ├── meter/                   → Meter data visualization
│   └── account/                 → User profile
│
└── hooks/                       → Global hooks
    ├── use-wallet-ui-signer.ts  → Wallet integration
    ├── use-wallet-ui-sign-and-send.ts → Transaction signing
    └── use-solana-context.ts    → Blockchain context
```

### Frontend Component Hierarchy
```
App.tsx
├── ReactQueryProvider
├── ThemeProvider
├── SolanaProvider
└── WalletUiGillProvider
    ├── Router
    │   ├── /registry → RegistryFeature
    │   ├── /trading → TradingFeature
    │   ├── /governance → GovernanceFeature
    │   ├── /meter → MeterFeature
    │   └── /account → AccountFeature
    │
    └── Generated Clients
        ├── gridtokenxAppClient
        ├── energyTokenClient
        ├── registryClient
        ├── tradingClient
        ├── governanceClient
        └── oracleClient
```

---

## Level 3b: Blockchain Components → Anchor Programs

### C4 Concept
```
5 Anchor Programs + 1 Oracle Program
├── Energy Token Program
├── Registry Program
├── Trading Program
├── Governance Program
└── Oracle Program
```

### Project Mapping

#### Energy Token Program
```
/anchor/programs/energy-token/
├── src/
│   ├── lib.rs                   → Program definition
│   │   ├── Initialize instruction
│   │   ├── MintREC instruction
│   │   ├── BurnREC instruction
│   │   └── ValidateREC instruction
│   └── state/                   → Account structures
│       ├── token_mint.rs
│       └── rec_vault.rs
├── Cargo.toml
└── target/idl/                  → Generated IDL JSON

Program ID: FaELH72fUMRaLTX3ersmQLr4purfHGvJccm1BXfDPL6r
Functions:
- Initialize: Set up token mint
- MintREC: Issue renewable energy certificates
- BurnREC: Retire used certificates
- ValidateREC: Authority-only REC validation
```

#### Registry Program
```
/anchor/programs/registry/
├── src/
│   ├── lib.rs                   → Program definition
│   │   ├── RegisterUser instruction
│   │   ├── RegisterMeter instruction
│   │   ├── AssignRole instruction
│   │   └── UpdateMeterStatus instruction
│   └── state/
│       ├── user_registry.rs
│       └── meter_registry.rs
├── Cargo.toml
└── target/idl/

Program ID: FSXdxk5uPUvJc51MzjtBaCDrFh7RSMcHFHKpzCG9LeuJ
Functions:
- RegisterUser: Add participant to system
- RegisterMeter: Register smart meter
- AssignRole: Set consumer/prosumer role
- UpdateMeterStatus: Change meter state
```

#### Trading Program
```
/anchor/programs/trading/
├── src/
│   ├── lib.rs                   → Program definition
│   │   ├── CreateOrder instruction
│   │   ├── CancelOrder instruction
│   │   ├── ExecuteTrade instruction
│   │   └── SettleTrade instruction
│   ├── order_book.rs            → Order matching engine
│   └── state/
│       ├── order.rs
│       └── trade_history.rs
├── Cargo.toml
└── target/idl/

Program ID: CEWpf4Rvm3SU2zQgwsQpi5EMYBUrWbKLcAhAT2ouVoWD
Functions:
- CreateOrder: Place buy/sell order
- CancelOrder: Withdraw order
- ExecuteTrade: Match and execute
- SettleTrade: Finalize and transfer tokens
```

#### Governance Program
```
/anchor/programs/governance/
├── src/
│   ├── lib.rs                   → Program definition
│   │   ├── CreateProposal instruction
│   │   ├── Vote instruction
│   │   ├── ExecuteProposal instruction
│   │   └── RevokeVote instruction
│   └── state/
│       ├── proposal.rs
│       └── vote_record.rs
├── Cargo.toml
└── target/idl/

Program ID: EAcyEzfXXJCDnjZKUrgHsBEEHmnozZJXKs2wdW3xnWgb
Functions:
- CreateProposal: Create governance proposal
- Vote: Cast authority vote
- ExecuteProposal: Apply approved proposals
- RevokeVote: Withdraw vote
```

#### Oracle Program
```
/anchor/programs/oracle/
├── src/
│   ├── lib.rs                   → Program definition
│   │   ├── UpdatePrice instruction
│   │   ├── ValidateMeterData instruction
│   │   ├── ValidateAuthority instruction
│   │   └── GetLatestPrice instruction
│   └── state/
│       ├── price_feed.rs
│       └── validation_record.rs
├── Cargo.toml
└── target/idl/

Program ID: G365L8A4Y3xmp5aN2GGLj2SJr5KetgE5F57PaFvCgSgG
Functions:
- UpdatePrice: Authority sets energy prices
- ValidateMeterData: Check AMI meter data
- ValidateAuthority: Verify signer authority
- GetLatestPrice: Query current pricing
```

### Generated Clients Mapping
```
/anchor/src/
├── gridtokenxapp-exports.ts     → Main exports
│   ├── getEnergyTokenProgram()
│   ├── getRegistryProgram()
│   ├── getTradingProgram()
│   ├── getGovernanceProgram()
│   └── getOracleProgram()
│
└── client/js/                   → TypeScript clients (generated by Codama)
    ├── energyToken.ts
    ├── registry.ts
    ├── trading.ts
    ├── governance.ts
    └── oracle.ts

Consumed in frontend:
/frontend/src/hooks/
└── use-gridtokenxapp-program.ts → Hook for program access
```

---

## Level 3c: Backend Components → API Gateway

### C4 Concept
```
Rust API Gateway contains:
├── HTTP Server
├── Authentication & Authorization
├── Business Logic Services
├── Data Access Layer
├── Blockchain Integration
├── External Integrations
└── Data Persistence
```

### Project Mapping
```
/api-gateway/
├── src/
│   ├── main.rs                  → Server entry point
│   │   └── Sets up Actix server, routes
│   │
│   ├── error.rs                 → Error handling
│   │   ├── ApiError enum
│   │   └── Error conversion traits
│   │
│   ├── handlers/                → HTTP route handlers
│   │   ├── mod.rs
│   │   ├── users.rs             → User endpoints
│   │   ├── meters.rs            → Meter endpoints
│   │   ├── trading.rs           → Trading endpoints
│   │   ├── governance.rs        → Governance endpoints
│   │   └── oracle.rs            → Oracle endpoints
│   │
│   ├── middleware/              → Authentication & validation
│   │   ├── api_key_auth.rs
│   │   ├── wallet_auth.rs
│   │   └── role_auth.rs
│   │
│   ├── services/                → Business logic
│   │   ├── user_service.rs      → User management
│   │   ├── meter_service.rs     → Meter operations
│   │   ├── trading_service.rs   → Trading logic
│   │   ├── governance_service.rs → Governance ops
│   │   └── oracle_service.rs    → Data validation
│   │
│   ├── models/                  → Data models
│   │   ├── user.rs
│   │   ├── meter.rs
│   │   ├── order.rs
│   │   └── proposal.rs
│   │
│   └── db/                      → Database access
│       ├── mod.rs
│       ├── repository/
│       │   ├── user_repo.rs
│       │   ├── meter_repo.rs
│       │   ├── order_repo.rs
│       │   └── audit_repo.rs
│       └── connection/
│           ├── postgres.rs
│           └── timescale.rs
│
├── migrations/                  → SQL migrations
│   ├── 20240923000001_create_user_types.sql
│   ├── 20240923000002_create_users_table.sql
│   ├── 20240923000003_create_api_keys_table.sql
│   ├── 20240923000004_create_user_activities_table.sql
│   ├── 20240923000005_create_meter_assignments_table.sql
│   ├── 20240923000006_create_trading_orders_table.sql
│   └── 20240923000007_create_triggers.sql
│
├── tests/                       → Integration tests
│   ├── user_tests.rs
│   ├── meter_tests.rs
│   └── trading_tests.rs
│
├── Cargo.toml                   → Rust dependencies
└── Dockerfile                   → Container definition
```

### API Endpoints Structure
```
HTTP Server Routing:

POST /api/users/register           → handlers/users.rs
GET  /api/users/{id}               → handlers/users.rs
PUT  /api/users/{id}               → handlers/users.rs

POST /api/meters/register          → handlers/meters.rs
GET  /api/meters/{id}/readings     → handlers/meters.rs
POST /api/meters/{id}/readings     → handlers/meters.rs

POST /api/trading/orders           → handlers/trading.rs
GET  /api/trading/orders           → handlers/trading.rs
POST /api/trading/orders/{id}/cancel → handlers/trading.rs
POST /api/trading/execute          → handlers/trading.rs

POST /api/governance/proposals     → handlers/governance.rs
POST /api/governance/vote          → handlers/governance.rs
GET  /api/governance/proposals/{id} → handlers/governance.rs

GET  /api/oracle/price             → handlers/oracle.rs
POST /api/oracle/validate-meter    → handlers/oracle.rs
```

### Database Schema
```
PostgreSQL (/api-gateway/migrations/):
├── Users table
├── API Keys table
├── User Activities table (audit log)
├── Role assignments
└── System configuration

TimescaleDB (/api-gateway/migrations/):
├── Meter Readings (time-series)
├── Trading Orders (time-series)
├── Trading History (time-series)
├── Price History (time-series)
└── Voting Records (time-series)
```

---

## Data Flow Across Levels

### Example: User Places Trading Order

```
Level 1 (System Context):
User (Prosumer) → GridTokenX Platform

    ↓

Level 2 (Containers):
Web App → API Gateway → Trading Program

    ↓

Level 3a (Frontend):
TradingFeature
  └── data-access/use-create-order-mutation.ts
      ├── Calls useWalletUiSigner() to get signer
      ├── Creates instruction via getCreateOrderInstruction()
      └── Calls useWalletUiSignAndSend()

    ↓

Level 3c (Backend):
API Gateway receives request
  ├── handlers/trading.rs: POST /api/trading/orders
  ├── middleware/wallet_auth.rs: Verifies wallet signature
  ├── services/trading_service.rs: Validates order details
  ├── db/repository/order_repo.rs: Stores in TimescaleDB
  └── Returns confirmation

    ↓

Level 3b (Blockchain):
TradingProgram::create_order()
  ├── Validates order parameters
  ├── Creates PDA for order storage
  ├── Emits order creation event
  └── Updates order book state

    ↓

Level 2 (Containers):
API Gateway updates frontend
  └── Web App receives confirmation

    ↓

Level 3a (Frontend):
React Query invalidates cache
  └── TradingFeature re-fetches orders
      └── Displays new order to user
```

---

## Development Workflow Reference

### When you need to...

**Add a new feature**:
1. Start at Level 3b: Create new Anchor program instruction
2. Move to Level 3a: Create React feature module
3. Update Level 3c: Create API endpoint
4. Update Level 2: Show new container if needed
5. Update Level 1: If external systems involved

**Modify blockchain logic**:
1. Edit `/anchor/programs/[program]/src/lib.rs`
2. Run `npm run setup` to regenerate clients
3. Update React feature using new client

**Add API endpoint**:
1. Create handler in `/api-gateway/src/handlers/`
2. Add database migration if needed
3. Create React data-access hook to consume endpoint

**Modify database schema**:
1. Create SQL migration in `/api-gateway/migrations/`
2. Update repository in `/api-gateway/src/db/repository/`
3. Update API services to use new schema

---

## File Organization Summary

```
C4 Level          Project Location              Purpose
─────────────────────────────────────────────────────────────
Level 1           /docs/SYSTEM_ARCHITECTURE.md  System context overview
                  C4_LEVEL_1_SYSTEM_CONTEXT.puml

Level 2           /frontend, /api-gateway,      Major components & tech choices
                  /anchor, /docker/
                  C4_LEVEL_2_CONTAINERS.puml

Level 3a          /frontend/src/features/       React feature structure
                  C4_LEVEL_3_COMPONENTS_FRONTEND.puml

Level 3b          /anchor/programs/             Blockchain program structure
                  C4_LEVEL_3_COMPONENTS_ANCHOR.puml

Level 3c          /api-gateway/src/             Backend service structure
                  C4_LEVEL_3_COMPONENTS_BACKEND.puml
```

---

## Key Design Patterns in Code

### 1. Feature-Based Organization (Frontend)
Each feature is self-contained with data-access, UI, and entry point.

### 2. Program-Centric Development (Blockchain)
- Define logic in Anchor Rust
- Generate TypeScript clients
- Consume in React via hooks

### 3. Layered Architecture (Backend)
- Handlers (HTTP)
- Services (Business Logic)
- Repositories (Data Access)
- Models (Data Definitions)

### 4. Multi-Database Strategy
- PostgreSQL: Relational data
- TimescaleDB: Time-series data
- Redis: Caching layer

### 5. Authority-Based Access Control
- Wallet authentication
- Role-based authorization
- On-chain validation

---

## Commands to Understand Mapping

```bash
# View all features
ls -la frontend/src/features/

# View all programs
ls -la anchor/programs/

# View API handlers
ls -la api-gateway/src/handlers/

# View database migrations
ls -la api-gateway/migrations/

# Regenerate clients (after program changes)
npm run setup

# Start development server
npm run dev

# View generated TypeScript clients
ls -la anchor/src/client/js/
```

---

## References

- **C4 Model**: https://c4model.com/
- **Architecture Decision Records**: See `/docs/` folder
- **Development Guide**: See `/docs/DEVELOPMENT_GUIDE.md`
- **Project Structure**: This document
