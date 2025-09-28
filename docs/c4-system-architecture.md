# GridTokenX P2P Energy Trading System - C4 Architecture Model

This document presents the C4 (Context, Containers, Components, Code) architecture model for the GridTokenX P2P Energy Trading System, a decentralized peer-to-peer energy trading platform built on Solana blockchain.

## System Overview

GridTokenX is a comprehensive P2P energy trading platform that enables prosumers (energy producers + consumers) to trade renewable energy certificates (RECs) and energy tokens directly with consumers through a decentralized marketplace. The system leverages Solana blockchain for fast, secure, and cost-effective transactions.

## 1. System Context Diagram (Level 1)

This diagram shows how GridTokenX fits into the broader ecosystem and its relationships with external systems and users.

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

LAYOUT_WITH_LEGEND()

title System Context - GridTokenX P2P Energy Trading System

System_Boundary(utcc_campus, "University of the Thai Chamber of Commerce (UTCC)") {
    Person(engineering_dept, "Engineering Department", "System administrators with authority to manage the network, validate RECs, and oversee governance")
    
    System(gridtokenx, "GridTokenX Platform", "P2P energy trading platform enabling direct energy transactions with blockchain-backed REC validation")
    
    System_Boundary(ami_simulator, "AMI Simulator System") {
        System(academic_buildings, "Academic Buildings", "Simulated university buildings that can act as prosumers/consumers with solar panels and energy demand")
        System(residential_buildings, "Residential Buildings", "Simulated dormitories and housing that can act as prosumers/consumers in the campus microgrid")
        System(commercial_buildings, "Commercial Buildings", "Simulated facilities (cafeterias, shops, offices) that can act as prosumers/consumers in energy trading")
        System(smart_meters, "Smart Meter Network", "Simulated smart meters collecting energy production/consumption data from all buildings")
    }
    
    System(solana_network, "Solana Private Network", "Campus-operated private Solana blockchain network with permissioned validators for secure token transactions and smart contracts")
    
    System(monitoring_stack, "Monitoring & Analytics", "Campus monitoring infrastructure with Grafana dashboards and Prometheus metrics collection")
}

' Relationships within UTCC Campus
Rel(engineering_dept, gridtokenx, "Administers", "Web UI/API")

' AMI Simulator relationships
Rel(academic_buildings, smart_meters, "Generates energy data", "Simulated IoT")
Rel(residential_buildings, smart_meters, "Generates energy data", "Simulated IoT")
Rel(commercial_buildings, smart_meters, "Generates energy data", "Simulated IoT")
Rel(smart_meters, gridtokenx, "Sends prosumer/consumer data", "MQTT/HTTP")

' System monitoring
Rel(gridtokenx, monitoring_stack, "Sends metrics & logs", "Campus Network")

' Private blockchain interaction
Rel(gridtokenx, solana_network, "Executes transactions", "Campus Network/RPC")

' Styling
UpdateElementStyle(gridtokenx, $bgColor="#9C27B0", $fontColor="#FFFFFF")
UpdateElementStyle(engineering_dept, $bgColor="#4CAF50", $fontColor="#FFFFFF")
UpdateElementStyle(academic_buildings, $bgColor="#2196F3", $fontColor="#FFFFFF")
UpdateElementStyle(residential_buildings, $bgColor="#FF9800", $fontColor="#FFFFFF")
UpdateElementStyle(commercial_buildings, $bgColor="#9E9E9E", $fontColor="#FFFFFF")
UpdateElementStyle(smart_meters, $bgColor="#607D8B", $fontColor="#FFFFFF")
UpdateElementStyle(solana_network, $bgColor="#1ABC9C", $fontColor="#FFFFFF")

