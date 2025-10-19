# GridTokenX - PlantUML Diagrams Documentation

## Overview

This document provides comprehensive documentation of all PlantUML diagrams created for the GridTokenX P2P Energy Trading System. These diagrams represent different levels of system abstraction and data flow analysis.

---

## Table of Contents

1. [Context Diagram](#context-diagram)
2. [DFD Level 0 (System Level)](#dfd-level-0)
3. [DFD Level 1 (Main Processes)](#dfd-level-1)
4. [DFD Level 2 - Trading](#dfd-level-2-trading)
5. [DFD Level 2 - Smart Meter](#dfd-level-2-smartmeter)
6. [DFD Level 2 - Blockchain](#dfd-level-2-blockchain)
7. [DFD Level 2 - Authentication](#dfd-level-2-authentication)
8. [Complete Flow](#complete-flow)
9. [Architecture Overview Sequence](#architecture-overview)

---

## Context Diagram

**File**: `CONTEXT_DIAGRAM.puml`

### Purpose
The context diagram shows the boundary of the entire GridTokenX system and identifies all external entities that interact with the system.

### Components

#### External Entities (Actors)
- **Campus Users**: Students, faculty, and staff who participate in energy trading
- **Grid Operator**: Manages smart meter assignments and configurations
- **Engineering Authority**: Operates the Solana validator and manages the blockchain network
- **External APIs**: Weather, price data, and utility grid integration
- **Monitoring Services**: Collects system metrics and health status
- **Database Admin**: Handles backup and recovery operations

#### Core System (GridTokenX)
- Solana Blockchain with Smart Contracts (PoA consensus)
- API Gateway (Rust/Axum) - 23 REST endpoints
- React Frontend Web Application
- Database Layer (PostgreSQL + TimescaleDB)
- Smart Meter Simulator

### Key Data Flows

1. **User Registration & Authentication**
   - Users connect wallets and register
   - System verifies against blockchain
   - JWT tokens issued for API access

2. **Energy Trading**
   - Users create buy/sell orders
   - Trading engine matches orders
   - Smart contracts execute trades
   - Results returned to users

3. **Meter Management**
   - Grid operator configures meters
   - AMI data collected in real-time
   - Energy readings stored in time-series DB

4. **System Monitoring**
   - Monitoring services collect metrics
   - Alerts generated for anomalies
   - Engineering authority can respond

---

## DFD Level 0

**File**: `DFD_LEVEL_0.puml`

### Purpose
Level 0 shows the entire system as a single process with all external entities and data stores.

### Decomposition
This is the context level that decomposes into Level 1 processes:

1. **User Authentication & Registration** (1.0)
2. **Energy Trading Engine** (2.0)
3. **Data Management & Analytics** (3.0)
4. **Smart Meter Integration** (4.0)
5. **Blockchain Interaction** (5.0)
6. **Monitoring & Governance** (6.0)

### Data Flows (18 major flows)

| Flow | Source | Destination | Description |
|------|--------|-------------|-------------|
| 1 | Users | System | Registration/Login credentials |
| 2 | System | Users | Trading dashboard & market data |
| 3 | Users | System | Create/place orders |
| 4 | System | Users | Order status & transaction results |
| 5 | Grid Op | System | Meter configuration |
| 6 | System | Grid Op | Meter status & data |
| 7 | Authority | System | Blockchain control |
| 8 | System | Authority | System metrics |
| 9 | Ext APIs | System | Weather/price data |
| 10 | System | Ext APIs | Data requests |
| 11 | System | Monitoring | System metrics |
| 12 | Monitoring | System | Monitoring rules |
| 13-18 | Data stores | Various | Store/retrieve operations |

---

## DFD Level 1

**File**: `DFD_LEVEL_1.puml`

### Purpose
Level 1 decomposes the system into 6 major processes and their interactions.

### Processes

#### 1.0 User Authentication & Registration
- Wallet verification using Solana signatures
- User account creation and verification
- JWT token generation for API access
- Session management and authorization checks

**Data Stores**: User Accounts (D1)

#### 2.0 Energy Trading Engine
- Order creation and validation
- Order matching algorithm
- Price discovery and calculation
- Trade execution and settlement

**Data Stores**: Energy Transactions (D2)

#### 3.0 Data Management & Analytics
- Energy data collection from AMI
- Data aggregation and analysis
- Report generation for dashboards
- Historical data queries

**Data Stores**: Energy Data (D2), System Logs (D4)

#### 4.0 Smart Meter Integration
- Meter configuration and assignment
- AMI data collection and validation
- Energy reading processing
- REC token generation and validation

**Data Stores**: Meter Configurations (D3)

#### 5.0 Blockchain Interaction
- Smart contract instruction building
- Transaction signing and submission
- Block production and finality
- State updates and confirmations

#### 6.0 Monitoring & Governance
- System health monitoring
- Event logging and alerting
- Authority-level governance actions
- Network parameter management

**Data Stores**: System Logs (D4)

### Key Interdependencies

```
1.0 ──────→ 2.0 (Authenticated users)
        ──→ 3.0 (Validate users)
        
2.0 ──────→ 5.0 (Execute trades)
    ──────→ 3.0 (Store trades)
    ──→ 6.0 (Trade events)
    
4.0 ──────→ 3.0 (Energy readings)
    ──→ 2.0 (Available energy)
    ──→ 6.0 (Meter events)
    
5.0 ──────→ 3.0 (Blockchain state)
```

---

## DFD Level 2 - Trading

**File**: `DFD_LEVEL_2_TRADING.puml`

### Purpose
Decomposes Process 2.0 (Energy Trading Engine) into detailed sub-processes.

### Sub-processes

#### 2.1 Order Validation & Matching
- Validates incoming orders (quantity, price constraints)
- Queries order book for matching counterparties
- Executes matching algorithm
- Prepares trades for settlement

**Data**: Order Book (D21)

#### 2.2 Price Discovery & Calculation
- Queries current market price from external APIs
- Updates pricing based on supply/demand
- Calculates effective prices for trades
- Manages price volatility constraints

**Data**: Trading Pairs (D22)

#### 2.3 Transaction Execution
- Executes matched trades
- Updates user balances
- Logs executed trades
- Calls smart contracts for settlement

**Data**: Executed Trades (D23), User Balances (D24)

#### 2.4 Order Management
- Manages order lifecycle (pending → filled/cancelled)
- Tracks partial fills
- Handles order cancellations
- Maintains order history

**Data**: Order Book (D21)

#### 2.5 Liquidity Management
- Monitors market liquidity and depth
- Adjusts spreads dynamically
- Reports liquidity metrics
- Manages price tiers

### Key Flows

1. User places order → 2.1 validates → checks 2.4 for matches
2. 2.2 provides current price → 2.1 uses for validation
3. 2.1 → 2.3 for execution once matched
4. 2.3 updates 2.4's order status
5. 2.5 continuously monitors liquidity across all processes

---

## DFD Level 2 - Smart Meter

**File**: `DFD_LEVEL_2_SMARTMETER.puml`

### Purpose
Decomposes Process 4.0 (Smart Meter Integration) into detailed sub-processes.

### Sub-processes

#### 4.1 Meter Assignment & Configuration
- Grid operator assigns meters to users
- Stores meter registry and associations
- Manages meter metadata (type, location, capacity)
- Tracks meter status

**Data**: Meter Registry (D41)

#### 4.2 AMI Data Collection
- Receives AMI readings from simulator
- Integrates weather data for context
- Collects data from multiple meters
- Manages collection frequency

**Data**: AMI Readings (D42)

#### 4.3 Data Validation & Conversion
- Validates AMI data format and ranges
- Performs outlier detection
- Converts units (W → kWh, timestamps)
- Checks REC eligibility rules

**Data**: Cleaned Energy Data (D43)

#### 4.4 Energy Reading Processing
- Aggregates individual readings
- Calculates generation/consumption totals
- Applies weather adjustments
- Prepares data for tokenization

#### 4.5 REC Token Generation
- Calculates eligible energy amounts
- Calls token program to mint RECs
- Tracks token issuance history
- Manages token allocation rules

**Data**: REC Records (D44)

#### 4.6 REC Validation
- Validates REC eligibility with authority
- Enforces REC business rules
- Tracks certification status
- Manages REC lifecycle

### Workflow

```
Grid Operator
    ↓
4.1 Assign Meter ─→ D41 Meter Registry
    ↓
4.2 AMI Collection ─→ D42 Raw Data
    ↓
4.3 Validate & Convert ─→ D43 Cleaned Data
    ↓
4.4 Process Energy ──→ Calculate kWh
    ↓
4.5/4.6 Generate & Validate REC ─→ D44 REC Records
    ↓
Trading Engine (Process 2.0)
```

---

## DFD Level 2 - Blockchain

**File**: `DFD_LEVEL_2_BLOCKCHAIN.puml`

### Purpose
Decomposes Process 5.0 (Blockchain Interaction) into detailed sub-processes.

### Sub-processes

#### 5.1 Instruction Building
- Creates transaction instructions from programs
- Validates account requirements
- Serializes instruction data
- Prepares for signing

**Data**: Program Accounts (D51), Program IDLs (D54)

#### 5.2 Signer Management
- Loads user wallet signer
- Manages signing keypairs
- Validates signer authority
- Prepares transaction signing

#### 5.3 Transaction Signing
- Signs transaction with wallet
- Includes all required signers
- Validates signatures
- Prepares for submission

**Data**: Transaction Log (D52)

#### 5.4 Transaction Submission
- Submits signed transaction to validator
- Tracks submission status
- Retries on failure
- Waits for block inclusion

#### 5.5 Block Production
- Validator receives transactions
- Validates transaction signatures
- Includes in next block
- Produces confirmed block

**Data**: Blockchain State (D53)

#### 5.6 State Update
- Updates on-chain account state
- Finalizes transaction effects
- Propagates state changes
- Confirms to clients

### Transaction Lifecycle

```
Trading Engine
    ↓
5.1 Build Instruction ─→ D54 IDL, D51 Accounts
    ↓
5.2 Manage Signer ─→ Load wallet
    ↓
5.3 Sign Transaction ─→ D52 Log signing
    ↓
5.4 Submit Transaction ─→ Authority Validator
    ↓
5.5 Block Production ─→ Validate & include
    ↓
5.6 State Update ─→ D53 Blockchain State
    ↓
Result back to Trading Engine
```

---

## DFD Level 2 - Authentication

**File**: `DFD_LEVEL_2_AUTH.puml`

### Purpose
Decomposes Process 1.0 (User Authentication & Registration) into detailed sub-processes.

### Sub-processes

#### 1.1 Wallet Verification
- Receives wallet address and signature
- Verifies signature on blockchain
- Checks wallet ownership
- Validates wallet format

#### 1.2 User Registration
- Collects user information (name, email, type)
- Creates user account record
- Assigns unique user ID
- Stores initial profile

**Data**: User Accounts (D11)

#### 1.3 Credential Validation
- Validates login credentials
- Checks password hash
- Verifies user roles and permissions
- Validates account status

#### 1.4 JWT Token Generation
- Creates JWT token with user claims
- Includes user roles and permissions
- Sets token expiration
- Stores token for tracking

**Data**: Auth Tokens (D12), User Roles (D14)

#### 1.5 Session Management
- Creates session record on login
- Stores session metadata
- Manages session lifecycle
- Handles session termination

**Data**: Session Data (D13)

#### 1.6 Authorization Check
- Validates user permissions
- Checks role-based access
- Enforces feature restrictions
- Logs authorization decisions

### Authentication Flow

```
User provides credentials
    ↓
1.1 Verify Wallet ─→ Check blockchain
    ↓
1.2 Register User ─→ D11 Store account
    ↓
1.3 Validate Credentials ─→ D14 Check roles
    ↓
1.4 Generate JWT ─→ D12 Store token
    ↓
1.5 Manage Session ─→ D13 Session data
    ↓
1.6 Authorization Check ─→ Allow/Deny
    ↓
Return token to user
```

### Token Refresh & Logout

- **Refresh**: Client sends refresh token → 1.4 validates → new token issued
- **Logout**: Client sends logout request → 1.5 deletes session → 1.4 revokes token

---

## Complete Flow

**File**: `DFD_COMPLETE_FLOW.puml`

### Purpose
Shows the complete end-to-end data flow for all major user journeys in the system.

### Numbered Flows (60 steps)

#### User Registration Journey (Steps 1-13)
1. User opens app
2. Wallet connection initiated
3. Wallet signer loaded
4. Registration checked
5. User not found
6. Registration required
7. Registration mutation triggered
8. Register instruction called
9. Authority validation
10. Registration approved
11. User account stored in database
12. Account created
13. Dashboard displayed

#### Meter Configuration Journey (Steps 14-21)
14. Grid operator assigns meter
15. Meter configuration mutation
16. POST /meters endpoint
17. Meter validation
18. Assignment stored
19. Config cached in Redis
20. Oracle program registers meter
21. Meter ready to collect data

#### AMI Data Collection Journey (Steps 22-28)
22. AMI simulator reads meter
23. AMI sends energy data
24. Data stored in database
25. Latest reading cached
26. Oracle processes data
27. REC tokens calculated
28. Token balance updated

#### Trading Journey (Steps 29-47)
29. User creates sell order (10 GRID@2.5)
30. Order placement mutation
31. POST /orders endpoint
32. Order validation
33. Balance checked in cache
34. Sufficient balance confirmed
35. Trading program creates order
36. Governance program checks rules
37. Order stored
38. Trade logged
39. Order confirmed to user
40. System queries buy orders
41. Matching order found
42. Trade execution initiated
43. Token transfer initiated
44. Balances updated in cache
45. Balances confirmed
46. Trade recorded in database
47. Trade completion confirmed

#### Monitoring Journey (Steps 48-52)
48. Metrics emitted to Prometheus
49. API requests logged
50. Logs stored in database
51. User events recorded
52. Trade events recorded

#### Dashboard Journey (Steps 53-60)
53. User views portfolio
54. Dashboard query initiated
55. GET /portfolio endpoint
56. User data fetched
57. Holdings retrieved
58. Cache hit confirmed
59. Data returned
60. Charts rendered

---

## Architecture Overview Sequence

**File**: `ARCHITECTURE_OVERVIEW_SEQUENCE.puml`

### Purpose
Comprehensive sequence diagram showing actual system interactions between all layers for major operations.

### Layers Represented

#### 1. Frontend Layer (Vite + React 18)
- React Components: UI rendering and state management
- React Query: Data fetching and caching hooks
- Wallet UI: Solana wallet integration
- Gill SDK: Blockchain signing capabilities

#### 2. API Gateway (Rust/Axum)
- REST Endpoints: 23 endpoints for all operations
- JWT Authentication: Token validation and authorization
- Business Logic: Trade matching, validation, calculations
- RPC Client: Communication with Solana blockchain

#### 3. Blockchain Layer (Solana PoA)
- Registry Program: User and meter management
- Energy Token Program: SPL token and REC management
- Trading Program: Order book and trade matching
- Oracle Program: External data processing
- Governance Program: Authority and parameter management
- Validator: Single PoA validator (Engineering Authority)

#### 4. Data Storage
- PostgreSQL: User data and configuration
- TimescaleDB: Time-series energy data
- Redis Cache: Real-time data and sessions

#### 5. Monitoring & Analytics
- Prometheus: Metrics collection
- Grafana: Dashboard visualization
- Logging: Centralized event logging

### Key Operation Flows in Sequence Diagram

1. **User Registration**: Wallet → JWT Auth → Registry Program → PostgreSQL
2. **Meter Configuration**: Grid Op → REST API → Oracle Program → PostgreSQL
3. **AMI Data Collection**: Simulator → REST API → TimescaleDB → Oracle Program
4. **Trading Workflow**: User → React Query → REST API → Trading Program → Token Program
5. **Order Matching**: Trading Engine → Order Book → Token Transfer → TimescaleDB
6. **System Monitoring**: All components → Prometheus → Grafana

---

## Data Storage Specifications

### PostgreSQL (User & Configuration Data)
- User accounts and profiles
- Meter assignments
- API keys and authentication
- User roles and permissions
- Configuration parameters

**Key Tables**:
- `users` - User accounts
- `user_roles` - RBAC mapping
- `meters` - Meter registry
- `meter_assignments` - User-meter associations

### TimescaleDB (Time-Series Energy Data)
- Energy readings (1-minute intervals)
- Trading activity logs
- Market data snapshots
- Performance metrics

**Key Hypertables**:
- `energy_readings` - AMI data with timestamps
- `trading_events` - Trade history with timestamps
- `market_prices` - Price history

### Redis Cache (Real-Time Data)
- Current order book state
- User account balances
- Session management
- Latest meter readings
- Cached API responses

---

## Integration Points

### Solana Programs
1. **Registry**: `FSXdxk5uPUvJc51MzjtBaCDrFh7RSMcHFKpzCG9LeuJ`
2. **Energy Token**: `FaELH72fUMRaLTX3ersmQLr4purfHGvJccm1BXfDPL6r`
3. **Trading**: `CEWpf4Rvm3SU2zQgwsQpi5EMYBUrWbKLcAhAT2ouVoWD`
4. **Oracle**: `G365L8A4Y3xmp5aN2GGLj2SJr5KetgE5F57PaFvCgSgG`
5. **Governance**: `EAcyEzfXXJCDnjZKUrgHsBEEHmnozZJXKs2wdW3xnWgb`

### External APIs
- Weather data for generation forecasts
- Market price feeds
- Utility grid integration

---

## Recommendations for Using These Diagrams

1. **Development**: Use Level 2 diagrams when implementing new features
2. **Testing**: Reference DFD Complete Flow for test case design
3. **Documentation**: Include Context Diagram and Level 1 in architecture docs
4. **Onboarding**: Use Architecture Overview Sequence for team training
5. **Troubleshooting**: Reference specific Level 2 DFD for debugging data flows
6. **Deployment**: Use Context Diagram to identify infrastructure requirements

---

## Future Enhancements

- Add error handling flows to DFD Level 2 diagrams
- Create performance characteristic diagram
- Document scaling considerations
- Add security-specific data flows
- Create disaster recovery flows

---

*Document Generated: October 19, 2025*
*GridTokenX Project - P2P Energy Trading System*
