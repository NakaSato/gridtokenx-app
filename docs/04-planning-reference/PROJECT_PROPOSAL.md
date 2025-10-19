# การพัฒนาระบบจำลองการซื้อขายพลังงานแสงอาทิตย์แบบ Peer-to-Peer ด้วย Solana Smart Contract (Anchor Framework)

## หัวข้อโครงงาน (Project Title)
**"Development of Peer-to-Peer Solar Energy Trading Simulation System using Solana Smart Contract (Anchor Framework Permissioned Environments)"**

**หัวข้อภาษาไทย:** "การพัฒนาระบบจำลองการซื้อขายพลังงานแสงอาทิตย์แบบ Peer-to-Peer ด้วย Solana Smart Contract (Anchor Framework Permissioned Environments)"

## ข้อมูลเบื้องต้นของโครงงาน (Project Information)

### **สาขาวิชาที่เกี่ยวข้อง (Applicable Fields)**
วิศวกรรมคอมพิวเตอร์, วิทยาการคอมพิวเตอร์, เทคโนโลยีสารสนเทศ, และสาขาที่เกี่ยวข้องกับการพัฒนาระบบพลังงานและบล็อกเชน

### **ประเภทโครงงาน (Project Type)**
โครงงานพัฒนาระบบต้นแบบและจำลองสถานการณ์ (Prototype and Simulation System Development)

### **คำสำคัญ (Keywords)**
Solana, Anchor Framework, P2P Energy Trading, SPL Token, Smart Contract, AMI Simulator, Blockchain Simulation, University Campus, Solar Energy, Permissioned Environments

### **ระดับของโครงงาน (Project Complexity)**
**สูง (Advanced):** โครงงานนี้ต้องการความเข้าใจในเทคโนโลยีบล็อกเชนขั้นสูง (Solana), การพัฒนา Smart Contract ด้วย Anchor Framework, และสถาปัตยกรรมระบบแบบ Full-Stack

## ภาพรวมของโครงงาน (Project Overview)

โครงงานนี้นำเสนอการพัฒนาระบบจำลองการซื้อขายพลังงานแสงอาทิตย์แบบ Peer-to-Peer (P2P) ภายในมหาวิทยาลัย เพื่อตอบสนองต่อความต้องการในการจัดการพลังงานส่วนเกินที่ผลิตได้จากแผงโซลาร์เซลล์อย่างมีประสิทธิภาพและโปร่งใส ระบบดั้งเดิมมักมีข้อจำกัดในด้านความล่าช้า ค่าใช้จ่ายสูง และการขาดความโปร่งใสในการทำธุรกรรม โครงงานนี้จึงมุ่งแก้ไขปัญหาดังกล่าวโดยใช้เทคโนโลยีบล็อกเชนเพื่อสร้างตลาดพลังงานที่น่าเชื่อถือและเข้าถึงได้ง่ายสำหรับบุคลากรในมหาวิทยาลัย

หัวใจหลักของระบบคือการใช้ Solana Blockchain และ Anchor Framework ในการพัฒนา Smart Contracts ที่มีความปลอดภัยและประสิทธิภาพสูง เพื่อสร้างตลาดซื้อขายพลังงานอัตโนมัติ ผู้ใช้ (นักศึกษา, อาจารย์, บุคลากร) สามารถซื้อและขายพลังงานแสงอาทิตย์ส่วนเกินได้โดยตรงผ่านแพลตฟอร์ม โดยใช้ SPL Token ที่สร้างขึ้นเพื่อเป็นตัวแทนของหน่วยพลังงาน (1 GRID = 1 kWh) ระบบทั้งหมดจะทำงานบนเครือข่าย Solana แบบ **Permissioned Environments** (สภาพแวดล้อมที่ควบคุมการเข้าถึง) ที่ควบคุมโดยมหาวิทยาลัยในฐานะผู้ตรวจสอบธุรกรรมเพียงรายเดียว (Single Validator Authority) ซึ่งช่วยให้สามารถควบคุมสภาพแวดล้อมการจำลอง, จำกัดการเข้าถึงเฉพาะผู้ใช้ที่ได้รับอนุญาต, ลดค่าใช้จ่ายในการทำธุรกรรม, และรับประกันความเร็วในการประมวลผล

นอกเหนือจากด้านเทคนิคแล้ว โครงงานนี้ยังนำเสนอแนวคิดด้านเศรษฐศาสตร์สมัยใหม่ผ่านการทำ **'Tokenization'** ซึ่งเป็นการแปลงสินทรัพย์ที่มีอยู่จริง (พลังงานแสงอาทิตย์ส่วนเกิน) ให้กลายเป็นสินทรัพย์ดิจิทัล (SPL Token) บนบล็อกเชน แนวคิดนี้ช่วยสร้าง **'สภาพคล่อง' (Liquidity)** ให้กับพลังงานที่แต่เดิมอาจสูญเปล่า ทำให้เกิดตลาดซื้อขายขนาดย่อม (Micro-economy) ภายในมหาวิทยาลัย ที่ซึ่งอุปสงค์และอุปทานสามารถกำหนดราคาพลังงานได้อย่างมีประสิทธิภาพ (Price Discovery) โดยไม่ต้องผ่านตัวกลาง สิ่งนี้ไม่เพียงแต่เป็นการลดต้นทุน แต่ยังเป็นการสร้างแรงจูงใจทางเศรษฐศาสตร์ (Economic Incentives) ให้ทุกคนในชุมชนหันมาให้ความสำคัญกับการผลิตและใช้พลังงานหมุนเวียนอย่างคุ้มค่าที่สุด

ผลลัพธ์ที่คาดหวังคือระบบต้นแบบที่ไม่ได้เป็นเพียงเครื่องมือสำหรับการซื้อขายพลังงาน แต่ยังเป็นแพลตฟอร์มเพื่อการเรียนรู้และวิจัยสำหรับนักศึกษาในสาขาวิศวกรรมคอมพิวเตอร์, พลังงาน, และเทคโนโลยีบล็อกเชน ช่วยให้นักศึกษาได้ทดลองและทำความเข้าใจกลไกตลาดพลังงานยุคใหม่ในสภาพแวดล้อมจริงที่ถูกจำลองขึ้น ส่งเสริมการใช้พลังงานสะอาดและสร้างนวัตกรรมที่ยั่งยืนภายในมหาวิทยาลัย

## บทคัดย่อ (Abstract)

โปรเจคนี้เป็นการพัฒนาระบบจำลองการซื้อขายพลังงานแสงอาทิตย์แบบ Peer-to-Peer (P2P Energy Trading Simulation System) โดยใช้ Solana Anchor Framework เป็นเครื่องมือหลักในการสร้าง Smart Contracts และ AMI Simulator เพื่อให้นักศึกษา อาจารย์ และบุคลากรในมหาวิทยาลัยสามารถศึกษาและทดลองระบบการซื้อขายพลังงานแสงอาทิตย์ส่วนเกินได้ในสภาพแวดล้อมที่จำลองขึ้น ผ่านระบบ **Permissioned Environments** ที่ควบคุมโดยมหาวิทยาลัยในฐานะ Single Validator Authority (PoA) เพื่อรับประกันความปลอดภัยและการควบคุมการเข้าถึง

### วัตถุประสงค์หลัก (Main Objectives)
1. **พัฒนาระบบจำลองด้วย Solana Anchor Framework**: สร้างระบบจำลอง P2P Energy Trading บน Solana ด้วย Anchor Programs ใน Permissioned Environments
2. **สร้าง Anchor Smart Contracts**: พัฒนา Smart Contracts ด้วย Anchor Framework พร้อม AMI Simulation และการควบคุมการเข้าถึง
3. **ออกแบบ SPL Token Economy Simulation**: สร้างระบบจำลองเศรษฐกิจ SPL Token สำหรับการแลกเปลี่ยนพลังงาน (1 GRID = 1 kWh) ในเครือข่ายที่ควบคุม
4. **พัฒนา Oracle System Simulation**: สร้างระบบจำลอง Oracle เพื่อเชื่อมต่อข้อมูลจาก AMI Simulator ด้วยความปลอดภัยสูง
5. **สร้าง Full-Stack Simulation Application**: พัฒนา API Gateway และ Frontend สำหรับการจำลองในมหาวิทยาลัยด้วย Permissioned Access Control

### เทคโนโลยีที่ใช้ (Technologies Used)