@enduml
```

## 2. Container Diagrams (Level 2)

The container level is broken down into multiple focused diagrams to improve readability and understanding.

### 2.1 Platform Overview - Core Infrastructure

This diagram shows the main platform containers and their interactions with external systems.

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

LAYOUT_WITH_LEGEND()

title Platform Overview - GridTokenX Core Infrastructure

Person(users, "Energy Traders", "Students, faculty, and engineering department staff")
System_Ext(solana, "Solana Blockchain", "Decentralized blockchain network hosting smart contracts")
System_Ext(ami_system, "AMI Meter Simulator", "Simulation software for testing smart meter data integration")

Container_Boundary(gridtokenx_platform, "GridTokenX Platform") {
    Container(frontend, "Frontend Application", "React 19, TypeScript, Vite", "Responsive web application providing energy trading interface, portfolio management, and governance tools")
    
    Container(api_gateway, "API Gateway", "Rust, Actix-Web", "API gateway handling authentication, rate limiting, and request routing to blockchain programs")
    
    Container(nginx, "Nginx Proxy", "Nginx", "Reverse proxy and load balancer providing SSL termination and static file serving")
    
    ContainerDb(postgres, "PostgreSQL Database", "PostgreSQL, TimescaleDB", "Stores user profiles, trading history, meter assignments, and time-series energy data")
    
    ContainerDb(redis, "Redis Cache", "Redis", "Caching layer for session management, real-time data, and API rate limiting")

    Container(smart_meter_sim, "Smart Meter Simulator", "Python, FastAPI", "Primary AMI simulation software generating realistic energy production/consumption data for testing")
    
    Container(oracle_sim, "Oracle Simulator", "Python", "Simulates external data feeds and automated trading processes")
}

' User interactions
Rel(users, nginx, "Uses", "HTTPS")
Rel(nginx, frontend, "Serves")
Rel(frontend, api_gateway, "API calls", "JSON/HTTPS")

' Data storage
Rel(api_gateway, postgres, "Stores/retrieves", "SQL")
Rel(api_gateway, redis, "Caches", "Redis Protocol")

' External integrations
Rel(api_gateway, solana, "Blockchain interactions", "Solana RPC")
Rel(smart_meter_sim, ami_system, "Simulates AMI data", "HTTP/MQTT")
Rel(oracle_sim, api_gateway, "External feeds", "HTTP")

' Styling
UpdateElementStyle(frontend, $bgColor="#61DAFB", $fontColor="#000000")
UpdateElementStyle(api_gateway, $bgColor="#CE422B", $fontColor="#FFFFFF")
UpdateElementStyle(postgres, $bgColor="#336791", $fontColor="#FFFFFF")
UpdateElementStyle(redis, $bgColor="#DC382D", $fontColor="#FFFFFF")

@enduml
```

### 2.2 Blockchain Programs - Smart Contract Architecture

This diagram focuses on the Solana blockchain programs and their interactions.

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

LAYOUT_WITH_LEGEND()
LAYOUT_TOP_DOWN()

title Blockchain Programs - Smart Contract Architecture

' External Systems
Container(api_gateway, "API Gateway", "Rust, Actix-Web", "Routes requests to appropriate blockchain programs")
System_Ext(solana, "Solana Blockchain", "Decentralized blockchain network")
System_Ext(ami_system, "AMI Meter Simulator", "Simulation software for testing smart meter data integration")

' Core Programs Group
Container_Boundary(core_programs, "Core Business Programs") {
    Container(registry_program, "Registry Program", "Anchor, Rust", "User registration, meter assignments, and identity verification")
    
    Container(energy_token_program, "Energy Token Program", "Anchor, Rust, SPL", "SPL token implementation for GRID tokens and energy tokenization")
    
    Container(trading_program, "Trading Program", "Anchor, Rust", "P2P marketplace with order matching and automated settlement")
}

' System Programs Group
Container_Boundary(system_programs, "System & Integration Programs") {
    Container(oracle_program, "Oracle Program", "Anchor, Rust", "External data integration and automated market operations")
    
    Container(governance_program, "Governance Program", "Anchor, Rust", "Proof-of-Authority governance and REC validation")
}

' API Gateway routing with grouped relationships
Rel_D(api_gateway, registry_program, "User management", "Solana RPC")
Rel_D(api_gateway, energy_token_program, "Token operations", "Solana RPC")
Rel_D(api_gateway, trading_program, "Trading operations", "Solana RPC")
Rel_D(api_gateway, oracle_program, "Data feeds", "Solana RPC")
Rel_D(api_gateway, governance_program, "Admin operations", "Solana RPC")

' External integrations
Rel(oracle_program, ami_system, "Reads simulated\nenergy data", "MQTT/HTTP")

