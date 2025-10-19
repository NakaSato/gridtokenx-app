# GridTokenX C4 Model - Complete Architecture Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [What is C4 Model?](#what-is-c4-model)
3. [Level 1: System Context](#level-1-system-context)
4. [Level 2: Container Architecture](#level-2-container-architecture)
5. [Level 3a: Frontend Components](#level-3a-frontend-components)
6. [Level 3b: Blockchain Components](#level-3b-blockchain-components)
7. [Level 3c: Backend Components](#level-3c-backend-components)
8. [Quick Reference](#quick-reference)

---

## Overview

The GridTokenX C4 Model provides a hierarchical view of the P2P Energy Trading System architecture at 4 different levels of abstraction:

- **Level 1 (System Context)**: Users, external systems, system boundaries
- **Level 2 (Containers)**: Major technology containers, databases, services
- **Level 3a (Frontend)**: React component structure and data flow
- **Level 3b (Blockchain)**: Solana program architecture and interactions
- **Level 3c (Backend)**: API Gateway services and data layers

---

## What is C4 Model?

The C4 Model is a simple, hierarchical way to describe software architecture:

| Level | Scope | Audience | Details |
|-------|-------|----------|---------|
| **Context** | System boundaries | Everyone | Users, external systems, interactions |
| **Container** | Technology choices | Architects, DevOps | APIs, databases, frontends, services |
| **Component** | Internal structure | Developers | Classes, modules, services within containers |
| **Code** | Implementation | Developers | Classes, methods, variables (use IDE for this) |

For GridTokenX, we focus on **Levels 1-3** (Context, Container, Component).

---

## Level 1: System Context

### Purpose
Show the system as a black box within its environment, with all external actors and systems.

### File
`C4_LEVEL_1_SYSTEM_CONTEXT.puml`

### Key Elements

#### 👥 Actors (4 types)
1. **Consumer** - Buys renewable energy from prosumers
2. **Prosumer** - Produces & sells renewable energy  
3. **Grid Operator** - Manages meters, validates prosumers, enforces policies
4. **REC Authority** - Issues and validates Renewable Energy Certificates

#### 🎯 Main System
**GridTokenX P2P Energy Trading** - Blockchain-based peer-to-peer energy trading platform with PoA governance

#### 🔌 External Systems
1. **Solana Blockchain** - Executes smart contracts, stores records & tokens
2. **AMI Backend** - Smart meter data provider, prosumer validation
3. **Weather Service** - Provides solar/wind production forecasts
4. **Market Oracle** - Pricing feeds, grid conditions, demand signals

### Key Interactions
- Consumers browse/place buy orders
- Prosumers list energy & execute trades
- Grid Operator manages system participants
- REC Authority validates certificates
- System submits transactions to Solana
- System queries AMI for meter readings
- System fetches weather & pricing data

### Questions Answered
- Who uses the system?
- What external systems does it depend on?
- What are the system boundaries?
- Who are the key stakeholders?

---

## Level 2: Container Architecture

### Purpose
Show the major technology containers and how they interact.

### File
`C4_LEVEL_2_CONTAINERS.puml`

### Key Containers

#### Frontend Container
- **React 18 + Vite + TypeScript**
- SPA for energy trading interface
- Feature-based architecture
- Uses Gill Wallet UI for Solana integration

#### API Gateway Container
- **Rust + Actix-Web + PostgreSQL**
- REST API for business logic
- User management & authentication
- Transaction orchestration

#### Smart Meter Simulator
- **Python + Docker**
- Simulates meter readings in testing
- Prosumer energy generation profiles

#### Data Service
- Processes meter readings
- Analyzes trading history
- Generates analytics

#### Blockchain Programs (5 Anchor Programs)
1. **Energy Token Program** - Token & REC management
2. **Registry Program** - Participant & meter registration
3. **Trading Program** - P2P order matching & execution
4. **Governance Program** - Proof-of-Authority voting
5. **Oracle Program** - Data validation & price feeds

#### Databases
- **PostgreSQL** - Relational data (users, config)
- **TimescaleDB** - Time-series data (meter readings, trades)
- **Redis** - Cache & message queue

### Questions Answered
- What are the major technology containers?
- How do frontend, backend, and blockchain work together?
- What databases are used?
- What are the deployment units?

---

## Level 3a: Frontend Components

### Purpose
Show the internal structure of the React web application.

### File
`C4_LEVEL_3_COMPONENTS_FRONTEND.puml`

### Key Components

#### Core Framework
- **Vite** - Build tool & dev server
- **React Router v6** - Client-side navigation
- **TypeScript** - Type safety

#### Authentication & Wallet
- **Gill Wallet UI** - Solana wallet connection
- **Auth Hooks** - useWalletUiSigner(), useWalletUiSignAndSend()

#### Feature-Based Architecture
Each feature follows strict pattern: `/src/features/[feature]/`

**Feature 1: Registry**
- Prosumer registration & KYC
- Data access hooks (use-registry-query.ts)
- UI components (registry-ui-*.tsx)

**Feature 2: Trading**
- Order creation & management
- Data access hooks (use-trading-mutation.ts)
- UI components (trading-ui-*.tsx)

**Feature 3: Governance**
- Voting & policy management
- Data access hooks (use-governance-query.ts)
- UI components (governance-ui-*.tsx)

**Feature 4: Meter**
- Meter data visualization
- Real-time reading display
- Historical data analysis

**Feature 5: Account**
- User profile & settings
- KYC status management
- Wallet management

#### Data Management
- **React Query** - Server state management
- **Generated Clients** - Codama-generated Solana program clients
- **Context API** - Global state (theme, preferences)

#### Global Providers
- `QueryProvider` - React Query provider
- `ThemeProvider` - UI theming
- `SolanaProvider` - Wallet integration
- `WalletUiProvider` - Gill Wallet UI

### Data Flow Pattern
```
UI Component
  ↓ (calls)
Data Access Hook
  ↓ (uses)
Generated Client
  ↓ (queries)
Solana RPC
```

### Questions Answered
- How is the React app organized?
- What features exist in the frontend?
- How do components interact?
- How is state managed?

---

## Level 3b: Blockchain Components

### Purpose
Show the internal structure of Solana Anchor programs.

### File
`C4_LEVEL_3_COMPONENTS_ANCHOR.puml`

### Program 1: Energy Token Program
**Address**: `FaELH72fUMRaLTX3ersmQLr4purfHGvJccm1BXfDPL6r`

**Components**:
- **REC Token Mint** - Renewable Energy Certificate SPL token
- **REC Issuance** - Authority-only REC creation
- **REC Burn** - Redeems used energy
- **Token Metadata** - Symbol, supply, decimals (Metaplex standard)
- **Associated Accounts** - User REC balances

**Key Operations**:
- Mint REC tokens for verified prosumers
- Burn RECs when energy is consumed
- Validate authority for REC operations

### Program 2: Registry Program
**Address**: `FSXdxk5uPUvJc51MzjtBaCDrFh7RSMcHFHKpzCG9LeuJ`

**Components**:
- **Prosumer Registration** - Register energy producers
- **Consumer Registration** - Register energy consumers
- **Meter Management** - Assign smart meters to users
- **KYC Validation** - Verify prosumers via AMI backend
- **Registry State** - Stores user & meter records as PDAs

**Key Operations**:
- Register consumers (always allowed)
- Register prosumers (requires KYC validation)
- Assign meters to users
- Revoke registrations

### Program 3: Trading Program
**Address**: `CEWpf4Rvm3SU2zQgwsQpi5EMYBUrWbKLcAhAT2ouVoWD`

**Components**:
- **Order Creation** - Create buy/sell orders
- **Order Book** - Stores active trading orders as PDAs
- **Order Matching** - Matches buyers with sellers
- **Trade Execution** - Settles and records trades
- **Escrow Accounts** - Holds tokens during trades
- **Trade History** - Immutable trade records

**Key Operations**:
- Place buy orders (want to purchase energy)
- Place sell orders (want to sell energy)
- Auto-match when orders intersect
- Execute trade & transfer tokens
- Record trade on-chain permanently

### Program 4: Governance Program
**Address**: `EAcyEzfXXJCDnjZKUrgHsBEEHmnozZJXKs2wdW3xnWgb`

**Components**:
- **Proposal Creation** - Submit governance proposals
- **Proposal Storage** - Stores active proposals as PDAs
- **Voting** - Authority members vote
- **Policy Execution** - Enforces voted policies
- **Authority Management** - Grid Operator role control

**Key Operations**:
- Create proposals (e.g., price limits, trading hours)
- Vote on proposals (authority-only)
- Execute approved policies
- Manage who has authority

### Program 5: Oracle Program
**Address**: `G365L8A4Y3xmp5aN2GGLj2SJr5KetgE5F57PaFvCgSgG`

**Components**:
- **Price Feed** - Real-time energy pricing data
- **Meter Validator** - Validates AMI meter readings
- **Authority Validator** - Validates signer authority
- **Oracle Data Store** - Pricing & validation data

**Key Operations**:
- Provide current energy prices
- Validate meter readings from AMI
- Check if signer is authorized
- Update price feeds

### Program Relationships

```
┌─────────────────────────────────────────┐
│    Solana Blockchain (5 Programs)       │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐   │
│  │ Energy Token                     │   │
│  │ - REC minting/burning            │   │
│  │ - Authority validation (Oracle)  │   │
│  └──────────────────────────────────┘   │
│                 ↑                       │
│  ┌──────────────────────────────────┐   │
│  │ Registry                         │   │
│  │ - Prosumer/Consumer registration │   │
│  │ - KYC validation                 │   │
│  └──────────────────────────────────┘   │
│    ↑               ↑                    │
│    │               │                    │
│  ┌──────────────────────────────────┐   │
│  │ Trading                          │   │
│  │ - Order matching                 │   │
│  │ - Token transfers                │   │
│  │ - Participant validation         │   │
│  └──────────────────────────────────┘   │
│    ↑               ↑                    │
│    │               │                    │
│  ┌──────────────────────────────────┐   │
│  │ Governance                       │   │
│  │ - PoA voting                     │   │
│  │ - Policy enforcement             │   │
│  └──────────────────────────────────┘   │
│    ↑               ↑                    │
│    │               │                    │
│  ┌──────────────────────────────────┐   │
│  │ Oracle                           │   │
│  │ - Price feeds                    │   │
│  │ - Data validation                │   │
│  └──────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Questions Answered
- What blockchain programs exist?
- What does each program do?
- How do programs interact?
- What accounts does each program manage?

---

## Level 3c: Backend Components

### Purpose
Show the internal structure of the API Gateway.

### File
`C4_LEVEL_3_COMPONENTS_BACKEND.puml`

### Layer 1: HTTP Entry Point
- **Actix-Web Server** - Runs on port 3001
- Handles REST API requests

### Layer 2: Authentication & Authorization
- **API Key Auth** - Validates API keys
- **Wallet Signature Auth** - Verifies Solana wallet signatures
- **Role Authorization** - Checks user permissions
- **JWT Tokens** - Issues/validates session tokens

### Layer 3: Business Logic Services

**User Service**
- User registration & profiles
- KYC verification
- Account management

**Meter Service**
- Meter assignment
- Reading aggregation
- Meter validation

**Trading Service**
- Order creation
- Order matching rules
- Trade settlement
- Fee calculations

**Governance Service**
- Policy management
- Voting orchestration
- Authority management

**Oracle Service**
- Data validation
- Price feeds
- Meter reading validation

**Analytics Service**
- Trading analytics
- User statistics
- Energy reports

### Layer 4: Data Access Layer

**User Repository** → PostgreSQL
- User accounts
- Credentials
- Profiles

**Meter Repository** → PostgreSQL
- Meter registrations
- Meter assignments
- Meter metadata

**Order Repository** → TimescaleDB
- Active orders
- Trade history
- Order status

**Reading Repository** → TimescaleDB
- High-frequency meter readings
- Timestamps
- Values

**Audit Repository** → PostgreSQL
- Activity logs
- Changes
- User actions

### Layer 5: Blockchain Integration

**Program Clients** (Codama-generated)
- Type-safe clients for all 5 programs
- Account querying
- Instruction building

**Transaction Builder**
- Constructs Solana instructions
- Composes complex transactions
- Error handling

**Account Querier**
- Queries program accounts
- Decodes account data
- Filters accounts

**RPC Client**
- HTTP/WebSocket connection to Solana
- Submits transactions
- Queries on-chain state

### Layer 6: External Integrations

**AMI Connector** → AMI Backend
- Gets meter readings
- Prosumer validation
- Real-time data

**Weather Service** → External API
- Solar production forecasts
- Wind production data
- Climate data

**Price Service** → External API
- Energy market pricing
- Grid demand signals
- Real-time rates

### Layer 7: Infrastructure

**PostgreSQL Database**
- Relational data
- Transactions
- Complex queries

**TimescaleDB Database**
- Time-series data
- Meter readings
- Trading data
- High-frequency inserts

**Redis Cache**
- Session storage
- Real-time data cache
- Message queue

### Request Flow Example

```
Browser Request
  ↓
HTTP Server (Actix)
  ↓
Auth Middleware
  ↓
Route to Handler
  ↓
Business Logic Service (e.g., Trading Service)
  ↓
Data Access Layer (e.g., Order Repository)
  ↓
Database (PostgreSQL or TimescaleDB)
  ↓
Response back through layers
```

### Questions Answered
- How is the API Gateway organized?
- What services exist in the backend?
- How is authentication handled?
- How do services interact with databases?
- How does blockchain integration work?

---

## Quick Reference

### File Locations
- **Level 1**: `C4_LEVEL_1_SYSTEM_CONTEXT.puml`
- **Level 2**: `C4_LEVEL_2_CONTAINERS.puml`
- **Level 3a**: `C4_LEVEL_3_COMPONENTS_FRONTEND.puml`
- **Level 3b**: `C4_LEVEL_3_COMPONENTS_ANCHOR.puml`
- **Level 3c**: `C4_LEVEL_3_COMPONENTS_BACKEND.puml`

### Viewing PlantUML Diagrams

#### Option 1: Online PlantUML Editor
1. Go to https://www.plantuml.com/plantuml/uml/
2. Copy diagram code
3. Paste and view

#### Option 2: VS Code Extension
1. Install "PlantUML" extension
2. Open .puml file
3. Press Alt+D to preview

#### Option 3: Generate PNG/SVG
```bash
# Install PlantUML
brew install plantuml

# Generate PNG
plantuml -Tpng C4_LEVEL_1_SYSTEM_CONTEXT.puml

# Generate SVG
plantuml -Tsvg C4_LEVEL_1_SYSTEM_CONTEXT.puml
```

### Key Architectural Patterns

#### Actor Types
- **Consumer**: Buys energy
- **Prosumer**: Sells energy (after KYC)
- **Grid Operator**: Administers system
- **REC Authority**: Validates certificates

#### Technology Stack
- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Rust, Actix-Web
- **Blockchain**: Solana, Anchor, Rust
- **Databases**: PostgreSQL, TimescaleDB, Redis

#### Program Design
- **5 Solana Programs**: Modular, composable
- **Authority Validation**: Proof-of-Authority governance
- **Token-Based**: Energy represented as REC tokens
- **On-Chain Transparency**: All trades immutable

### Common Questions

**Q: How does a user trade energy?**
A: User places order → Trading program matches → Token escrow → Settlement on-chain → History recorded

**Q: Who can be a prosumer?**
A: Must pass KYC validation from Grid Operator via AMI backend → Registry program registration

**Q: How is pricing determined?**
A: Oracle program provides price feeds → Trading program enforces limits → API Gateway applies policies

**Q: How is governance done?**
A: Grid Operator proposes → Authority votes → Governance program enforces → System updates

---

## Next Steps

1. **Understand Level 1** - Who uses the system?
2. **Understand Level 2** - What technology components?
3. **Choose your role**:
   - Frontend dev → Study Level 3a
   - Backend dev → Study Level 3c
   - Blockchain dev → Study Level 3b
4. **Deep dive** - See `C4_PROJECT_STRUCTURE_MAPPING.md` for code locations

---

**Document**: C4 Model Complete Guide  
**Version**: 2.0  
**Last Updated**: October 2025  
**Status**: Rebuilt with latest architecture

## File Organization

All C4 diagrams are located in `/docs/`:
- `C4_LEVEL_1_SYSTEM_CONTEXT.puml` - System context
- `C4_LEVEL_2_CONTAINERS.puml` - Container architecture
- `C4_LEVEL_3_COMPONENTS_FRONTEND.puml` - Frontend components
- `C4_LEVEL_3_COMPONENTS_ANCHOR.puml` - Blockchain programs
- `C4_LEVEL_3_COMPONENTS_BACKEND.puml` - API Gateway

---

## Viewing the Diagrams

### Online
Use PlantUML Online Editor: https://www.plantuml.com/plantuml/uml/

### Locally
1. Install PlantUML: `brew install plantuml`
2. Generate PNG/SVG:
   ```bash
   plantuml C4_LEVEL_1_SYSTEM_CONTEXT.puml -o ../docs-output
   ```

### VS Code
Install PlantUML extension and preview directly.

---

## Evolution and Updates

As the system evolves:
1. Update Level 1 for new external systems
2. Update Level 2 when adding/removing containers
3. Update Level 3 when refactoring components
4. Maintain consistency across all levels
5. Document why changes were made

---

## Related Documentation

- `SYSTEM_ARCHITECTURE.md` - High-level system overview
- `ARCHITECTURE_GUIDE.md` - Detailed technical guide
- `DEVELOPMENT_GUIDE.md` - Development workflow
- DFD diagrams - Data flow visualization
- Sequence diagrams - Interaction flows
