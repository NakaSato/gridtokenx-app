# GridTokenX AMI Simulator
## Advanced Metering Infrastructure with IEEE 2030.5-2018 Protocol

**🏭 Production-Ready AMI Simulator for Smart Grid Infrastructure**

A comprehensive Advanced Metering Infrastructure (AMI) simulator implementing the IEEE 2030.5-2018 (Smart Energy Profile 2.0) protocol for secure, standards-compliant communication with centralized API gateways.

## 🚀 Overview

The GridTokenX AMI Simulator provides a complete implementation of an AMI network with 25 smart meters, designed to communicate with a centralized API gateway using the IEEE 2030.5 protocol. This simulator replaces traditional REST APIs with industry-standard AMI protocols for enhanced security, reliability, and interoperability.

## 🔌 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AMI Network                              │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Smart    │  │ Smart    │  │ Smart    │  │ Smart    │       │
│  │ Meter 1  │  │ Meter 2  │  │ Meter 3  │  │ Meter N  │       │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘       │
│        │              │              │              │            │
│        └──────────────┴──────────────┴──────────────┘           │
│                              │                                   │
│                    IEEE 2030.5 Protocol                          │
│                     (Smart Energy Profile 2.0)                   │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                      TLS 1.2+ Mutual Auth
                               │
                    ┌──────────▼──────────┐
                    │                     │
                    │   API Gateway       │
                    │                     │
                    │ • Device Registry   │
                    │ • Data Collection   │
                    │ • Demand Response   │
                    │ • DER Management    │
                    │                     │
                    └─────────────────────┘
```

## 🎯 Key Features

### IEEE 2030.5-2018 Compliance
- ✅ Full Smart Energy Profile 2.0 implementation
- ✅ Common Smart Inverter Profile (CSIP) support
- ✅ California Rule 21 compliance
- ✅ Certified interoperability

### AMI Capabilities
- **Real-time Data Collection**: 15-second interval meter readings
- **Bi-directional Communication**: Command and control capabilities
- **Demand Response**: Load shedding and shifting support
- **DER Integration**: Solar and battery management
- **Time Synchronization**: IEEE 2030.5 time sync
- **Event Management**: Priority-based event handling
- **Flow Reservation**: P2P energy trading support

### Security Features
- 🔐 X.509 certificate-based authentication
- 🔐 TLS 1.2+ mutual authentication
- 🔐 Individual meter certificates
- 🔐 Certificate lifecycle management
- 🔐 Encrypted data transmission
- 🔐 Tamper detection and reporting

## 📋 Prerequisites

- Python 3.9 or higher
- TLS certificates for each meter
- Access to API Gateway endpoint
- Network connectivity to gateway

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/gridtokenx/gridtokenx-app.git
cd gridtokenx-app/smart-meter-simulator
```

### 2. Generate Certificates
```bash
# Generate certificates for all 25 meters
python generate_campus_certificates.py
```

### 3. Configure API Gateway Connection
```bash
# Set API Gateway URL
export API_GATEWAY_URL=https://api-gateway.gridtokenx.local:8443

# Set polling interval (seconds)
export POLLING_INTERVAL=15
```

### 4. Deploy AMI Simulator
```bash
# Deploy and start the AMI simulator
./deploy-ami-simulator.sh start
```

## 🔧 Configuration

### Environment Variables
```bash
API_GATEWAY_URL         # API Gateway endpoint (default: https://api-gateway.gridtokenx.local:8443)
POLLING_INTERVAL        # Meter reading interval in seconds (default: 15)
AMI_NETWORK_ID          # Network identifier (default: UTCC_CAMPUS_001)
TLS_VERSION             # TLS version (default: 1.2)
```

### IEEE 2030.5 Configuration
Edit `config/ieee2030_5_config.json`:
```json
{
  "protocol": {
    "name": "IEEE 2030.5-2018",
    "version": "2.0",
    "profile": "Smart Energy Profile 2.0"
  },
  "function_sets": {
    "mirror_usage_point": {
      "enabled": true,
      "post_rate": 15
    },
    "demand_response": {
      "enabled": true,
      "polling_rate": 60
    }
  }
}
```

## 📊 AMI Network Details

### Campus Distribution (25 Meters)
| Building Type | Count | Meter IDs |
|--------------|-------|-----------|
| Academic | 8 | AMI_METER_UTCC_001 - 008 |
| Residential | 6 | AMI_METER_UTCC_009 - 014 |
| Administrative | 4 | AMI_METER_UTCC_015 - 018 |
| Athletic | 3 | AMI_METER_UTCC_019 - 021 |
| Research | 2 | AMI_METER_UTCC_022 - 023 |
| Support | 2 | AMI_METER_UTCC_024 - 025 |

### Meter Capabilities
- **Prosumers**: 15 meters with solar + battery
- **Consumers**: 10 meters (consumption only)
- **DER-enabled**: 15 meters with generation capability
- **Battery Storage**: 12 meters with storage systems

## 🔌 IEEE 2030.5 Endpoints