' Blockchain deployment relationships
Rel_D(registry_program, solana, "Deployed on", "Anchor Deploy")
Rel_D(energy_token_program, solana, "Deployed on", "Anchor Deploy")
Rel_D(trading_program, solana, "Deployed on", "Anchor Deploy")
Rel_D(oracle_program, solana, "Deployed on", "Anchor Deploy")
Rel_D(governance_program, solana, "Deployed on", "Anchor Deploy")

' Cross-Program Invocations (CPI) - Core interactions
Rel(oracle_program, energy_token_program, "Automated\ntoken minting", "CPI")
Rel(trading_program, energy_token_program, "Token transfers\n& escrow", "CPI")
Rel(registry_program, trading_program, "User verification\n& authorization", "CPI")

' Governance control flows
Rel(governance_program, registry_program, "System control\n& permissions", "CPI")
Rel(governance_program, energy_token_program, "REC validation\n& authority", "CPI")
Rel(governance_program, trading_program, "Market control\n& emergency stops", "CPI")

' Enhanced styling with program-specific colors and better contrast
UpdateElementStyle(api_gateway, $bgColor="#2C3E50", $fontColor="#FFFFFF", $borderColor="#34495E")

' Core Programs - Business Logic (Blue tones)
UpdateElementStyle(registry_program, $bgColor="#6C5CE7", $fontColor="#FFFFFF", $borderColor="#5A4FCF")
UpdateElementStyle(energy_token_program, $bgColor="#00B894", $fontColor="#FFFFFF", $borderColor="#00A085")
UpdateElementStyle(trading_program, $bgColor="#0984E3", $fontColor="#FFFFFF", $borderColor="#0770D1")

' System Programs - Infrastructure (Orange/Red tones)
UpdateElementStyle(oracle_program, $bgColor="#E17055", $fontColor="#FFFFFF", $borderColor="#D35640")
UpdateElementStyle(governance_program, $bgColor="#E84393", $fontColor="#FFFFFF", $borderColor="#D63384")

' External systems
UpdateElementStyle(solana, $bgColor="#1ABC9C", $fontColor="#FFFFFF", $borderColor="#16A085")
UpdateElementStyle(ami_system, $bgColor="#95A5A6", $fontColor="#FFFFFF", $borderColor="#7F8C8D")

' Boundary styling
UpdateBoundaryStyle(core_programs, $bgColor="#EBF3FD", $borderColor="#3498DB")
UpdateBoundaryStyle(system_programs, $bgColor="#FDF2E9", $borderColor="#E67E22")

@enduml
```

### 2.3 Monitoring & Analytics Stack

This diagram shows the monitoring and observability infrastructure.

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

LAYOUT_WITH_LEGEND()

title Monitoring & Analytics Stack

Container(frontend, "Frontend Application", "React 19, TypeScript", "Client-side metrics and user analytics")
Container(api_gateway, "API Gateway", "Rust, Actix-Web", "Server-side metrics and API monitoring")
ContainerDb(postgres, "PostgreSQL Database", "PostgreSQL, TimescaleDB", "Historical data for analytics")

Container_Boundary(monitoring_stack, "Monitoring & Analytics") {
    Container(prometheus, "Prometheus", "Prometheus", "Metrics collection, storage, and alerting system")
    Container(grafana, "Grafana", "Grafana", "Real-time dashboards and analytics visualization")
    Container(alertmanager, "Alert Manager", "Prometheus AlertManager", "Alert routing and notification management")
}

Container_Boundary(log_aggregation, "Log Management") {
    Container(loki, "Loki", "Grafana Loki", "Log aggregation and querying")
    Container(promtail, "Promtail", "Grafana Promtail", "Log collection agent")
}

' Metrics collection
Rel(api_gateway, prometheus, "Exports metrics", "HTTP/9090")
Rel(frontend, prometheus, "Client metrics", "HTTP/9090")
Rel(postgres, prometheus, "Database metrics", "HTTP/9187")

' Visualization
Rel(prometheus, grafana, "Data source", "HTTP")
Rel(postgres, grafana, "Analytics queries", "SQL")

' Alerting
Rel(prometheus, alertmanager, "Alert rules", "HTTP")
Rel(alertmanager, grafana, "Alert notifications")

' Log management
Rel(api_gateway, promtail, "Application logs")
Rel(frontend, promtail, "Client logs")
Rel(promtail, loki, "Log ingestion")
Rel(loki, grafana, "Log queries")

' Styling
UpdateElementStyle(prometheus, $bgColor="#E6522C", $fontColor="#FFFFFF")
UpdateElementStyle(grafana, $bgColor="#F46800", $fontColor="#FFFFFF")
UpdateElementStyle(loki, $bgColor="#00D9FF", $fontColor="#000000")
UpdateElementStyle(alertmanager, $bgColor="#FF6B6B", $fontColor="#FFFFFF")

@enduml
```

