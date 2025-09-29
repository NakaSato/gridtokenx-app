# InfluxDB Configuration for GridToken### Accessing InfluxDB

- **HTTP API**: http://localhost:8086
- **Web UI**: http://localhost:8086 (for management and queries)
- **Admin User**: admin / gridtokenx2025
- **Organization**: gridtokenx
- **Admin Token**: gridtokenx-admin-token-2025
This directory contains the Docker configuration for InfluxDB, optimized for storing high-frequency time-series data from the GridTokenX AMI Smart Meter Simulator.

## Overview

InfluxDB is specifically optimized for the AMI simulator engine's timestamp data requirements:
- **High-frequency timestamp data** (15-second intervals from 25 campus meters)
- **Precise timestamp handling** with nanosecond precision for meter readings
- **Optimized TSM engine** for efficient timestamp-based queries and storage
- **AMI-specific retention policies** (2 years for meter readings with continuous aggregation)
- **Real-time data ingestion** supporting the simulator's data pipeline

## Configuration Files

### `influxdb.conf`
- **AMI-optimized TSM engine** with 2GB cache and fast compaction cycles
- **Coordinator settings** tuned for AMI query patterns (5s write timeout, 10 concurrent queries)
- **Retention policies** with 15-minute enforcement checks for AMI data
- **Shard pre-creation** optimized for predictable timestamp patterns (5-minute checks, 2-hour advance)

### `init-influxdb.sh`
- **InfluxDB 2.x initialization** with organization, buckets, and sample data
- Creates additional buckets with retention policies optimized for AMI simulator data
- Sets up organization `gridtokenx` with admin token
- Inserts sample timestamp data for all 25 campus meters using InfluxDB 2.x API

### `Dockerfile`
- Custom InfluxDB 2.7-alpine image with AMI-specific configuration
- Includes initialization script and health checks for timestamp data validation

## Usage

### Starting InfluxDB

```bash
# From the project root
docker-compose up influxdb
```

### Accessing InfluxDB

- **HTTP API**: http://localhost:8086
- **Web UI**: http://localhost:8086 (for initial setup)
- **Setup**: On first run, use the web UI to create organization, bucket, and API token
- **No predefined users**: Configure authentication through InfluxDB 2.x web interface

### Database Schema

InfluxDB 2.x uses buckets instead of databases. The initialization creates:

#### Default Bucket: `gridtokenx`
- General purpose bucket for GridTokenX data

#### Meter Readings Bucket: `meter_readings_2y` (2-year retention)
```influxql
measurement: meter_readings
tags: meter_id
fields:
  - energy_generated (float)
  - energy_consumed (float)
  - voltage (float)
  - current (float)
  - power_factor (float)
  - temperature (float)
  - irradiance (float)
```

#### Market Data Bucket: `market_data_5y` (5-year retention)
```influxql
measurement: market_data
fields:
  - price_per_kwh (float)
  - trading_volume (float)
  - active_buy_orders (integer)
  - active_sell_orders (integer)
```

#### System Metrics Bucket: `system_metrics_1y` (1-year retention)
```influxql
measurement: system_metrics
tags: component, severity
fields:
  - api_response_time (float)
  - db_connections (integer)
  - oracle_requests_pending (integer)
  - block_time (float)
```

## Retention Policies

- **meter_readings_2y**: 2 years retention for raw meter data
- **market_data_5y**: 5 years retention for market data
- **system_metrics_1y**: 1 year retention for system metrics

## Continuous Queries

### Hourly Aggregations
- `meter_readings_hourly`: Average/min/max values per meter per hour
- `market_data_hourly`: Price and volume aggregations per hour

### Daily Aggregations
- `meter_readings_daily`: Total energy and daily averages per meter

## Sample Queries

Use InfluxDB 2.x API or web UI for queries. Here are Flux query examples:

### Get latest meter readings
```flux
from(bucket: "meter_readings_2y")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "meter_readings")
  |> limit(n: 100)
```

### Get energy generation by meter (last 24 hours)
```flux
from(bucket: "meter_readings_2y")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "meter_readings" and r._field == "energy_generated")
  |> group(columns: ["meter_id"])
  |> sum()
```

### Get hourly market price averages
```flux
from(bucket: "market_data_5y")
  |> range(start: -7d)
  |> filter(fn: (r) => r._measurement == "market_data" and r._field == "price_per_kwh")
  |> aggregateWindow(every: 1h, fn: mean)
  |> yield(name: "hourly_avg_price")
```

## Integration with API Gateway

The API Gateway connects to InfluxDB for:
- Storing high-frequency meter readings
- Retrieving aggregated data for analytics
- Real-time dashboard data
- Historical data queries

## Monitoring

InfluxDB includes health checks and exposes metrics at:
- Health endpoint: http://localhost:8086/health
- Metrics endpoint: http://localhost:8086/metrics

## Backup and Recovery

Data is persisted in Docker volumes:
- `influxdb_data`: Time-series data and WAL files
- `influxdb_config`: Configuration files

## Performance Tuning

### AMI Simulator Engine Optimizations
- **TSM Engine**: 2GB cache memory, 5-60 minute compaction cycles, 500 points per block
- **Coordinator**: 5-second write timeout, 10 concurrent queries, 50 max connections
- **Retention**: 15-minute enforcement checks, 5-minute shard pre-creation
- **Ingestion Rate**: Optimized for 25 meters × 4 readings/minute = 100 readings/minute
- **Query Performance**: Continuous queries provide pre-aggregated timestamp data
- **Storage**: Efficient compression optimized for timestamp-heavy data patterns
- **Memory**: Configured for high-frequency timestamp writes with optimized caching

## Initial Setup

The container automatically initializes with:

1. **Admin User**: admin / gridtokenx2025
2. **Organization**: gridtokenx
3. **Buckets Created**:
   - `gridtokenx` (default bucket)
   - `meter_readings_2y` (2-year retention)
   - `market_data_5y` (5-year retention)
   - `system_metrics_1y` (1-year retention)
4. **Admin Token**: gridtokenx-admin-token-2025
5. **Sample Data**: Pre-loaded with realistic AMI simulator data

Access the web UI at http://localhost:8086 to manage users, tokens, and explore data.

## Security

- **Predefined Admin User**: admin / gridtokenx2025
- **Organization**: gridtokenx (created during initialization)
- **Admin Token**: gridtokenx-admin-token-2025 (for API access)
- **Buckets**: Separate buckets for different data types with appropriate retention
- **Network isolation**: Within Docker network