```mermaid
block-beta
    columns 6
    
    %% Frontend Technologies Layer
    block:frontend["Frontend Technologies"]:6
        columns 6
        react["React 18<br/>TypeScript"] vite["Vite<br/>Build Tool"] tailwind["Tailwind CSS<br/>Styling"] wallet["Solana Wallet<br/>Adapter"] playwright["Playwright<br/>Testing"] lighthouse["Lighthouse<br/>Performance"]
    end
    
    space:6
    
    %% Backend Technologies Layer  
    block:backend["Backend Technologies"]:6
        columns 6
        rust["Rust 2021<br/>Edition"] axum["Axum<br/>Web Framework"] sqlx["SQLx<br/>Database ORM"] jwt["JWT<br/>Authentication"] bcrypt["BCrypt<br/>Password Hashing"] redis["Redis<br/>Caching"]
    end
    
    space:6
    
    %% Blockchain Technologies Layer
    block:blockchain["Blockchain Technologies"]:6
        columns 6
        solana["Solana<br/>Blockchain"] anchor["Anchor 0.31.1<br/>Framework"] spl["SPL Token<br/>Standard"] web3js["Web3.js<br/>Client Library"] phantom["Phantom<br/>Wallet"] rpc["RPC<br/>Node"]
    end
    
    space:6
    
    %% Database Technologies Layer
    block:database["Database Technologies"]:6
        columns 6
        postgres["PostgreSQL 15<br/>Primary DB"] timescale["TimescaleDB<br/>Time Series"] uuid["UUID<br/>Primary Keys"] enum["PostgreSQL<br/>Enums"] migrations["Database<br/>Migrations"] indexing["Database<br/>Indexing"]
    end
    
    space:6
    
    %% Development Technologies Layer
    block:devtools["Development Tools"]:6
        columns 6
        docker["Docker<br/>Containers"] compose["Docker<br/>Compose"] git["Git<br/>Version Control"] github["GitHub<br/>Repository"] vscode["VS Code<br/>IDE"] cargo["Cargo<br/>Rust Package Manager"]
    end
    
    space:6
    
    %% Simulation Technologies Layer
    block:simulation["Simulation Technologies"]:6
        columns 6
        python["Python<br/>AMI Simulator"] numpy["NumPy<br/>Calculations"] pandas["Pandas<br/>Data Processing"] json["JSON<br/>Data Format"] restapi["REST API<br/>Integration"] websocket["WebSocket<br/>Events"]
    end
    
    space:6
    
    %% Security Technologies Layer
    block:security["Security Technologies"]:6
        columns 6
        tls["TLS/SSL<br/>Encryption"] cors["CORS<br/>Protection"] helmet["Security<br/>Headers"] rate["Rate<br/>Limiting"] validation["Input<br/>Validation"] audit["Audit<br/>Logging"]
    end
    
    space:6
    
    %% Monitoring Technologies Layer
    block:monitoring["Monitoring Technologies"]:6
        columns 6
        prometheus["Prometheus<br/>Metrics"] grafana["Grafana<br/>Visualization"] health["Health<br/>Checks"] logs["Structured<br/>Logging"] alerts["Alert<br/>Manager"] tracing["Request<br/>Tracing"]
    end
    
    %% Styling for different technology categories
    classDef frontendStyle fill:#61dafb,stroke:#20232a,stroke-width:2px,color:#20232a
    classDef backendStyle fill:#ce422b,stroke:#8b0000,stroke-width:2px,color:#ffffff
    classDef blockchainStyle fill:#9945ff,stroke:#14f195,stroke-width:2px,color:#ffffff
    classDef databaseStyle fill:#336791,stroke:#003d5c,stroke-width:2px,color:#ffffff
    classDef devtoolsStyle fill:#2496ed,stroke:#0366d6,stroke-width:2px,color:#ffffff
    classDef simulationStyle fill:#3776ab,stroke:#ffd43b,stroke-width:2px,color:#ffffff
    classDef securityStyle fill:#ff6b6b,stroke:#c92a2a,stroke-width:2px,color:#ffffff
    classDef monitoringStyle fill:#ff8f00,stroke:#e65100,stroke-width:2px,color:#ffffff
    
    class react,vite,tailwind,wallet,playwright,lighthouse frontendStyle
    class rust,axum,sqlx,jwt,bcrypt,redis backendStyle
    class solana,anchor,spl,web3js,phantom,rpc blockchainStyle
    class postgres,timescale,uuid,enum,migrations,indexing databaseStyle
    class docker,compose,git,github,vscode,cargo devtoolsStyle
    class python,numpy,pandas,json,restapi,websocket simulationStyle
    class tls,cors,helmet,rate,validation,audit securityStyle
    class prometheus,grafana,health,logs,alerts,tracing monitoringStyle
```

**หมวดหมู่เทคโนโลยีหลัก (Main Technology Categories):**

- **Frontend Technologies**: React 18 with TypeScript, Vite build system, Tailwind CSS styling, และ Solana wallet integration
- **Backend Technologies**: Rust 2021 Edition, Axum web framework, SQLx ORM, JWT authentication, และ Redis caching
- **Blockchain Technologies**: Solana blockchain platform, Anchor Framework 0.31.1, SPL Token standard, และ Web3.js client library
- **Database Technologies**: PostgreSQL 15 primary database, TimescaleDB for time-series data, UUID primary keys, และ enum types
- **Development Tools**: Docker containerization, Git version control, VS Code IDE, และ Cargo package manager
- **Simulation Technologies**: Python AMI simulator, NumPy calculations, REST API integration, และ real-time WebSocket events
- **Security Technologies**: TLS encryption, CORS protection, input validation, และ comprehensive audit logging
- **Monitoring Technologies**: Prometheus metrics, Grafana visualization, health monitoring, และ distributed tracing

### สถาปัตยกรรมระบบ (System Architecture)
```mermaid
graph TB

  subgraph "Frontend Layer"
    direction LR
    UI["React Frontend<br/>(TypeScript + Vite)<br/>- Dashboard<br/>- Trading Interface<br/>- Wallet Integration"]
  end
  
  subgraph "Backend Layer"
    direction TB
    API["API Gateway<br/>(Rust + Axum)<br/>- Authentication<br/>- User Management<br/>- Transaction Processing"]
    subgraph "Data Stores"
        direction LR
        DB1[("PostgreSQL<br/>Users & Config")]
        DB2[("TimescaleDB<br/>Energy Data")]
        REDIS[("Redis<br/>Cache & Sessions")]
    end
  end
  
  subgraph "Simulation Layer"
    direction LR
    AMI_SIM["AMI Simulator<br/>(Python)<br/>- Energy Data Generation<br/>- 15-minute intervals<br/>- 50 campus meters"]
  end
  
  subgraph "Solana Blockchain (Permissioned)"
    direction TB
    subgraph "Core Programs"
      direction LR
      ORACLE["Oracle Program<br/>- Data Validation<br/>- Market Triggers"]
      TOKEN["Energy Token<br/>(SPL Token)<br/>- GRID Token (1kWh=1GRID)"]
      TRADING["Trading Program<br/>- Order Book<br/>- Automated Clearing"]
    end
    subgraph "Management Programs"
      direction LR
      REGISTRY["Registry Program<br/>- User Registration<br/>- AMI Assignment"]
      GOV["Governance Program<br/>- System Administration<br/>- University Authority"]
    end
  end
  
  %% Main Data Flow Connections
  UI -.->|"User Requests"| API
  API -.->|"Response Data"| UI
  
  API -->|"Store User Data"| DB1
  API -->|"Store Energy Data"| DB2
  API -->|"Cache Sessions"| REDIS
  
  AMI_SIM -->|"Energy Readings<br/>POST /api/meter-reading"| API
  
  API -->|"Submit Transactions"| ORACLE
  API -->|"User Registration"| REGISTRY
  API -->|"Trading Operations"| TRADING
  
  %% Cross-Program Invocations (CPI)
  ORACLE ==>|"CPI: Mint/Burn Tokens"| TOKEN
  ORACLE ==>|"CPI: Update Market"| TRADING
  TRADING ==>|"CPI: Transfer Tokens"| TOKEN
  GOV ==>|"CPI: Admin Operations"| REGISTRY
  GOV ==>|"CPI: System Control"| ORACLE
  GOV ==>|"CPI: Market Management"| TRADING
  
  %% Internal connections within layers
  DB1 <-.-> DB2
  DB2 <-.-> REDIS
  ORACLE <-.->|"Program Communication"| TRADING
  REGISTRY <-.->|"User Verification"| TRADING
  
  %% Styling
  classDef frontend fill:#cde4ff,stroke:#4a90e2,stroke-width:3px,color:black
  classDef backend fill:#d7cde4,stroke:#5d3a9b,stroke-width:3px,color:black
  classDef database fill:#f0f0f0,stroke:#777,stroke-width:2px,color:black
  classDef simulation fill:#ffeacc,stroke:#f5a623,stroke-width:3px,color:black
  classDef solana fill:#d4edda,stroke:#28a745,stroke-width:3px,color:black

  class UI frontend
  class API backend
  class DB1,DB2,REDIS database
  class AMI_SIM simulation
  class ORACLE,TOKEN,TRADING,REGISTRY,GOV solana
  
  %% Arrow styling
  linkStyle 0 stroke:#4a90e2,stroke-width:2px,stroke-dasharray: 5 5
  linkStyle 1 stroke:#4a90e2,stroke-width:2px,stroke-dasharray: 5 5
  linkStyle 2 stroke:#5d3a9b,stroke-width:3px
  linkStyle 3 stroke:#5d3a9b,stroke-width:3px
  linkStyle 4 stroke:#5d3a9b,stroke-width:3px
  linkStyle 5 stroke:#f5a623,stroke-width:3px
  linkStyle 6 stroke:#28a745,stroke-width:3px
  linkStyle 7 stroke:#28a745,stroke-width:3px
  linkStyle 8 stroke:#28a745,stroke-width:3px
  linkStyle 9 stroke:#dc3545,stroke-width:4px
  linkStyle 10 stroke:#dc3545,stroke-width:4px
  linkStyle 11 stroke:#dc3545,stroke-width:4px
  linkStyle 12 stroke:#6c757d,stroke-width:4px
  linkStyle 13 stroke:#6c757d,stroke-width:4px
  linkStyle 14 stroke:#6c757d,stroke-width:4px
```
```

**หน้าที่ของแต่ละส่วน:**

1. **Registry Program**: จัดการการลงทะเบียนผู้ใช้และ AMI Simulation ด้วย Permissioned Access Control
2. **Energy Token Program**: SPL Token มาตรฐาน Solana สำหรับการจำลองซื้อขายพลังงานในเครือข่ายที่ควบคุม
3. **Trading Program**: ระบบจำลองตลาดการซื้อขายแบบ Order Book ที่มีการทำ Automated Clearing สำหรับผู้ใช้ที่ได้รับอนุญาต
4. **Oracle Program**: จำลองการเชื่อมต่อข้อมูลจาก AMI และทำ Market Clearing อัตโนมัติด้วยความปลอดภัยสูง
5. **Governance Program**: การจัดการระบบจำลองโดยมหาวิทยาลัยใน Permissioned Environment
6. **University AMI Simulator**: การจำลองการทำงานของ AMI ในมหาวิทยาลัยด้วยการควบคุมการเข้าถึง

### คุณสมบัติหลัก (Key Features)

```mermaid
mindmap
  root((P2P Energy Trading Features))
    Permissioned Environments
      Controlled Access Network
      Authorized Users Only
      University Authority Control
    Real-time Trading
      15-minute Market Epochs
      Automated Market Clearing
      Live Price Discovery
    Blockchain Integration
      Solana Anchor Framework
      SPL Token Economy
      Cross Program Invocation
    University Control
      Single Validator Authority
      Permissioned Network
      Zero Transaction Fees
    Simulation Environment
      AMI Data Generation
      Campus-wide Coverage
      50 Smart Meters
    User Experience
      React TypeScript UI
      Wallet Integration
      Real-time Dashboard