## 3. Component Diagram (Level 3)

This diagram focuses on the components within the Frontend Application container, showing how the React-based UI is structured.

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml

LAYOUT_WITH_LEGEND()

title Component Diagram - GridTokenX Frontend Application

Container(api_gateway, "API Gateway", "Rust, Actix-Web", "Handles API requests and blockchain interactions")
Container(blockchain_programs, "Solana Programs", "Anchor, Rust", "Smart contracts for energy trading")
Person(users, "Energy Traders", "System users")

Container_Boundary(frontend_app, "Frontend Application") {
    Component(app_providers, "App Providers", "React Context", "Provider hierarchy for wallet, theme, query client, and Solana connection")
    
    Component(landing_feature, "Landing Feature", "React, TypeScript", "Homepage with platform overview, features showcase, and onboarding flow")
    
    Component(dashboard_feature, "Dashboard Feature", "React, TypeScript", "Comprehensive dashboard with trading overview, portfolio metrics, and quick actions")
    
    Component(registry_feature, "Registry Feature", "React, TypeScript", "User registration system with participant management and requirements")
    
    Component(trading_components, "Trading Components", "React, TypeScript", "Energy trading interface with order book, price charts, and transaction forms")
    
    Component(portfolio_components, "Portfolio Components", "React, TypeScript", "Token portfolio management with balance tracking and performance metrics")
    
    Component(governance_components, "Governance Components", "React, TypeScript", "PoA governance interface for system administration and REC validation")

    Component(wallet_integration, "Wallet Integration", "Gill SDK, React", "Solana wallet connection and transaction signing with multiple wallet support")
    
    Component(data_access_layer, "Data Access Layer", "React Query, TypeScript", "API hooks and state management for blockchain data and user interactions")
    
    Component(ui_components, "UI Components", "shadcn/ui, Tailwind", "Reusable UI component library with consistent design system")
    
    Component(code_generation, "Generated Clients", "Codama, TypeScript", "Auto-generated TypeScript clients from Anchor IDL files")
}

' User interactions
Rel(users, landing_feature, "Views platform info")
Rel(users, dashboard_feature, "Monitors trading activity")
Rel(users, registry_feature, "Registers as participant")
Rel(users, trading_components, "Places energy orders")
Rel(users, portfolio_components, "Manages token portfolio")
Rel(users, governance_components, "Participates in governance")

' Component relationships
Rel(app_providers, wallet_integration, "Provides wallet context")
Rel(app_providers, data_access_layer, "Provides query client")

Rel(dashboard_feature, trading_components, "Embeds trading interface")
Rel(dashboard_feature, portfolio_components, "Shows portfolio metrics")
Rel(dashboard_feature, ui_components, "Uses UI components")

Rel(trading_components, data_access_layer, "Fetches trading data")
Rel(portfolio_components, data_access_layer, "Fetches balance data")
Rel(registry_feature, data_access_layer, "Manages registration")
Rel(governance_components, data_access_layer, "Handles governance actions")

Rel(data_access_layer, code_generation, "Uses generated clients")
Rel(data_access_layer, wallet_integration, "Signs transactions")

Rel(wallet_integration, api_gateway, "Sends signed transactions", "JSON/HTTPS")
Rel(data_access_layer, api_gateway, "API requests", "JSON/HTTPS")
Rel(code_generation, blockchain_programs, "Interacts with programs", "Solana RPC")

