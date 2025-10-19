# PlantUML Diagrams - Quick Reference Index

## 📊 All Diagrams Overview

### Diagram Files Created

| # | Diagram | File | Purpose | Abstraction Level |
|---|---------|------|---------|-------------------|
| 1 | Context Diagram | `CONTEXT_DIAGRAM.puml` | System boundary & external entities | Highest |
| 2 | DFD Level 0 | `DFD_LEVEL_0.puml` | System as single process | Level 0 |
| 3 | DFD Level 1 | `DFD_LEVEL_1.puml` | 6 main processes & interactions | Level 1 |
| 4 | DFD Level 2 - Trading | `DFD_LEVEL_2_TRADING.puml` | Energy trading engine decomposition | Level 2 |
| 5 | DFD Level 2 - Smart Meter | `DFD_LEVEL_2_SMARTMETER.puml` | Meter integration decomposition | Level 2 |
| 6 | DFD Level 2 - Blockchain | `DFD_LEVEL_2_BLOCKCHAIN.puml` | Blockchain interaction decomposition | Level 2 |
| 7 | DFD Level 2 - Authentication | `DFD_LEVEL_2_AUTH.puml` | Auth & registration decomposition | Level 2 |
| 8 | Complete Flow | `DFD_COMPLETE_FLOW.puml` | End-to-end user journey (60 steps) | Sequence |
| 9 | Architecture Sequence | `ARCHITECTURE_OVERVIEW_SEQUENCE.puml` | System interactions & data flows | Sequence |

---

## 🎯 Hierarchy & Decomposition

```
Context Diagram (Shows System Boundary)
    ↓
DFD Level 0 (System as Single Process)
    ↓
DFD Level 1 (6 Major Processes)
    ├─→ 1.0 Authentication & Registration
    │   └─→ DFD Level 2 - Auth (6 sub-processes)
    ├─→ 2.0 Energy Trading Engine
    │   └─→ DFD Level 2 - Trading (5 sub-processes)
    ├─→ 3.0 Data Management & Analytics
    ├─→ 4.0 Smart Meter Integration
    │   └─→ DFD Level 2 - Smart Meter (6 sub-processes)
    ├─→ 5.0 Blockchain Interaction
    │   └─→ DFD Level 2 - Blockchain (6 sub-processes)
    └─→ 6.0 Monitoring & Governance
    
Complete Flow & Architecture Overview (Cross-cutting views)
```

---

## 📋 Diagram Selection Guide

### Choose **Context Diagram** if you need to:
- Understand system boundary
- Identify external systems
- Show high-level interactions
- Communicate with stakeholders
- Define scope

### Choose **DFD Level 0** if you need to:
- Understand overall data flow
- See all data stores
- Identify main entities
- High-level requirements analysis
- System scope confirmation

### Choose **DFD Level 1** if you need to:
- Understand major processes
- See process interactions
- Identify data dependencies
- Plan feature development
- Design API endpoints

### Choose **DFD Level 2 - Trading** if you need to:
- Implement order matching
- Debug trading issues
- Understand price discovery
- Implement liquidity management
- Design trading database

### Choose **DFD Level 2 - Smart Meter** if you need to:
- Integrate AMI data
- Implement REC token generation
- Process energy readings
- Debug meter data issues
- Design meter simulator

### Choose **DFD Level 2 - Blockchain** if you need to:
- Implement blockchain operations
- Debug transaction issues
- Understand instruction building
- Implement state management
- Design transaction lifecycle

### Choose **DFD Level 2 - Auth** if you need to:
- Implement authentication
- Design JWT strategy
- Manage user sessions
- Implement authorization
- Debug auth issues

### Choose **Complete Flow** if you need to:
- Design test cases
- Understand full journey
- Train new developers
- Debug end-to-end issues
- Write acceptance criteria

### Choose **Architecture Overview Sequence** if you need to:
- Train team members
- Present to stakeholders
- Understand layer interactions
- Design system changes
- Review architecture

---

## 🔄 Data Flow Summary

### Major Data Flows (Simplified)

```
Users
  ├─ Registration Data ─→ Auth System ─→ Registry Program ─→ User Database
  ├─ Trading Orders ─→ Trading Engine ─→ Trading Program ─→ Smart Contracts
  └─ Portfolio Queries ─→ API Gateway ─→ Database ─→ Dashboard

Grid Operator
  ├─ Meter Config ─→ System ─→ Meter Registry
  └─ AMI Data ─→ Smart Meter Integration ─→ Time-Series DB

External APIs
  ├─ Weather Data ─→ Smart Meter System ─→ Oracle Program
  └─ Price Data ─→ Trading Engine ─→ Price Discovery

Blockchain
  ├─ Transactions ─→ Validator ─→ Block ─→ State Update
  ├─ Token Transfers ─→ Token Program ─→ Balance Update
  └─ Governance ─→ Authority ─→ Parameter Update
```

---