The AMI simulator communicates with these API Gateway endpoints:

| Function Set | Endpoint | Description |
|-------------|----------|-------------|
| Device Capability | `/dcap` | Discover available services |
| End Device | `/edev` | Register and manage devices |
| Mirror Usage Point | `/mir` | Post meter readings |
| Meter Reading | `/mr` | Submit consumption data |
| Demand Response | `/dr` | Receive DR events |
| DER Program | `/der` | DER control and monitoring |
| Time | `/tm` | Time synchronization |
| Flow Reservation | `/rsv` | P2P trading reservations |

## 📈 Data Flow

### 1. Device Registration
```
AMI Meter → API Gateway
POST /edev
{
  "EndDevice": {
    "mRID": "AMI_METER_UTCC_001",
    "sFDI": 40-bit-identifier,
    "deviceCategory": 1281
  }
}
```

### 2. Meter Reading Submission
```
AMI Meter → API Gateway
POST /mir/{meter_id}/mr
<MeterReading xmlns="urn:ieee:std:2030.5:ns">
  <mRID>AMI_METER_UTCC_001</mRID>
  <Reading>
    <value>1234</value>
    <uom>72</uom>
    <qualityFlags>0</qualityFlags>
  </Reading>
</MeterReading>
```

### 3. Demand Response Event
```
API Gateway → AMI Meter
GET /dr
{
  "DemandResponseProgram": {
    "mRID": "DR_EVENT_001",
    "targetReduction": 500,
    "startTime": 1234567890,
    "duration": 3600
  }
}
```

## 🎮 Usage

### Start AMI Simulator
```bash
./deploy-ami-simulator.sh start
```

### Stop AMI Simulator
```bash
./deploy-ami-simulator.sh stop
```

### View Status
```bash
./deploy-ami-simulator.sh status
```

### Monitor Logs
```bash
./deploy-ami-simulator.sh logs
```

### Test Connectivity
```bash
./deploy-ami-simulator.sh test
```

## 📊 Monitoring

### Real-time Metrics
- Total energy consumption (kWh)
- Total energy generation (kWh)
- Grid feed-in (kWh)
- Battery storage levels (%)
- Active demand response events
- Connection status per meter

### Log Files
```bash
logs/ami_simulator.log      # Main simulator log
logs/ieee2030_5.log         # Protocol-specific log
logs/meter_readings.log     # Meter data log
```

## 🔐 Security Considerations

### Certificate Management
- Each meter has a unique X.509 certificate
- Certificates are validated on both ends
- Automatic renewal 30 days before expiry
- Certificate revocation list (CRL) support

### Network Security
- All communication over TLS 1.2+
- Mutual authentication required
- Encrypted data transmission
- Regular security audits

## 🧪 Testing

### Manual Testing
```bash
# Test device registration
curl -X POST https://api-gateway.local:8443/edev \
  --cert certs/meters/AMI_METER_UTCC_001/AMI_METER_UTCC_001.pem \
  --key certs/meters/AMI_METER_UTCC_001/AMI_METER_UTCC_001-key.pem \
  -H "Content-Type: application/sep+xml"
```

### Automated Testing
```bash
# Run integration tests
python -m pytest tests/test_ami_simulator.py

# Run protocol compliance tests
python -m pytest tests/test_ieee2030_5_compliance.py
```

## 🚨 Troubleshooting

### Connection Issues
```bash
# Check API Gateway connectivity
./deploy-ami-simulator.sh test

# Verify certificates
openssl verify -CAfile certs/ca.pem certs/meters/*/AMI_*.pem

# Check TLS handshake
openssl s_client -connect api-gateway.local:8443 \
  -cert certs/meters/AMI_METER_UTCC_001/AMI_METER_UTCC_001.pem \
  -key certs/meters/AMI_METER_UTCC_001/AMI_METER_UTCC_001-key.pem
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Certificate validation failure | Regenerate certificates with `generate_campus_certificates.py` |
| Connection timeout | Check network connectivity and firewall rules |
| Registration failure | Verify meter ID uniqueness and certificate validity |
| No data transmission | Check polling interval and buffer settings |

## 📚 IEEE 2030.5 Resources

- [IEEE 2030.5-2018 Standard](https://standards.ieee.org/standard/2030_5-2018.html)
- [Smart Energy Profile 2.0 Specification](https://www.csalliance.org/)
- [Common Smart Inverter Profile](https://sunspec.org/)
- [California Rule 21 Requirements](https://www.cpuc.ca.gov/rule21/)

## 🤝 Contributing

Contributions to improve the AMI simulator are welcome! Please ensure:

1. IEEE 2030.5 compliance is maintained
2. Security best practices are followed
3. Documentation is updated
4. Tests are included

## 📄 License

This AMI Simulator is part of the GridTokenX P2P Energy Trading Platform.

---

**Note**: This AMI simulator is designed for production deployment in smart grid infrastructure. It provides enterprise-grade reliability, security, and standards compliance for Advanced Metering Infrastructure networks.