' Styling
UpdateElementStyle(app_providers, $bgColor="#FF6B6B", $fontColor="#FFFFFF")
UpdateElementStyle(dashboard_feature, $bgColor="#4ECDC4", $fontColor="#FFFFFF")
UpdateElementStyle(trading_components, $bgColor="#45B7D1", $fontColor="#FFFFFF")
UpdateElementStyle(portfolio_components, $bgColor="#96CEB4", $fontColor="#FFFFFF")
UpdateElementStyle(wallet_integration, $bgColor="#FFEAA7", $fontColor="#000000")
UpdateElementStyle(data_access_layer, $bgColor="#DDA0DD", $fontColor="#000000")

@enduml
```

## 4. Deployment Diagram (Level 4)

This diagram shows how the GridTokenX system is deployed in a production environment using Docker containers.

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Deployment.puml

LAYOUT_WITH_LEGEND()

title Deployment Diagram - GridTokenX Production Environment

Deployment_Node(user_devices, "User Devices", "Desktop/Mobile") {
    Container(browser, "Web Browser", "Chrome, Firefox, Safari", "Access to GridTokenX trading platform")
    Container(mobile_wallet, "Mobile Wallet", "Phantom, Solflare", "Solana wallet applications for transaction signing")
}

Deployment_Node(cloud_infrastructure, "Cloud Infrastructure", "AWS/GCP/Azure") {
    Deployment_Node(kubernetes_cluster, "Kubernetes Cluster", "Container Orchestration") {
        Deployment_Node(frontend_pods, "Frontend Pods x3", "React Application Replicas") {
            Container(frontend_app, "Frontend App", "React, Nginx", "Responsive web application served via Nginx")
        }
        
        Deployment_Node(api_pods, "API Gateway Pods x2", "Rust Service Replicas") {
            Container(api_service, "API Gateway", "Rust, Actix-Web", "Authentication, rate limiting, blockchain proxy")
        }
        
        Deployment_Node(monitoring_pod, "Monitoring Pod", "Observability Stack") {
            Container(prometheus_container, "Prometheus", "Metrics Collection", "System metrics and alerting")
            Container(grafana_container, "Grafana", "Analytics Dashboard", "Real-time monitoring and visualization")
        }
    }
    
    Deployment_Node(database_cluster, "Database Cluster", "Managed Database Service") {
        Deployment_Node(postgres_primary, "PostgreSQL Primary", "TimescaleDB") {
            ContainerDb(main_database, "Main Database", "PostgreSQL 15", "User data, trading history, time-series energy data")
        }
        
        Deployment_Node(postgres_replica, "PostgreSQL Replica", "Read Replica") {
            ContainerDb(replica_database, "Replica Database", "PostgreSQL 15", "Read-only replica for analytics queries")
        }
    }
    
    Deployment_Node(cache_cluster, "Redis Cluster", "Managed Cache Service") {
        ContainerDb(redis_cache, "Redis Cache", "Redis 7", "Session management, API rate limiting, real-time data")
    }
    
    Deployment_Node(load_balancer, "Load Balancer", "Application Load Balancer") {
        Container(alb, "ALB", "AWS ALB/GCP LB", "SSL termination, traffic distribution, health checks")
    }
}

Deployment_Node(solana_network, "Solana Network", "Blockchain Infrastructure") {
    Deployment_Node(validators, "Validator Nodes", "Solana Validators") {
        Container(registry_contract, "Registry Program", "Anchor Smart Contract", "User and meter management")
        Container(token_contract, "Energy Token Program", "SPL Token Contract", "GRID token implementation")
        Container(trading_contract, "Trading Program", "Anchor Smart Contract", "P2P energy marketplace")
        Container(oracle_contract, "Oracle Program", "Anchor Smart Contract", "External data integration")
        Container(governance_contract, "Governance Program", "Anchor Smart Contract", "PoA system administration")
    }
}

Deployment_Node(external_services, "External Services", "Third-party Integrations") {
    Container(ami_integration, "AMI Simulator Gateway", "Simulation Platform", "Mock smart meter data generation and processing for testing")
}

' User interactions
Rel(browser, alb, "HTTPS requests", "HTTPS/443")
Rel(mobile_wallet, validators, "Transaction signing", "RPC/WSS")

' Load balancer routing
Rel(alb, frontend_app, "Routes requests", "HTTP/80")
Rel(alb, api_service, "API requests", "HTTP/8080")

' API service interactions
Rel(api_service, main_database, "Read/Write operations", "PostgreSQL/5432")
Rel(api_service, replica_database, "Analytics queries", "PostgreSQL/5432")
Rel(api_service, redis_cache, "Caching operations", "Redis/6379")
Rel(api_service, validators, "Blockchain interactions", "RPC/8899")

' Smart contract interactions
Rel(registry_contract, token_contract, "User verification", "Cross-Program Invocation")
Rel(trading_contract, token_contract, "Token transfers", "Cross-Program Invocation")
Rel(oracle_contract, token_contract, "Automated minting", "Cross-Program Invocation")
Rel(governance_contract, registry_contract, "Admin controls", "Cross-Program Invocation")

' External integrations
Rel(oracle_contract, ami_integration, "Simulated energy data", "HTTPS/MQTT")

' Monitoring
Rel(api_service, prometheus_container, "Metrics export", "HTTP/9090")
Rel(frontend_app, prometheus_container, "Client metrics", "HTTP/9090")
Rel(prometheus_container, grafana_container, "Data source", "HTTP/3000")

' Database replication
Rel(main_database, replica_database, "Data replication", "PostgreSQL Streaming")

' Styling
UpdateElementStyle(frontend_app, $bgColor="#61DAFB", $fontColor="#000000")
UpdateElementStyle(api_service, $bgColor="#CE422B", $fontColor="#FFFFFF")
UpdateElementStyle(registry_contract, $bgColor="#9C27B0", $fontColor="#FFFFFF")
UpdateElementStyle(token_contract, $bgColor="#4CAF50", $fontColor="#FFFFFF")
UpdateElementStyle(trading_contract, $bgColor="#2196F3", $fontColor="#FFFFFF")
UpdateElementStyle(oracle_contract, $bgColor="#FF9800", $fontColor="#FFFFFF")
UpdateElementStyle(governance_contract, $bgColor="#E91E63", $fontColor="#FFFFFF")

@enduml
```