```

**รายละเอียดคุณสมบัติ:**
- **Permissioned Environments**: ระบบควบคุมการเข้าถึงเฉพาะผู้ใช้ที่ได้รับอนุญาตเท่านั้น
- การจำลองการซื้อขายพลังงานแบบ Real-time ทุก 15 นาที (Simulated Market Epoch)
- ระบบจำลอง Automated Market Clearing ด้วย Oracle Program
- การควบคุมโดยมหาวิทยาลัยในฐานะ Single Validator Authority
- ระบบจำลอง SPL Token Economy 1 kWh = 1 GRID Token (9 decimal precision)
- Cross Program Invocation (CPI) Communication ใน Anchor Framework
- RESTful API สำหรับ Integration กับ AMI Simulation Engine
- Responsive Web Interface สำหรับการจำลองและเรียนรู้
- **University Campus AMI Simulation**: เครื่องมือจำลอง AMI ในมหาวิทยาลัย
- **Simulation-to-Blockchain Integration**: การส่งข้อมูลจำลองเข้าสู่ Solana Anchor Programs

### ผลลัพธ์ที่คาดหวัง (Expected Outcomes)
1. ระบบจำลอง P2P Energy Trading บน Solana Anchor Framework ที่ทำงานได้จริงในมหาวิทยาลัย
2. เครื่องมือการเรียนรู้และวิจัยด้าน Blockchain และ Energy Trading สำหรับมหาวิทยาลัย
3. การเพิ่มประสิทธิภาพการเรียนการสอนด้าน Anchor Framework และ Smart Contract Development
4. ต้นแบบระบบจำลอง Solana Anchor สำหรับการนำไปใช้ในมหาวิทยาลัยอื่น ๆ
5. การศึกษาประสิทธิภาพของ Anchor Framework ใน Single Validator Architecture

### การประยุกต์ใช้ (Applications)
- เครื่องมือการเรียนการสอน Solana Anchor Framework ในมหาวิทยาลัย
- การวิจัยและพัฒนาระบบ Blockchain Simulation ในสถาบันการศึกษา
- ต้นแบบการจำลองสำหรับมหาวิทยาลัยอื่น ๆ ทั่วประเทศ
- โครงการ Smart Campus University Simulation
- การเรียนการสอน Blockchain, Anchor Framework และ Sustainability ในมหาวิทยาลัย


## ข้อมูลเพิ่มเติมสำหรับการนำเสนอ (Additional Information for Presentation)

### จุดเด่นของโปรเจค (Project Highlights)
1. **นวัตกรรม**: ใช้เทคโนโลยี Solana และ Anchor Framework ที่ทันสมัย
2. **ความปลอดภัย**: Anchor Programs ที่ผ่านการ Type-safe validation
3. **ประสิทธิภาพ**: ระบบ Real-time trading บน Solana high-performance blockchain
4. **ความยั่งยืน**: ส่งเสริมการใช้พลังงานหมุนเวียนในคณะวิศวกรรม
5. **การควบคุมโดยคณะวิศวกรรม**: Single Validator Authority ที่ชัดเจนและมีประสิทธิภาพ

### ความท้าทายที่แก้ไข (Challenges Addressed)
1. การขาดระบบการซื้อขายพลังงานที่โปร่งใส
2. ต้นทุนสูงในการซื้อขายผ่านตัวกลาง
3. การไม่มีระบบติดตามพลังงานหมุนเวียนแบบ Real-time
4. ปัญหาความน่าเชื่อถือในการซื้อขาย P2P

---

## Solana Permissioned Environments and Proof-of-Authority (PoA)

### What is a Solana Permissioned Environment?
While Solana is famous for its public, permissionless network (Mainnet), its underlying technology can also be used to create **permissioned (private) environments**. In a permissioned setup, access to the network is restricted. A central authority—in this case, the university—controls who can participate, validate transactions, and deploy smart contracts.

This is in direct contrast to the public Mainnet, where anyone can join, run a validator, and interact with the network.

### Your Project's Proof-of-Authority (PoA) Model
Your project's **"University Single Validator"** architecture is a perfect example of a Solana permissioned environment running on a **Proof-of-Authority (PoA)** consensus mechanism.

- **Single Authority**: The university acts as the sole, trusted validator for the entire network.
- **Proof-of-Authority**: Instead of relying on decentralized consensus (like Proof-of-Stake), the network's integrity is guaranteed by the reputation and authority of the university. All transactions are considered valid because the trusted authority says they are.

This model is ideal for enterprise, academic, and consortium applications where participants are known and trusted.

### Advantages for the University Case Study
Using a PoA permissioned environment offers significant advantages for this project:

1.  **Total Control & Governance**: The university has absolute control over the simulation. It can manage user access (students, faculty), authorize AMI registration, and oversee all trading activities.
2.  **Extreme Performance & Zero Latency**: With a single validator, there is no need for a time-consuming consensus process among multiple nodes. This results in near-instantaneous transaction finality, which is perfect for a real-time energy trading simulation.
3.  **No Transaction Costs**: Since the university runs the only validator, there are no "gas fees" for students and faculty to participate in the simulation. This removes financial barriers and encourages experimentation.
4.  **Data Privacy & Confidentiality**: All transaction data remains within the university's private network. It is not exposed to the public, ensuring the privacy of user data and energy consumption patterns.
5.  **Simplified Operations**: Setting up and maintaining a single-node validator is significantly less complex and costly than managing a distributed, multi-node network.

### The Centralization Trade-off
The primary trade-off for these benefits is **centralization**. The system's security and integrity depend entirely on the university's validator. For a public, global financial system, this would be a significant risk. However, for a controlled simulation and educational tool within a trusted institution, this is an acceptable and even desirable trade-off. The goal is not to create a trustless system but to build a high-performance, controlled sandbox for learning and research.

This PoA model provides the performance and control needed for the simulation while still leveraging the power and efficiency of Solana's core technology and the Anchor Framework for smart contract development.

---

## รายละเอียดเทคนิค AMI Integration

### University AMI Architecture
ระบบจำลอง AMI ในมหาวิทยาลัยประกอบด้วย:

#### 1. **Python Simulation Engine สำหรับมหาวิทยาลัย**
- จำลองการผลิตและใช้พลังงานแสงอาทิตย์จาก 170kW total solar capacity ทั่วมหาวิทยาลัย
- สร้างข้อมูลแบบ Real-time ทุก 15 นาที (Market Epoch)
- จำลองรูปแบบการใช้พลังงานของอาคารต่างๆ ในมหาวิทยาลัย
- ข้อมูล 50 AMI ทั่วมหาวิทยาลัย (UNIV_001 ถึง UNIV_050)

#### 2. **API Integration Layer สำหรับมหาวิทยาลัย**
- **RESTful API**: ส่งข้อมูลจาก AMI ไปยัง University API Gateway
- **Data Format**: JSON format ที่มี meter_id, energy_generated, energy_consumed, timestamp, university_authority
- **Authentication**: University API key และ digital signature verification

#### 3. **Solana Blockchain Data Flow**
```mermaid
graph TD
  subgraph "Data Source"
    A["<br><b>AMI Simulator</b><br>Generates energy data<br>"]
  end

  subgraph "Application Layer"
    B["<br><b>API Gateway</b><br>Receives & validates data<br>"]
  end

  subgraph "Solana Blockchain"
    C["<br><b>Oracle Program</b><br>(Anchor)<br>Writes data to chain<br>"]
    D["<br><b>SPL Token Program</b><br>(Anchor)<br>Mints/Burns GRID tokens<br>"]
  end

  A -->|API| B
  B -->|Submits Transaction| C
  C -->|CPI to mint tokens| D

  style A fill:#fcf3d9,stroke:#f2c649,stroke-width:2px,color:black
  style B fill:#e6f4ff,stroke:#57a8e9,stroke-width:2px,color:black
  style C fill:#dff0d8,stroke:#3c763d,stroke-width:2px,color:black
  style D fill:#dff0d8,stroke:#3c763d,stroke-width:2px,color:black
