# UTCC University GridTokenX Smart Meter Simulator
## IEEE 2030.5-2018 Smart Energy Profile 2.0

**🏫 UTCC University Smart Campus Energy Management System**

A production-ready smart meter simulator implementing IEEE 2030.5-2018 Smart Energy Profile 2.0 for UTCC University's 25-meter campus infrastructure.

## 🚀 Quick Start

```bash
# Validate environment
./quick-check.sh

# Deploy UTCC campus network (25 meters)
./deploy-utcc-campus.sh

# Monitor the campus network
./deploy-utcc-campus.sh status
./deploy-utcc-campus.sh logs
```

## 📁 Project Structure

```
smart-meter-simulator/
├── 🐍 Core Application
│   ├── campus_network_deployment.py    # Main 25-meter simulator
│   ├── generate_campus_certificates.py # TLS certificate generator
│   └── ieee2030_5/                     # IEEE 2030.5 implementation
├── ⚙️ Configuration
│   ├── config/utcc_campus_config.json  # 25 UTCC meter configuration
│   └── .env.example                    # Environment template
├── 🔐 TLS Certificates
│   └── certs/meters/                   # 25 UTCC meter certificates
├── 🚀 Deployment
│   ├── deploy-utcc-campus.sh           # Main deployment script
│   └── quick-check.sh                  # Environment validation
├── 📚 Documentation
│   └── README.md                       # This file
└── 📦 Dependencies
    ├── pyproject.toml                  # UV project configuration
    └── uv.lock                         # Locked dependencies
```

## Features

### 🔋 **Enhanced Energy Simulation**
- **Multiple Meter Types**: Solar Prosumers, Grid Consumers, Hybrid Systems, Battery Storage
- **Real-time Weather Impact**: Dynamic weather simulation affecting solar generation
- **Battery Management**: Intelligent battery charging/discharging simulation
- **Grid Integration**: Bi-directional energy flow with feed-in tariffs

### 💱 **P2P Trading Capabilities**
- **Trading Opportunities**: Real-time surplus/deficit matching
- **Dynamic Pricing**: Configurable buy/sell price preferences
- **Trading Strategies**: Conservative, Moderate, Aggressive trading behaviors
- **Market Analytics**: Comprehensive trading opportunity analysis

### 🌱 **Renewable Energy Certificates (REC)**
- **REC Generation**: Automatic REC eligibility determination
- **Carbon Offset Calculation**: CO2 offset tracking for renewable generation
- **Environmental Impact**: Weather condition impact on renewable energy

### 📊 **Advanced Analytics**
- **Real-time Monitoring**: Live energy balance tracking
- **Trading Analytics**: Opportunity identification and efficiency scoring
- **Weather Impact Analysis**: Generation performance under different conditions
- **Battery Performance**: Storage system efficiency monitoring

## Architecture

```
Enhanced Smart Meter Simulator
├── Core Simulation Engine
│   ├── Weather Simulation (Dynamic conditions)
│   ├── Solar Generation (Time/weather dependent)
│   ├── Consumption Patterns (User-type specific)
│   └── Battery Management (Charge/discharge cycles)
├── P2P Trading Engine
│   ├── Surplus/Deficit Detection
│   ├── Price Matching Algorithm
│   ├── Trading Opportunity Scoring
│   └── Market Dynamics Simulation
├── Data Pipeline
│   ├── Kafka Producer (Real-time streaming)
│   ├── TimescaleDB Storage (Time-series optimization)
│   ├── PostgreSQL Integration (Relational data)
│   └── File Backup (JSONL format)
└── Analytics Engine
    ├── Trading Opportunity Analyzer
    ├── Energy Balance Reporter
    ├── REC Generation Tracker
    └── Visualization Generator
```

## Installation

### Prerequisites
- Python 3.9+
- PostgreSQL 13+
- TimescaleDB 2.0+
- Apache Kafka (optional)
- Redis (optional)

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd docker/smart-meter-simulator

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database schema
psql -f schema/enhanced_timescaledb_schema.sql