## Key Architectural Decisions

### 1. Blockchain Choice: Solana
- **Fast Transaction Processing**: Sub-second confirmation times
- **Low Transaction Costs**: Fractions of a penny per transaction
- **High Throughput**: 50,000+ TPS capability
- **Energy Efficiency**: Proof-of-History consensus mechanism

### 2. Multi-Program Architecture
- **Separation of Concerns**: Each program handles specific functionality
- **Modularity**: Programs can be upgraded independently
- **Security**: Reduced attack surface per program
- **Scalability**: Parallel execution capabilities

### 3. Modern Frontend Stack
- **React 19**: Latest React features for optimal performance
- **TypeScript**: Type safety and better developer experience
- **Gill SDK**: Modern Solana development toolkit
- **Code Generation**: Automated client generation from IDL files

### 4. Production-Ready Infrastructure
- **Container Orchestration**: Kubernetes for scalability and reliability
- **Database Clustering**: PostgreSQL with TimescaleDB for time-series data
- **Caching Strategy**: Redis for performance optimization
- **Monitoring Stack**: Prometheus and Grafana for observability

### 5. Security Considerations
- **Proof-of-Authority**: University-controlled governance model
- **REC Validation**: Engineering Department authority for renewable certificates
- **Identity Verification**: Multi-level user verification system
- **Transaction Signing**: Client-side wallet integration for security

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS | User interface and experience |
| **API Gateway** | Rust, Actix-Web | Request routing and middleware |
| **Blockchain** | Solana, Anchor Framework | Smart contract execution |
| **Database** | PostgreSQL, TimescaleDB | Data persistence and analytics |
| **Cache** | Redis | Performance optimization |
| **Monitoring** | Prometheus, Grafana | System observability |
| **Deployment** | Docker, Kubernetes | Container orchestration |
| **Wallet Integration** | Gill SDK, Multiple Wallets | Transaction signing |

This C4 model provides a comprehensive view of the GridTokenX system architecture, from high-level system context down to deployment details, facilitating understanding for stakeholders, developers, and system administrators.