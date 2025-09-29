# UTCC University GridTokenX Smart Meter Simulator

IEEE 2030.5-2018 Smart Energy Profile 2.0 Smart Meter Simulator for Campus Energy Management

## Features

- **25 Campus Meters**: Realistic simulation of university campus energy consumption and generation
- **IEEE 2030.5 Protocol**: Smart Energy Profile 2.0 compliance for advanced energy management (enabled by default)
- **InfluxDB Storage**: All generated data automatically stored in InfluxDB time-series database
- **REST API**: Real-time access to meter readings and campus energy summaries
- **Multiple Meter Types**: Prosumers, consumers, solar generation, battery storage
- **Realistic Simulation**: Time-of-day patterns, weather effects, battery management

## Quick Start

### Basic Simulation (IEEE 2030.5 and InfluxDB enabled by default)
```bash
cd smart-meter-simulator
uv run python simulator.py
```

### Disable IEEE 2030.5 Protocol
```bash
uv run python simulator.py --disable-ieee2030-5
```

### Disable InfluxDB Storage
```bash
uv run python simulator.py --disable-influxdb
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `INFLUXDB_ENABLED` | `true` | Enable/disable InfluxDB data storage |
| `INFLUXDB_URL` | `http://localhost:8086` | InfluxDB server URL |
| `INFLUXDB_TOKEN` | `` | InfluxDB authentication token |
| `INFLUXDB_ORG` | `gridtokenx` | InfluxDB organization |
| `INFLUXDB_BUCKET` | `meter_readings_2y` | InfluxDB bucket name |
| `IEEE2030_5_ENABLED` | `true` | Enable IEEE 2030.5 protocol |
| `IEEE2030_5_PORT` | `8443` | IEEE 2030.5 server port |
| `API_PORT` | `4040` | REST API server port |
| `SIMULATION_INTERVAL` | `15` | Seconds between readings |

### Command Line Options

- `--config-file`: Path to campus configuration file (default: `config/utcc_campus_config.json`)
- `--disable-ieee2030-5`: Disable IEEE 2030.5 Smart Energy Profile support
- `--ieee2030-5-port`: Port for IEEE 2030.5 server (default: 8443)
- `--disable-influxdb`: Disable InfluxDB data storage

## API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /api/meters` - List all meters
- `GET /api/readings` - Get latest readings from all meters
- `GET /api/meters/{meter_id}/reading` - Get specific meter reading
- `GET /api/campus/summary` - Campus-wide energy summary

### IEEE 2030.5 Endpoints (when enabled)
- `GET /api/ieee2030_5/status` - IEEE 2030.5 server status
- `GET /api/ieee2030_5/clients` - Connected IEEE 2030.5 clients

## Data Storage

All meter readings are automatically stored in InfluxDB with the following structure:

### Measurement: `meter_readings`

**Tags:**
- `meter_id`: Unique meter identifier
- `building`: Building name
- `floor`: Floor number
- `meter_type`: Type of meter (prosumer/consumer)

**Fields:**
- `energy_consumed`: Energy consumption in kW
- `energy_generated`: Energy generation in kW
- `voltage`: Voltage in V
- `current`: Current in A
- `power_factor`: Power factor (0-1)
- `temperature`: Temperature in °C
- `humidity`: Humidity in %
- `battery_level`: Battery level (0-100%) [optional]
- `solar_generation`: Solar generation in kW [optional]
- `grid_feed_in`: Grid feed-in in kW [optional]

## Meter Types

- **Consumer**: Energy consumers only (35% of meters)
- **Prosumer**: Solar generation + consumption (45% of meters)
- **Hybrid Prosumer**: Solar + battery storage (20% of meters)

## IEEE 2030.5 Protocol

When enabled, the simulator implements IEEE 2030.5 Smart Energy Profile 2.0:

- **Server**: Runs on configurable port (default: 8443)
- **Clients**: Each meter registers as an IEEE 2030.5 device
- **Resources**: Device capability, end devices, mirror usage points
- **Function Sets**: Demand response, customer information provider, pricing
- **Security**: X.509 certificate-based authentication

## Dependencies

- Python 3.11+
- aiohttp (web server)
- influxdb-client (time-series storage)
- cryptography (IEEE 2030.5 security)
- uv (package management)

## Installation

```bash
# Install dependencies
uv sync

# Or using pip
pip install -r requirements.txt
```

## Development

```bash
# Run tests
uv run pytest

# Format code
uv run black .
uv run isort .

# Lint code
uv run flake8 .
```

## Architecture

```
simulator.py (main)
├── CampusNetworkSimulator
│   ├── SmartMeter[] (25 meters)
│   ├── InfluxDB client
│   ├── IEEE 2030.5 server (optional)
│   └── REST API server
├── IEEE 2030.5 Protocol Stack
│   ├── Server (resources, function sets)
│   ├── Client (device registration)
│   └── Security (certificates, authentication)
└── Configuration
    ├── Campus layout (buildings, floors)
    └── Meter specifications
```

## License

Copyright 2025 UTCC University GridTokenX Project