```

#### 4. **Data Processing Pipeline**
```mermaid
graph TD
  subgraph "Off-Chain (Simulation Layer)"
    A[/"<b>AMI Simulator</b><br>จำลองข้อมูลการใช้พลังงาน<br>"/]
  end

  subgraph "Application Layer (Backend)"
    B["<b>API Gateway</b><br>1. รับข้อมูลผ่าน REST API<br>2. ตรวจสอบความถูกต้อง<br>3. สร้างและส่ง Transaction ไปยัง Solana"]
  end

  subgraph "On-Chain (Solana Permissioned Network)"
    C["<b>Oracle Program (Anchor)</b><br>1. รับ Transaction จาก API Gateway<br>2. ประมวลผลข้อมูลมิเตอร์<br>3. เรียกใช้โปรแกรมอื่นผ่าน CPI"]
    D["<b>Energy Token Program (SPL)</b><br>สร้าง/เผา GRID Token ตามข้อมูลพลังงาน"]
    E["<b>Trading Program (Anchor)</b><br>อัปเดตข้อมูลในตลาดซื้อขาย"]
  end

  A -- "POST API" --> B
  B -- "ส่ง Transaction ไปยัง RPC Node" --> C
  C -- "CPI Call: Mint/Burn Tokens" --> D
  C -- "CPI Call: Update Market" --> E

  style A fill:#fcf3d9,stroke:#f2c649,stroke-width:2px,color:black
  style B fill:#e6f4ff,stroke:#57a8e9,stroke-width:2px,color:black
  style C fill:#dff0d8,stroke:#3c763d,stroke-width:2px,color:black
  style D fill:#dff0d8,stroke:#3c763d,stroke-width:2px,color:black
  style E fill:#dff0d8,stroke:#3c763d,stroke-width:2px,color:black
```

**ขั้นตอนการทำงาน:**
1.  **Data Generation**: `AMI Simulator` ที่ทำงานแบบ Off-Chain จะจำลองข้อมูลการผลิตและใช้พลังงานทุกๆ 15 นาที
2.  **API Call**: Simulator ส่งข้อมูลที่ได้ไปยัง `API Gateway` ผ่าน RESTful API endpoint
3.  **Validation & Transaction Submission**: `API Gateway` ตรวจสอบความถูกต้องของข้อมูล จากนั้นสร้างและลงนามใน Transaction ของ Solana แล้วส่งไปยัง RPC Node
4.  **Oracle Processing**: `Oracle Program` บนบล็อกเชนรับ Transaction และทำหน้าที่เป็นประตูสู่ On-Chain โดยจะตรวจสอบและประมวลผลข้อมูล
5.  **Cross-Program Invocation (CPI)**: Oracle Program เรียกใช้โปรแกรมอื่น ๆ:
    *   เรียก `Energy Token Program` เพื่อสร้าง (Mint) `GRID` Token ให้กับผู้ผลิตพลังงาน หรือเผา (Burn) Token จากผู้ใช้พลังงาน
    *   เรียก `Trading Program` เพื่ออัปเดตสถานะของตลาด หรือเคลียร์คำสั่งซื้อขายที่ตรงกัน
6.  **State Update**: ข้อมูลบนบล็อกเชน (เช่น ยอดคงเหลือ Token, สถานะคำสั่งซื้อขาย) จะถูกอัปเดตและบันทึกอย่างถาวร

#### 5. **Cross-Program Invocation (CPI) Implementation**
```rust
// Oracle Program minting tokens via CPI to SPL Token Program
pub fn mint_energy_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
    let cpi_accounts = anchor_spl::token::MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.mint_authority.to_account_info(),
    };
    
    anchor_spl::token::mint_to(
        CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
        amount,
    )?;
    
    Ok(())
}
```

#### 6. **Frontend Wallet Integration**
```typescript
// React Frontend connecting to Solana blockchain
import { useWallet } from '@solana/wallet-adapter-react';
import * as anchor from '@coral-xyz/anchor';

