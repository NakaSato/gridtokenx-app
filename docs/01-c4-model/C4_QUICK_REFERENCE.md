# C4 Model - Quick Reference Guide

## What is the C4 Model?

The C4 Model is a hierarchical approach to documenting software architecture using four levels of diagrams:
- **C1: System Context** - Shows the system and its actors/external systems
- **C2: Containers** - Shows major components and their relationships
- **C3: Components** - Shows internal structure of containers
- **C4: Code** - Shows classes, interfaces, and methods (usually in IDE)

---

## GridTokenX C4 Diagrams

### 📊 Level 1: System Context Diagram
**File**: `C4_LEVEL_1_SYSTEM_CONTEXT.puml`

```
Shows:
├── 4 Actor Types (Consumer, Prosumer, Grid Operator, Admin)
├── Main GridTokenX System
└── 3 External Systems
    ├── Solana Blockchain
    ├── AMI Backend
    └── External Oracle Data
```

**Use Case**: Understand who uses the system and what external systems it depends on.

---

### 🏗️ Level 2: Container Diagram
**File**: `C4_LEVEL_2_CONTAINERS.puml`

```
GridTokenX Platform contains:
├── Frontend
│   └── Web Application (React 18/Vite)
├── Backend
│   ├── API Gateway (Rust Actix)
│   └── Smart Meter Simulator (Python)
├── Blockchain Layer
│   ├── Energy Token Program
│   ├── Registry Program
│   ├── Trading Program
│   ├── Governance Program
│   └── Oracle Program
└── Data Layer
    ├── PostgreSQL
    └── TimescaleDB
```

**Use Case**: Understand the major technology choices and how containers communicate.

---

### ⚙️ Level 3a: Frontend Components
**File**: `C4_LEVEL_3_COMPONENTS_FRONTEND.puml`

```
React Application Structure:
├── Routing Layer
│   ├── Router
│   └── UI Layer
├── Authentication
│   ├── Auth Module
│   └── Wallet Integration
├── Data Management
│   ├── Query Layer (React Query)
│   ├── State Management (Context)
│   └── Theme Provider
├── Feature Modules
│   ├── Registry Feature
│   ├── Trading Feature
│   ├── Governance Feature
│   ├── Meter Management
│   └── Account Management
└── Generated Clients
    ├── energyTokenClient
    ├── registryClient
    ├── tradingClient
    ├── governanceClient
    └── oracleClient
```

**Use Case**: Understand React component organization and feature structure.

---

### 🔗 Level 3b: Anchor Programs Components
**File**: `C4_LEVEL_3_COMPONENTS_ANCHOR.puml`

```
Blockchain Layer Components:

Energy Token Program:
├── Token Mint (REC token creation)
├── REC Validation (renewable energy validation)
└── Token Metadata (Metaplex)

Registry Program:
├── User Registry (participant accounts)
├── Meter Registry (smart meter registration)
└── Role Management (consumer/prosumer)

Trading Program:
├── Order Book (trading orders)
├── Order Matching Engine (match logic)
├── Trade Execution (settlement)
└── Escrow Account (temporary token holding)

Governance Program:
├── PoA Governance (authority voting)
├── Proposal Manager (proposal storage)
└── Voting System (vote execution)

Oracle Program:
├── Price Oracle (energy pricing)
├── Meter Validator (AMI data validation)
└── Authority Validator (signer validation)

Storage:
├── Program Derived Accounts (PDAs)
└── Token Accounts (user balances)
```

**Use Case**: Understand blockchain program structure and responsibilities.

---

### 🖥️ Level 3c: Backend Components
**File**: `C4_LEVEL_3_COMPONENTS_BACKEND.puml`

```
API Gateway (Rust Actix) Structure:

├── HTTP Server Layer
│   └── Actix Web Server
├── Authentication & Authorization
│   ├── API Key Auth
│   ├── Wallet Auth
│   └── Role Authorization
├── Business Logic Layer
│   ├── User Service
│   ├── Meter Service
│   ├── Trading Service
│   ├── Governance Service
│   └── Oracle Service
├── Data Access Layer
│   ├── User Repository
│   ├── Meter Repository
│   ├── Order Repository
│   └── Audit Repository
├── Blockchain Integration
│   ├── Program Clients
│   ├── Transaction Builder
│   └── RPC Client
├── External Integrations
│   ├── AMI Connector
│   ├── Weather Feed
│   └── Price Feed
└── Data Persistence
    ├── PostgreSQL
    ├── TimescaleDB
    └── Redis Cache
```