## 🏗️ System Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│            React Components + React Query Hooks             │
│                  Wallet UI + Gill SDK                       │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway Layer (Rust)                  │
│  REST Endpoints | JWT Auth | Business Logic | RPC Client  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              Blockchain Layer (Solana - PoA)                │
│   Registry | Energy Token | Trading | Oracle | Governance  │
│                    Validator (Authority)                    │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   Data Storage Layer                        │
│      PostgreSQL | TimescaleDB | Redis Cache                │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│            Monitoring & Analytics Layer                     │
│         Prometheus | Grafana | Logging System              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Processes at Each Level

### Level 1 Processes (6 Main)
1. **User Authentication & Registration** - Handles wallet verification and user onboarding
2. **Energy Trading Engine** - Core trading logic with order matching
3. **Data Management & Analytics** - Data persistence and reporting
4. **Smart Meter Integration** - AMI data collection and REC generation
5. **Blockchain Interaction** - Smart contract execution layer
6. **Monitoring & Governance** - System health and authority management

### Level 2 Sub-processes Examples

**Trading (2.0) splits into:**
- 2.1: Order Validation & Matching
- 2.2: Price Discovery & Calculation
- 2.3: Transaction Execution
- 2.4: Order Management
- 2.5: Liquidity Management

**Smart Meter (4.0) splits into:**
- 4.1: Meter Assignment & Configuration
- 4.2: AMI Data Collection
- 4.3: Data Validation & Conversion
- 4.4: Energy Reading Processing
- 4.5: REC Token Generation
- 4.6: REC Validation

---

## 📊 Data Stores (D1-D4 at Level 1)

| Store | Type | Content | System |
|-------|------|---------|--------|
| D1 | User Accounts | User profiles, credentials | PostgreSQL |
| D2 | Energy Transactions | Trade history, energy data | PostgreSQL + TimescaleDB |
| D3 | Meter Configurations | Meter assignments | PostgreSQL |
| D4 | System Logs | Events, audit logs | TimescaleDB |

---

## 🔗 Integration Points

### Smart Contract Programs (Solana)
- **Registry**: User & meter management
- **Energy Token**: SPL token & REC operations
- **Trading**: Order book & settlement
- **Oracle**: AMI data processing
- **Governance**: Authority management

### External Systems
- **Weather APIs**: Generation forecasts
- **Price Feeds**: Market data
- **Utility Grid**: Net metering integration

---

## 💡 Usage Examples

### Example 1: Debugging a Trading Issue
```
Start: Complete Flow (Steps 29-47)
↓
Reference: DFD Level 1 - Process 2.0
↓
Drill Down: DFD Level 2 - Trading (Processes 2.1-2.5)
↓
Check: Architecture Overview - Trading Workflow
↓
Implementation: Review relevant code
```

### Example 2: Implementing New Auth Feature
```
Start: Context Diagram (understand boundary)
↓
Review: DFD Level 1 - Process 1.0
↓
Detail: DFD Level 2 - Authentication (Processes 1.1-1.6)
↓
Understand: Complete Flow (Steps 1-13)
↓
Implementation: Follow identified data flows
```

### Example 3: System Performance Analysis
```
Start: Architecture Overview Sequence
↓
Identify: Bottleneck layers
↓
Check: Relevant Level 2 DFD
↓
Review: Data store operations (PostgreSQL, Redis, TimescaleDB)
↓
Optimize: Based on identified flows
```

---

## ✅ Quality Checkpoints

When reviewing diagrams, verify:

- [ ] All external entities identified
- [ ] All data stores represented
- [ ] All processes have clear inputs/outputs
- [ ] No data flows missing
- [ ] Naming conventions consistent
- [ ] Hierarchical decomposition valid
- [ ] Feedback loops identified
- [ ] Parallel flows visible

---

## 📈 Scalability Considerations

From diagrams, identify scaling points:

1. **Trading Engine (2.0)**: Order book size, matching algorithm
2. **Smart Meter (4.0)**: AMI data volume, collection frequency
3. **Data Stores**: Database query performance, cache hit rates
4. **Blockchain**: Transaction throughput, finality latency
5. **API Gateway**: Request rate, concurrent connections

---

## 🔐 Security Flows Highlighted

From diagrams, critical security points:

1. **Authentication (1.0)**: JWT token validation, wallet verification
2. **Blockchain (5.0)**: Transaction signing, state finality
3. **Authorization (1.6)**: Role-based access control
4. **Data Validation (4.3)**: Outlier detection, REC eligibility
5. **Governance (6.0)**: Authority-only operations

---

## 📚 Related Documentation

- `SYSTEM_ARCHITECTURE.md` - Overall system design
- `ARCHITECTURE_GUIDE.md` - Detailed technical architecture
- `BLOCKCHAIN_GUIDE.md` - Smart contract specifics
- `USER_INTERACTION_GUIDE.md` - User journey flows
- `DEVELOPMENT_GUIDE.md` - Implementation guidelines

---

## 🎓 Training Path

1. **Day 1**: Context Diagram + DFD Level 0
2. **Day 2**: DFD Level 1 + Architecture Overview
3. **Day 3**: Relevant Level 2 DFD for your role
4. **Day 4**: Complete Flow for your feature
5. **Day 5**: Deep-dive Architecture Overview Sequence

---

*Last Updated: October 19, 2025*
*GridTokenX - P2P Energy Trading System*