const createSellOrder = async (energyAmount: number, pricePerKWh: number) => {
  const tx = await tradingProgram.methods
    .createSellOrder(
      new anchor.BN(energyAmount * 1e9), // 9 decimal precision
      new anchor.BN(pricePerKWh * 1e9)
    )
    .accounts({
      seller: publicKey,
      sellerTokenAccount: sellerTokenAccount,
      tradingAccount: tradingPda,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .transaction();
    
  const signature = await sendTransaction(tx, connection);
  return signature;
};
```

### ข้อมูลที่จำลอง (Simulated Data)

#### **University Energy Generation Data**
- ข้อมูลการผลิตพลังงานจาก 170kW total solar capacity ทั่วมหาวิทยาลัย
- รูปแบบการผลิตตามช่วงเวลา (เช้า-เย็น) แบบ Sine Curve
- ข้อมูลที่ปรับตามฤดูกาล และตารางการใช้งานของมหาวิทยาลัย

#### **University Energy Consumption Data**
- ข้อมูลการใช้พลังงานของอาคารต่างๆ ในมหาวิทยาลัย
- รูปแบบการใช้งานตามตารางการทำงานและการเรียนการสอน
- ข้อมูลการใช้เครื่องปรับอากาศ เครื่องมือต่างๆ และอุปกรณ์การเรียนการสอน

#### **University Campus AMI Metadata**
- Meter ID (UNIV_001 ถึง UNIV_050) และ Location ในอาคารต่าง ๆ ของมหาวิทยาลัย
- Owner Information (เชื่อมโยงกับ Registry Program)
- University Authority Signature (Single Validator Authority)
- Timestamp และ Digital Signature

#### **Campus Building Distribution**

```mermaid
graph TD
  subgraph "University Campus Layout"
    subgraph "Engineering Complex"
      ENG["Engineering Building<br/>METER_001 - METER_015<br/>15 AMI meters<br/>50kW Solar Array"]
    end
    
    subgraph "Science Complex"
      SCI["Science Building<br/>SCI_001 - SCI_012<br/>12 AMI meters<br/>35kW Solar Array"]
    end
    
    subgraph "Administration"
      ADM["Administration Building<br/>ADM_001 - ADM_008<br/>8 AMI meters<br/>25kW Solar Array"]
    end
    
    subgraph "Academic Support"
      LIB["Library Building<br/>LIB_001 - LIB_005<br/>5 AMI meters<br/>20kW Solar Array"]
    end
    
    subgraph "Student Housing"
      DORM["Student Dormitory<br/>DORM_001 - DORM_010<br/>10 AMI meters<br/>40kW Solar Array"]
    end
  end
  
  subgraph "Energy Distribution Summary"
    TOTAL["Total Campus Infrastructure<br/>50 AMI Meters<br/>170kW Total Solar Capacity<br/>Distributed Energy Trading Network"]
  end
  
  ENG --> TOTAL
  SCI --> TOTAL
  ADM --> TOTAL
  LIB --> TOTAL
  DORM --> TOTAL
  
  style ENG fill:#e8f5e8
  style SCI fill:#e1f5fe
  style ADM fill:#fff3e0
  style LIB fill:#f3e5f5
  style DORM fill:#fff8e1
  style TOTAL fill:#ffebee
```

**รายละเอียดการกระจายตัว:**
- **อาคารวิศวกรรม (Engineering Complex)**: METER_001 ถึง METER_015 (15 meters)
- **อาคารวิทยาศาสตร์ (Science Building)**: SCI_001 ถึง SCI_012 (12 meters)
- **อาคารบริหาร (Administration Building)**: ADM_001 ถึง ADM_008 (8 meters)
- **หอสมุด (Library Building)**: LIB_001 ถึง LIB_005 (5 meters)
- **หอพักนักศึกษา (Student Dormitory)**: DORM_001 ถึง DORM_010 (10 meters)

#### **Solar Panel Installation Distribution**
- **อาคารวิศวกรรม**: 50kW solar array บนหลังคา
- **อาคารวิทยาศาสตร์**: 35kW solar array บนหลังคา
- **อาคารบริหาร**: 25kW solar array บนหลังคา
- **หอสมุด**: 20kW solar array บนหลังคา
- **หอพักนักศึกษา**: 40kW solar array กระจายบนหลังคาแต่ละอาคาร

## ประโยชน์และนวัตกรรม (Benefits & Innovation)

### **ประโยชน์ต่อมหาวิทยาลัย**
1. **ลดค่าไฟฟ้า**: การซื้อขายภายในมหาวิทยาลัยลดการพึ่งพาระบบไฟฟ้าจากภายนอก
2. **ส่งเสริมพลังงานสะอาด**: จูงใจให้ติดตั้งแผงโซลาร์เซลล์ในมหาวิทยาลัย
3. **การศึกษาวิจัย**: เป็นแหล่งข้อมูลสำหรับการวิจัยด้าน Blockchain และพลังงาน
4. **ภาพลักษณ์**: แสดงความเป็นผู้นำด้านเทคโนโลยีสีเขียวของมหาวิทยาลัย
5. **การเรียนการสอน**: ใช้เป็นเครื่องมือการเรียนการสอนเรื่อง Blockchain

### **ข้อดีของ University Single Validator Architecture**
1. **ความปลอดภัย**: การควบคุมการเข้าถึงและการจัดการโดยมหาวิทยาลัยโดยตรง
2. **การจัดการที่ง่าย**: มีจุดควบคุมเดียวสำหรับการบริหารจัดการ
3. **ความเชื่อถือได้**: ระบบมีการตรวจสอบและควบคุมโดยมหาวิทยาลัย
4. **ประสิทธิภาพสูง**: Single validator ทำให้ transaction processing เร็วกว่า
5. **ต้นทุนต่ำ**: ลดต้นทุนการดำเนินงานเมื่อเทียบกับ multi-validator networks

### **นวัตกรรมทางเทคนิค**
1. **Solana + Anchor**: ใช้เทคโนโลยี Blockchain ประสิทธิภาพสูง
2. **Cross Program Invocation (CPI)**: Anchor Programs ที่ทำงานร่วมกัน
3. **Real-time AMI Integration**: การเชื่อมต่อข้อมูล AMI แบบเรียลไทม์
4. **SPL Token Standard**: มาตรฐาน Token ของ Solana ecosystem
5. **University Authority**: ระบบจัดการแบบ Single Validator เพื่อความปลอดภัยและควบคุม
6. **Docker-based Development Environment**: ระบบพัฒนาที่ใช้ Container สำหรับ Solana validator
7. **TypeScript Integration**: การใช้ Anchor IDL สำหรับ type-safe frontend development
8. **WebSocket Event Monitoring**: การติดตามเหตุการณ์บน blockchain แบบเรียลไทม์

## ความเป็นไปได้และความเสี่ยง (Feasibility & Risks)

### **ความเป็นไปได้**
- ✅ เทคโนโลยี Solana และ Anchor มีเอกสารและตัวอย่างเพียงพอ
- ✅ ทีมมีความรู้พื้นฐานด้าน Rust Programming และ Blockchain
- ✅ มีเวลาเพียงพอสำหรับการพัฒนา (1-2 เทอม)
- ✅ สามารถทดสอบได้ด้วย University Campus Simulation

## แผนการดำเนินงาน (Timeline)

```mermaid
gantt
    title P2P Energy Trading System Development Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: Study & Design
    Solana & Anchor Study     :done, study, 2024-09-01, 2024-09-28
    System Architecture       :done, arch, 2024-09-15, 2024-09-28
    Project Setup            :done, setup, 2024-09-22, 2024-09-28
    
    section Phase 2: Anchor Programs
    Registry Program         :done, registry, 2024-10-01, 2024-10-21
    Energy Token Program     :done, token, 2024-10-08, 2024-10-28
    Trading Program          :active, trading, 2024-10-15, 2024-11-11
    Oracle Program           :oracle, 2024-10-22, 2024-11-11
    Governance Program       :gov, 2024-10-29, 2024-11-11
    Testing & Integration    :test1, 2024-11-04, 2024-11-11
    
    section Phase 3: Backend & API
    API Gateway              :done, api, 2024-11-12, 2024-12-09
    AMI Simulator           :sim, 2024-11-19, 2024-12-09
    Database & Models       :done, db, 2024-11-26, 2024-12-09
    API Testing             :active, apitest, 2024-12-03, 2024-12-09
    
    section Phase 4: Frontend
    React Application       :frontend, 2024-12-10, 2025-01-06
    UI/UX Design           :design, 2024-12-10, 2024-12-24
    Trading Dashboard      :dashboard, 2024-12-17, 2025-01-06
    Responsive Design      :responsive, 2024-12-31, 2025-01-06
    
    section Phase 5: Integration & Testing
    System Integration     :integration, 2025-01-07, 2025-01-27
    Performance Testing    :performance, 2025-01-14, 2025-01-27
    Security Testing       :security, 2025-01-21, 2025-01-27
    
    section Phase 6: Presentation
    Documentation         :docs, 2025-01-28, 2025-02-03
    Demo Preparation      :demo, 2025-01-28, 2025-02-03
```

### **Phase 1: การศึกษาและออกแบบ (4 สัปดาห์)**
- ศึกษา Solana และ Anchor Framework
- ออกแบบ System Architecture และ Database Schema สำหรับคณะวิศวกรรม
- สร้าง Project Setup และ Development Environment

### **Phase 2: การพัฒนา Anchor Programs (6 สัปดาห์)**
- พัฒนา Registry Program สำหรับ University authority
- พัฒนา Energy Token Program (SPL Token)
- พัฒนา Trading Program with automated clearing
- พัฒนา Oracle Program สำหรับ AMI integration
- พัฒนา Governance Program สำหรับ University
- Unit Testing และ Integration Testing
- **สถานะปัจจุบัน**: ✅ โครงสร้าง Anchor Programs พื้นฐานเสร็จแล้ว
- **การทดสอบ**: ✅ Docker-based development environment พร้อมใช้งาน

### **Phase 3: การพัฒนา Backend และ API (4 สัปดาห์)**
- สร้าง Rust API Gateway ด้วย Axum สำหรับ University
- พัฒนา University Campus AMI Simulator
- สร้าง Database Schema และ Data Models
- API Testing และ Documentation
- **สถานะปัจจุบัน**: ✅ API Gateway พร้อมใช้งาน พร้อม authentication system
- **การรวมระบบ**: ✅ Database migrations และ user management เสร็จสมบูรณ์
- **การพัฒนาล่าสุด**: ✅ Enhanced user management APIs และ audit logging

### **Phase 4: การพัฒนา Frontend (4 สัปดาห์)**
- สร้าง React TypeScript Application สำหรับมหาวิทยาลัย
- ออกแบบ UI/UX สำหรับ University Energy Trading
- สร้าง Dashboard สำหรับติดตามการซื้อขายในมหาวิทยาลัย
- Responsive Design และ Testing

### **Phase 5: การรวมระบบและทดสอบ (3 สัปดาห์)**
- Integration Testing ทั้งระบบบน University validator
- Performance Testing สำหรับ Single Validator Architecture
- Security Testing สำหรับ University authority
- Bug Fixes และ Optimization

### **Phase 6: การเตรียมนำเสนอ (1 สัปดาห์)**
- สร้างเอกสารโครงงานที่สมบูรณ์
- เตรียม Presentation และ Demo ระบบ Solana
- Video Demonstration ใน University Campus context

## เกณฑ์การประเมินผล (Evaluation Criteria)

### **เกณฑ์ทางเทคนิค (70%)**
1. **Anchor Programs (25%)**: ความถูกต้องและประสิทธิภาพของ Solana programs
2. **System Integration (20%)**: การทำงานร่วมกันของส่วนต่าง ๆ บน Solana
3. **User Interface (15%)**: ความใช้งานง่ายและสวยงามสำหรับผู้ใช้ในมหาวิทยาลัย
4. **Code Quality (10%)**: การเขียนโค้ด Rust ที่ดี มี Documentation

### **เกณฑ์การนำเสนอ (30%)**
1. **การนำเสนอ (15%)**: ความชัดเจนและน่าสนใจของ Solana implementation
2. **การตอบคำถาม (10%)**: ความเข้าใจในโครงงานและเทคโนโลยี Solana
3. **เอกสาร (5%)**: ความสมบูรณ์ของเอกสารและ University context

### การพัฒนาในอนาคต (Future Development)
1. **Multi-Department Expansion**: การขยายไปยังคณะอื่น ๆ ด้วย Multi-Validator Federation
2. **AI Energy Prediction**: ระบบ AI สำหรับทำนายการใช้พลังงานในมหาวิทยาลัย
3. **National Grid Integration**: การเชื่อมต่อกับระบบไฟฟ้าหลักของประเทศ
4. **Mobile Application**: แอปพลิเคชันมือถือสำหรับนักศึกษาและบุคลากร
5. **Real IoT Integration**: เชื่อมต่อกับ AMI จริงในมหาวิทยาลัย
6. **Solana DeFi Integration**: การรวมเข้ากับ Solana DeFi ecosystem
7. **Carbon Credit Trading**: รวมระบบ Carbon Credit Trading บน Solana
8. **Cross-Chain Bridges**: เชื่อมต่อกับ blockchain อื่น ๆ ผ่าน Solana bridges

## สถานะการพัฒนาปัจจุบัน (Current Development Status)

```mermaid
pie title Project Completion Status
    "Completed (✅)" : 65
    "In Progress (🔄)" : 25
    "Planned (📋)" : 10
```

```mermaid
timeline
    title Development Progress Timeline
    
    Week 1-2 : Infrastructure Setup
             : ✅ Docker Environment
             : ✅ Solana Validator
             : ✅ Database Design
             : ✅ API Gateway Foundation
    
    Week 3 : Authentication & User Management
           : ✅ JWT Authentication
           : ✅ Password Security
           : ✅ Role-based Access
           : ✅ Admin Endpoints
           : ✅ Audit Logging
    
    Week 4 : API Testing & Debugging
           : 🔄 Endpoint Validation
           : 🔄 Enum Casting Fixes
           : 🔄 JWT Middleware
           : 📋 Protected Routes
    
    Future : Integration & Frontend
           : 📋 Solana Integration
           : 📋 React Development
           : 📋 End-to-End Testing
```

### **เสร็จสมบูรณ์แล้ว (Completed) ✅**
- Docker-based Solana validator development environment
- Anchor CLI 0.31.1 installation และ configuration
- โครงสร้างพื้นฐาน Anchor Programs (Registry, Token, Trading, Oracle, Governance)
- Integration testing framework
- Docker Compose orchestration สำหรับ development environment
- **API Gateway Infrastructure**: Rust/Axum server พร้อม health endpoints
- **Authentication System**: JWT-based authentication พร้อม password hashing
- **Database Layer**: PostgreSQL, TimescaleDB และ Redis integration
- **User Management**: Enhanced registration, profile management และ admin controls
- **Security Features**: Role-based access control, audit logging, wallet management
- **Docker Containerization**: Multi-service architecture พร้อม environment configuration

### **กำลังดำเนินการ (In Progress) 🔄**
- Cross-Program Invocation (CPI) implementation
- Smart Meter Simulator integration
- Frontend React TypeScript development
- **Enum Casting Fixes**: แก้ไขปัญหา PostgreSQL enum type casting ใน API Gateway
- **Authentication API Testing**: การทดสอบ login/registration endpoints
- **Protected Endpoints**: การพัฒนา JWT middleware สำหรับ protected routes

### **วางแผนไว้ (Planned) 📋**
- Production deployment to Engineering Department validator
- Real AMI integration
- Performance optimization
- Security audit และ testing
- Documentation completion
- **Frontend Development**: React TypeScript application
- **Solana Integration**: เชื่อมต่อ API Gateway กับ Anchor Programs
- **Smart Meter Simulator**: การจำลอง AMI data generation
- **End-to-End Testing**: การทดสอบระบบครบวงจร

## ความก้าวหน้าล่าสุด (Recent Development Progress)

### **Week 1-2: Infrastructure และ Foundation (เสร็จสมบูรณ์) ✅**
- ✅ Docker-based development environment
- ✅ Solana validator และ Anchor CLI setup
- ✅ Database schema design และ migrations
- ✅ API Gateway infrastructure with Axum framework
- ✅ Health endpoints และ service monitoring

### **Week 3: Authentication และ User Management (เสร็จสมบูรณ์) ✅**
- ✅ JWT-based authentication system
- ✅ Password hashing และ verification (bcrypt)
- ✅ Role-based access control (student, faculty, admin)
- ✅ Enhanced user registration with department validation
- ✅ Wallet address management สำหรับ Solana integration
- ✅ Admin user management endpoints
- ✅ Audit logging system สำหรับ user activities
- ✅ Department-specific validation (Engineering Department focus)

### **Week 4: API Testing และ Debugging (กำลังดำเนินการ) 🔄**
- 🔄 Authentication endpoint testing
- 🔄 PostgreSQL enum type casting fixes
- 🔄 JWT middleware implementation
- 📋 Protected endpoints validation

### **Technical Achievements (สิ่งที่ทำได้แล้ว)**

```mermaid
graph LR
    subgraph "Architecture Layer"
        ARCH["🏗️ Modular Architecture<br/>Clean Separation<br/>Handlers, Services, Middleware"]
    end
    
    subgraph "Security Layer"
        SEC["🔒 Security Features<br/>Password Validation<br/>JWT Expiration<br/>Role-based Protection<br/>Input Sanitization"]
    end
    
    subgraph "Database Layer"
        DB["🗄️ Database Design<br/>PostgreSQL Enums<br/>UUID Primary Keys<br/>Audit Logging<br/>Proper Indexing"]
    end
    
    subgraph "Type Safety Layer"
        TYPE["⚡ Type Safety<br/>Rust Type System<br/>Validator Crate<br/>Comprehensive Validation"]
    end
    
    subgraph "Container Layer"
        DOCKER["🐳 Docker Integration<br/>Multi-service Orchestration<br/>Environment Configuration<br/>Production Ready"]
    end
    
    ARCH --> SEC
    SEC --> DB
    DB --> TYPE
    TYPE --> DOCKER
    
    style ARCH fill:#e8f5e8
    style SEC fill:#ffebee
    style DB fill:#e1f5fe
    style TYPE fill:#fff3e0
    style DOCKER fill:#f3e5f5
```

**รายละเอียดความสำเร็จ:**
1. **Modular Architecture**: Clean separation ระหว่าง handlers, services, และ middleware
2. **Type Safety**: Comprehensive validation ด้วย Rust type system และ validator crate
3. **Security Features**: 
   - Password strength validation
   - JWT token expiration handling
   - Role-based endpoint protection
   - Input sanitization และ validation
4. **Database Design**: 
   - PostgreSQL enum types สำหรับ roles
   - UUID primary keys
   - Audit logging table
   - Proper indexing strategy
5. **Docker Integration**: 
   - Multi-service orchestration
   - Environment-based configuration
   - Development และ production readiness

## ข้อท้าทายทางเทคนิคและการแก้ไข (Technical Challenges & Solutions)

### **3. ความท้าทายและการแก้ไขล่าสุด (Recent Challenges & Solutions)**
- **ปัญหา**: PostgreSQL enum type casting ใน Rust SQLx
- **แก้ไข**: ใช้ `::text` casting ใน SELECT queries และ `($param)::user_role` ใน INSERT queries
- **ผลลัพธ์**: Authentication endpoints ทำงานได้ปกติ

### **4. การทดสอบปัจจุบัน (Current Testing Status)**
```bash
# Health endpoints - ✅ ทำงานปกติ
curl http://localhost:8080/health
curl http://localhost:8080/health/ready
curl http://localhost:8080/health/live

# Authentication endpoints - 🔄 กำลังแก้ไข enum casting
curl -X POST http://localhost:8080/auth/register -H "Content-Type: application/json" -d @register.json
curl -X POST http://localhost:8080/auth/login -H "Content-Type: application/json" -d @login.json
```

### **5. ARM64 Compatibility Issues**
- **ปัญหา**: Solana CLI และ validator มีปัญหาบน ARM64 Mac (Apple Silicon)
- **แก้ไข**: ใช้ Docker container development environment และ fallback เป็น dev mode

### **2. Anchor Framework Learning Curve**
- **ปัญหา**: ความซับซ้อนของ Anchor และ Solana development
- **แก้ไข**: การศึกษาเอกสาร step-by-step และ hands-on development

### **3. Cross-Program Communication**
- **ปัญหา**: การออกแบบ CPI calls ระหว่าง Anchor programs
- **แก้ไข**: ใช้ Anchor CPI framework และ type-safe interfaces

## รายละเอียดการ Implementation ปัจจุบัน (Current Implementation Details)

### **1. API Gateway Architecture (เสร็จสมบูรณ์)**
```
api-gateway/
├── src/
│   ├── main.rs              # Server setup และ routing
│   ├── config.rs            # Configuration management
│   ├── database.rs          # Database connections
│   ├── handlers/            # API endpoint handlers
│   │   ├── health.rs        # Health check endpoints
│   │   ├── auth.rs          # Authentication handlers
│   │   └── user_management.rs # Enhanced user management
│   ├── middleware/          # Custom middleware
│   ├── models/              # Data models
│   ├── services/            # Business logic
│   ├── auth/                # Authentication & authorization
│   │   ├── jwt.rs           # JWT token management
│   │   ├── password.rs      # Password hashing/verification
│   │   └── middleware.rs    # Auth middleware
│   ├── utils/               # Utility functions
│   └── error.rs             # Error handling
├── migrations/              # Database migrations
└── Dockerfile              # Container configuration
```

### **2. Database Schema (พร้อมใช้งาน)**
```sql
-- Users table with enum types
CREATE TYPE user_role AS ENUM ('student', 'faculty', 'admin');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255),
    password_hash VARCHAR(255),
    role user_role NOT NULL,
    department VARCHAR(100) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    wallet_address VARCHAR(44),
    blockchain_registered BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logging table
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **3. Anchor Programs Architecture**
```
programs/
├── registry/          # User and meter registration under Engineering authority
├── energy-token/      # SPL Token implementation for GRID tokens
├── trading/          # Order book and automated market clearing
├── oracle/           # AMI data integration and market triggers
└── governance/       # Engineering Department system administration
```

### **4. Docker Services Configuration (เสร็จสมบูรณ์)**
```yaml
# docker-compose.yml - Multi-service architecture
services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: p2p_energy_trading
      POSTGRES_USER: p2p_user
      POSTGRES_PASSWORD: p2p_password
    ports: ["5432:5432"]

  # TimescaleDB for time-series data
  timescaledb:
    image: timescale/timescaledb:latest-pg15
    environment:
      POSTGRES_DB: energy_timeseries
      POSTGRES_USER: timescale_user
      POSTGRES_PASSWORD: timescale_password
    ports: ["5433:5432"]

  # Redis for caching
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  # API Gateway
  api-gateway:
    build: ./api-gateway
    ports: ["8080:8080"]
    depends_on: [postgres, timescaledb, redis]
    environment:
      DATABASE_URL: postgresql://p2p_user:p2p_password@postgres/p2p_energy_trading
      TIMESCALE_URL: postgresql://timescale_user:timescale_password@timescaledb/energy_timeseries
      REDIS_URL: redis://redis:6379

  # Solana Validator
  solana-validator:
    build: ./docker/solana-validator
    ports: ["8898:8899", "8901:8900"]
    volumes: [solana_ledger:/opt/solana/ledger]
```

### **5. Anchor Programs Architecture**
```bash
# Docker-based Solana validator
docker-compose up -d solana-validator

# Anchor CLI development
docker exec -it p2p-anchor-dev anchor --version
# Output: anchor-cli 0.31.1

# Test project creation
anchor init test-project --template=single --package-manager npm
```

### **6. Program Derived Addresses (PDAs)**
```rust
// Registry Program PDAs
#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(
        init,
        payer = authority,
        space = UserAccount::SIZE,
        seeds = [b"user", user.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,
    // ...
}
```

### **7. Token Economy Implementation**

```mermaid
graph TB
    subgraph "Token Standards"
        SPL["SPL Token Standard<br/>Solana Program Library<br/>9 Decimal Precision"]
    end
    
    subgraph "Token Economics"
        GRID["GRID Token<br/>1 kWh = 1 GRID<br/>Energy Representation"]
        MINT["Mint Authority<br/>Oracle Program Control<br/>University Governance"]
    end
    
    subgraph "Account Management"
        ATA["Associated Token Accounts<br/>User-specific Accounts<br/>Automatic Creation"]
        WALLET["Wallet Integration<br/>Solana Wallet Adapter<br/>Phantom, Solflare Support"]
    end
    
    subgraph "Transaction Flow"
        PROD["Energy Production<br/>Solar Generation<br/>Token Minting"]
        CONS["Energy Consumption<br/>Usage Tracking<br/>Token Burning"]
        TRADE["P2P Trading<br/>Order Matching<br/>Token Transfer"]
    end
    
    SPL --> GRID
    GRID --> MINT
    MINT --> ATA
    ATA --> WALLET
    
    PROD --> GRID
    CONS --> GRID
    TRADE --> GRID
    
    style SPL fill:#e8f5e8,color:#000
    style GRID fill:#fff3e0,color:#000
    style MINT fill:#ffebee,color:#000
    style ATA fill:#e1f5fe,color:#000
    style WALLET fill:#f3e5f5,color:#000
    style PROD fill:#e8f5e8,color:#000
    style CONS fill:#ffebee,color:#000
    style TRADE fill:#fff8e1,color:#000
```

**รายละเอียดการใช้งาน:**
- **GRID Token**: SPL Token มาตรฐาน Solana (9 decimal precision)
- **1 kWh = 1 GRID Token**: การแทนค่าพลังงานด้วย token
- **Mint Authority**: ควบคุมโดย Engineering Department ผ่าน Oracle Program
- **Associated Token Accounts**: การจัดการ token accounts สำหรับแต่ละผู้ใช้

### **API Integration Points ล่าสุด (Updated API Endpoints)**
```typescript
// Health and Status endpoints
GET  /health                         // Basic health check
GET  /health/ready                   // Readiness check with dependencies
GET  /health/live                    // Liveness check

// Authentication endpoints (เสร็จสมบูรณ์)
POST /auth/login                     // User authentication
POST /auth/register                  // Basic user registration
POST /auth/register/enhanced         // Enhanced registration with validation

// Protected user endpoints (พร้อมใช้งาน)
GET  /auth/profile                   // Get user profile
POST /auth/profile                   // Update user profile
POST /auth/password                  // Change password

// Enhanced user management (API ใหม่)
POST /user/wallet                    // Update wallet address
DELETE /user/wallet                  // Remove wallet address
GET  /user/activity                  // Get user activity log

// Admin endpoints (ผู้ดูแลระบบ)
GET  /users/:id                      // Get specific user
PUT  /users/:id                      // Admin update user
POST /users/:id/deactivate           // Deactivate user account
POST /users/:id/reactivate           // Reactivate user account
GET  /users/:id/activity             // Get user activity (admin)
GET  /users/                         // List all users

// Department information (สาธารณะ)
GET  /departments/:department        // Get department info and validation

// Future energy trading endpoints (วางแผนไว้)
POST /api/engineering/meter-reading  // AMI data submission
GET  /api/trading/orders            // Current market orders
POST /api/trading/sell-order        // Create sell order
POST /api/trading/buy-order         // Create buy order
GET  /api/user/balance             // User token balance
```

### **8. Real-time Event Processing**
```rust
// WebSocket subscriptions for blockchain events
let (mut logs_subscription, logs_receiver) = pubsub_client
    .logs_subscribe(
        RpcTransactionLogsFilter::Mentions(vec![
            registry_program_id.to_string(),
            trading_program_id.to_string(),
        ]),
        RpcTransactionLogsConfig {
            commitment: Some(CommitmentConfig::confirmed()),
        },
    )
    .await?;
```

---

## เอกสารอ้างอิง และเอกสารที่เกี่ยวข้อง (Project Documentation References)

### **เอกสารหลักของโปรเจค (Core Project Documentation)**

#### **1. โครงสร้างและสถาปัตยกรรม (Architecture & Structure)**
- **[README.md](../README.md)**: เอกสารหลักของโปรเจค พร้อมคำแนะนำการติดตั้งและใช้งาน
- **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)**: สถาปัตยกรรมระบบโดยรวม และการออกแบบ Solana Anchor Programs
- **[TECHNICAL_SUMMARY.md](./TECHNICAL_SUMMARY.md)**: สรุปเทคนิคและเทคโนโลยีที่ใช้ในโปรเจค
- **[PROJECT_STRUCTURE_PLAN.md](./plan/PROJECT_STRUCTURE_PLAN.md)**: แผนการจัดองค์กรโครงสร้างโปรเจค