# Run the enhanced simulator
python enhanced_simulator.py
```

## Configuration

### Environment Variables

#### Simulation Settings
```bash
SIMULATION_INTERVAL=15      # Seconds between readings
NUM_METERS=20              # Number of meters to simulate
OUTPUT_FILE=./data/meter_readings.jsonl
```

#### Trading Configuration
```bash
MIN_SELL_PRICE=0.15        # USD per kWh
MAX_SELL_PRICE=0.35        # USD per kWh  
MIN_BUY_PRICE=0.20         # USD per kWh
MAX_BUY_PRICE=0.40         # USD per kWh
GRID_FEED_IN_RATE=0.12     # Grid feed-in rate
GRID_PURCHASE_RATE=0.28    # Grid purchase rate
```

#### Weather Simulation
```bash
WEATHER_SUNNY_WEIGHT=0.4          # 40% sunny weather
WEATHER_PARTLY_CLOUDY_WEIGHT=0.3  # 30% partly cloudy
WEATHER_CLOUDY_WEIGHT=0.15        # 15% cloudy
WEATHER_OVERCAST_WEIGHT=0.1       # 10% overcast
WEATHER_RAINY_WEIGHT=0.05         # 5% rainy
```

### Meter Type Distribution
- **Solar Prosumers (40%)**: Residential with solar panels
- **Grid Consumers (35%)**: Traditional grid-connected consumers
- **Hybrid Prosumers (20%)**: Solar + battery storage systems
- **Battery Storage (5%)**: Dedicated storage providers

## Usage Examples

### Basic Simulation
```bash
# Run with default settings
python enhanced_simulator.py

# Run with custom configuration
NUM_METERS=50 SIMULATION_INTERVAL=10 python enhanced_simulator.py
```

### Analytics Dashboard
```bash
# Generate trading analytics
python analytics/trading_analyzer.py

# View generated reports
ls data/analytics/
```

### Docker Deployment
```bash
# Build image
docker build -t enhanced-meter-simulator .

# Run container
docker run -d \
  --name meter-simulator \
  -e NUM_METERS=30 \
  -e SIMULATION_INTERVAL=15 \
  -v $(pwd)/data:/app/data \
  enhanced-meter-simulator
```

## Data Outputs

### Energy Readings Format
```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "meter_id": "AMI_METER_001",
  "meter_type": "Solar_Prosumer",
  "location": "Zone_1_Building_1",
  "user_type": "Prosumer",
  "energy_generated": 5.234,
  "energy_consumed": 2.145,
  "energy_available_for_sale": 2.487,
  "battery_level": 75.2,
  "surplus_energy": 3.089,
  "trading_preference": "Moderate",
  "max_sell_price": 0.28,
  "max_buy_price": 0.32,
  "rec_eligible": true,
  "carbon_offset": 3.664,
  "weather_condition": "Sunny"
}
```

### Kafka Topics
- **energy-readings**: Raw meter data
- **trading-opportunities**: P2P trading matches
- **renewable-certificates**: REC generation data

### Database Tables
- **energy_readings_enhanced**: Main time-series data
- **trading_opportunities_summary**: Hourly trading summaries
- **rec_generation_summary**: REC generation reports
- **weather_impact_analysis**: Weather performance analysis

## Analytics & Monitoring

### Real-time Metrics
- Energy balance (generation vs consumption)
- Trading opportunity detection
- Battery performance monitoring
- Weather impact assessment
- REC generation tracking

### Generated Reports
- **Trading Opportunities**: Current buy/sell matches
- **Energy Balance**: System-wide energy flow analysis
- **REC Reports**: Renewable energy certificate generation
- **Weather Impact**: Generation performance by weather condition

### Visualizations
- Energy supply vs demand trends
- Trading price movements
- Battery utilization patterns
- Weather impact on generation

## Integration with GridTokenX

### Solana Blockchain Integration
- Compatible with GridTokenX Anchor programs
- REC data feeds to Energy Token program
- Trading signals for P2P marketplace
- University PoA validator integration

### Program Compatibility
- **Registry Program**: Meter registration data
- **Energy Token Program**: REC certificate validation
- **Trading Program**: P2P trading opportunities
- **Oracle Program**: AMI data validation
- **Governance Program**: University authority verification

## Development

### Testing
```bash
# Run unit tests
pytest tests/

# Run integration tests with Docker
docker-compose -f docker-compose.test.yml up --build
```

### Custom Extensions
```python
```

## Monitoring & Alerts

### Health Checks
- Database connectivity
- Kafka producer health
- Data quality validation
- Generation anomaly detection

### Prometheus Metrics
- Meter reading rates
- Trading opportunities count
- Energy balance metrics
- System performance indicators

## License
This project is part of the GridTokenX P2P Energy Trading System.

## Support
For technical support and questions, please refer to the main GridTokenX documentation.

---

**Note**: This enhanced simulator is designed for the University PoA (Proof-of-Authority) blockchain environment and integrates with the complete GridTokenX ecosystem for comprehensive P2P energy trading simulation.