**Use Case**: Understand API Gateway architecture and backend services.

---

## How to Read C4 Diagrams

### Color Conventions
- **Blue**: External systems and actors
- **Green**: Main system
- **Purple**: Components and containers
- **Yellow**: Storage and data

### Relationship Types
- **Solid Lines**: Active relationships (data flowing)
- **Dashed Lines**: Passive relationships (references/dependencies)
- **Arrows**: Direction of communication

---

## Common Use Cases

### "I want to understand how the system works"
Start with: **Level 1 (System Context)**
Then move to: **Level 2 (Containers)**

### "I need to modify the React app"
Start with: **Level 3a (Frontend Components)**

### "I need to add a new Anchor program"
Start with: **Level 3b (Anchor Programs)**

### "I need to modify API endpoints"
Start with: **Level 3c (Backend Components)**

### "I'm new to the project"
Read in this order:
1. Level 1 (System Context)
2. Level 2 (Containers)
3. C4_MODEL_GUIDE.md
4. Then your specific Level 3 diagram

---

## Relationships Between Diagrams

```
Level 1: System Context
    ↓ (What are the containers?)
Level 2: Containers
    ↓ (What components make up each container?)
Level 3a: Frontend Components
Level 3b: Blockchain Components
Level 3c: Backend Components
```

---

## Key Insights from C4 Model

### 1. Separation of Concerns
- Frontend handles UI and user interaction
- Backend handles business logic and validation
- Blockchain handles immutable records and trading
- Databases store configuration and historical data

### 2. Multi-Layered Authentication
- Level 1: Users authenticate via wallet
- Level 2: API validates wallet signatures
- Level 3c: Backend enforces role-based access
- Blockchain: Programs validate transaction signers

### 3. Data Flow Patterns
- **Real-time**: Smart meter → API → Frontend dashboard
- **Transactional**: User order → API → Blockchain → Database
- **Aggregated**: Historical meter data → Analytics → Reports

### 4. Technology Choices Rationale
- **React**: Modern UI framework with hooks
- **Rust**: Performance and safety for backend and blockchain
- **Anchor**: Simplified Solana program development
- **PostgreSQL**: Relational data (users, config)
- **TimescaleDB**: Time-series meter readings

### 5. Scalability Opportunities
- Horizontal: Multiple API Gateway instances
- Vertical: Upgrade database servers
- Caching: Redis for frequently accessed data
- Async: Message queues for background jobs

---

## Creating New Diagrams

When adding new components:

1. **Identify the Level**: Where does it fit?
2. **Update Appropriate Diagram**: Add to the right C4 level
3. **Update Relationships**: Show how it connects
4. **Update Documentation**: Add to this guide
5. **Generate PNG/SVG**: Convert to images for presentations

---

## Tools for Viewing

### Online
- PlantUML Online: https://www.plantuml.com/plantuml/uml/
- Paste diagram code to preview

### Local
```bash
# Install PlantUML
brew install plantuml

# Convert to PNG
plantuml C4_LEVEL_1_SYSTEM_CONTEXT.puml

# Convert to SVG
plantuml -tsvg C4_LEVEL_1_SYSTEM_CONTEXT.puml
```

### VS Code
- Install "PlantUML" extension
- Right-click on .puml file and select "Preview Current Diagram"

---

## Documentation Files

- **C4_LEVEL_1_SYSTEM_CONTEXT.puml** - System context diagram
- **C4_LEVEL_2_CONTAINERS.puml** - Container architecture
- **C4_LEVEL_3_COMPONENTS_FRONTEND.puml** - React component structure
- **C4_LEVEL_3_COMPONENTS_ANCHOR.puml** - Blockchain programs
- **C4_LEVEL_3_COMPONENTS_BACKEND.puml** - API Gateway structure
- **C4_MODEL_GUIDE.md** - Detailed guide (this folder)

---

## Next Steps

1. **View the diagrams** using PlantUML
2. **Read C4_MODEL_GUIDE.md** for detailed explanations
3. **Cross-reference** with your source code
4. **Keep up-to-date** as architecture evolves
5. **Refer to them** during design discussions

---

For more information about the C4 Model, visit: https://c4model.com/