#### **2. การพัฒนา API Gateway และ Backend (API Gateway & Backend Development)**
- **[API_GATEWAY_SPECIFICATION.md](./API_GATEWAY_SPECIFICATION.md)**: รายละเอียด API endpoints และการออกแบบ Rust/Axum server
- **[API_GATEWAY_DEVELOPMENT_PLAN.md](./plan/API_GATEWAY_DEVELOPMENT_PLAN.md)**: แผนการพัฒนา API Gateway และ authentication system

#### **3. Blockchain และ Smart Contracts (Blockchain & Smart Contracts)**
- **[README-ANCHOR.md](./README-ANCHOR.md)**: คู่มือการใช้งาน Solana Anchor Framework และ smart contract development
- **[BLOCKCHAIN_CONSENSUS.md](./BLOCKCHAIN_CONSENSUS.md)**: รายละเอียดการทำงานของ Solana consensus และ single validator architecture
- **[contracts-diagram.md](./contracts-diagram.md)**: แผนภาพและการเชื่อมต่อระหว่าง Anchor Programs

#### **4. AMI Simulation และ Data Flow (AMI & Data Processing)**
- **[SMART_METER_SIMULATION.md](./SMART_METER_SIMULATION.md)**: รายละเอียดการจำลอง AMI และ AMI integration
- **[transaction-flow-example.md](./transaction-flow-example.md)**: ตัวอย่างการไหลของข้อมูลและ transactions ในระบบ

#### **5. แผนการดำเนินงานและติดตาม (Timeline & Progress Tracking)**
- **[IMPLEMENTATION_TIMELINE.md](./plan/IMPLEMENTATION_TIMELINE.md)**: แผนการดำเนินงานรายละเอียดและ milestones
- **[CHANGELOG.md](./CHANGELOG.md)**: บันทึกการเปลี่ยนแปลงและความก้าวหน้าของโปรเจค

### **เอกสารส่วนประกอบเฉพาะ (Component-Specific Documentation)**

#### **6. Frontend Development**
- **[frontend/README-CAMPUS.md](../frontend/README-CAMPUS.md)**: คู่มือการพัฒนา React TypeScript frontend สำหรับ university campus interface
- **[docker/frontend/README.md](../docker/frontend/README.md)**: Docker configuration และ deployment สำหรับ frontend

#### **7. AMI Simulator**
- **[docker/smart-meter-simulator/README.md](../docker/smart-meter-simulator/README.md)**: Python-based AMI simulator และ data generation

#### **8. Development และ Operations**
- **[docs/README.md](./README.md)**: คู่มือการใช้งานเอกสารและ navigation
- **[.github/workflows/README.md](../.github/workflows/README.md)**: CI/CD pipeline และ automated testing workflows

### **การอ้างอิงแบบหมวดหมู่ (Categorical References)**

#### **📋 Planning & Design Documents**
```
docs/plan/
├── PROJECT_STRUCTURE_PLAN.md     # โครงสร้างโปรเจคและ module organization
├── API_GATEWAY_DEVELOPMENT_PLAN.md # แผนการพัฒนา API Gateway
└── IMPLEMENTATION_TIMELINE.md    # แผนการดำเนินงานและ milestones
```

#### **🏗️ Architecture & Technical Documents**
```
docs/
├── SYSTEM_ARCHITECTURE.md        # สถาปัตยกรรมระบบโดยรวม
├── TECHNICAL_SUMMARY.md          # สรุปเทคนิคและเทคโนโลยี
├── API_GATEWAY_SPECIFICATION.md  # รายละเอียด API design
├── BLOCKCHAIN_CONSENSUS.md       # Solana consensus mechanism
└── contracts-diagram.md          # Smart contract architecture
```

#### **⚡ Implementation & Integration Documents**
```
docs/
├── README-ANCHOR.md              # Solana Anchor development guide
├── SMART_METER_SIMULATION.md     # AMI และ AMI integration
├── transaction-flow-example.md   # ตัวอย่าง transaction flow
└── CHANGELOG.md                  # บันทึกการพัฒนาและ updates
```

#### **🐳 Docker & Deployment Documents**
```
docker/
├── frontend/README.md            # Frontend deployment
├── smart-meter-simulator/README.md # AMI simulator setup
└── */DEPLOYMENT.md               # Deployment instructions
```

### **ลำดับการอ่านเอกสารที่แนะนำ (Recommended Reading Order)**

#### **สำหรับผู้เริ่มต้น (Beginners)**
1. **[README.md](../README.md)** - เริ่มต้นที่นี่
2. **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - เข้าใจ architecture โดยรวม
3. **[README-ANCHOR.md](./README-ANCHOR.md)** - ทำความเข้าใจ Solana Anchor
4. **[API_GATEWAY_SPECIFICATION.md](./API_GATEWAY_SPECIFICATION.md)** - API design และ endpoints

#### **สำหรับนักพัฒนา (Developers)**
1. **[TECHNICAL_SUMMARY.md](./TECHNICAL_SUMMARY.md)** - เทคโนโลยีที่ใช้
2. **[contracts-diagram.md](./contracts-diagram.md)** - Smart contract relationships
3. **[SMART_METER_SIMULATION.md](./SMART_METER_SIMULATION.md)** - Data flow และ integration
4. **[docker/*/README.md](../docker/)** - Development environment setup

#### **สำหรับการบริหารโปรเจค (Project Management)**
1. **[IMPLEMENTATION_TIMELINE.md](./plan/IMPLEMENTATION_TIMELINE.md)** - Timeline และ progress
2. **[PROJECT_STRUCTURE_PLAN.md](./plan/PROJECT_STRUCTURE_PLAN.md)** - Organization structure
3. **[CHANGELOG.md](./CHANGELOG.md)** - Change tracking
4. **[API_GATEWAY_DEVELOPMENT_PLAN.md](./plan/API_GATEWAY_DEVELOPMENT_PLAN.md)** - Development planning

### **เอกสารภายนอกและแหล่งข้อมูลอ้างอิง (External References)**

#### **เทคโนโลยี Solana และ Anchor Framework**
- **Solana Documentation**: https://docs.solana.com/
- **Anchor Framework Guide**: https://book.anchor-lang.com/
- **SPL Token Program**: https://spl.solana.com/token
- **Solana Web3.js**: https://solana-labs.github.io/solana-web3.js/

#### **การพัฒนา Rust และ Backend**
- **Axum Framework**: https://docs.rs/axum/latest/axum/
- **SQLx Documentation**: https://docs.rs/sqlx/latest/sqlx/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/

#### **Frontend และ User Interface**
- **React TypeScript**: https://react-typescript-cheatsheet.netlify.app/
- **Solana Wallet Adapter**: https://github.com/solana-labs/wallet-adapter
- **Vite Build Tool**: https://vitejs.dev/guide/

### **การติดต่อและการสนับสนุน (Contact & Support)**

#### **ทีมพัฒนา (Development Team)**
- **Project Lead**: ระบุรายละเอียดการติดต่อ
- **Blockchain Developer**: Solana/Anchor specialist
- **Backend Developer**: Rust/API Gateway specialist
- **Frontend Developer**: React/TypeScript specialist

#### **แหล่งข้อมูลเพิ่มเติม (Additional Resources)**
- **GitHub Repository**: https://github.com/[username]/p2p-energy-trading
- **Docker Hub**: Container images และ deployment guides
- **University Wiki**: Internal documentation และ resources

---

**หมายเหตุ**: เอกสารทั้งหมดได้รับการอัปเดตอย่างต่อเนื่องตามความก้าวหน้าของโปรเจค กรุณาตรวจสอบ [CHANGELOG.md](./CHANGELOG.md) สำหรับการเปลี่ยนแปลงล่าสุด
