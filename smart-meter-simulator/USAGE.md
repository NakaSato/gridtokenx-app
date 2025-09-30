# Smart Meter Simulator Usage Guide

## Quick Start

```bash
# 🌞 RECOMMENDED: Run simulator with peak solar generation (works anytime!)
python simulator.py --force-daylight

# Generate energy data preview with peak solar generation
python simulator.py --generate-energy-data --force-daylight

# Run simulator with default settings (uses local time UTC+7)
python simulator.py

# Run with custom configuration file
python simulator.py --config-file config/custom_config.json
```

## Command Line Options

The smart meter simulator supports various command-line options to customize its behavior.

### Basic Usage

```bash
# Run with default settings
python simulator.py

# Run with custom configuration file
python simulator.py --config-file config/custom_config.json
```

## Energy Data Generation

### `--generate-energy-data`

Generate and display current energy data for all meters before starting the simulator.

**Usage:**

```bash
# Use local time (default - recommended for Thailand/Bangkok UTC+7)
python simulator.py --generate-energy-data

# Force peak solar generation (simulate noon) - BEST FOR TESTING AT NIGHT
python simulator.py --generate-energy-data --force-daylight

# Use UTC time (for international deployments)
python simulator.py --generate-energy-data --use-utc-time

# Use custom timezone offset
python simulator.py --generate-energy-data --timezone-offset 8  # UTC+8
```

**🌞 Force Daylight Mode (Recommended for Testing)**

The `--force-daylight` option simulates **peak solar generation (12:00 noon)** regardless of the actual time. This applies to both the initial data generation AND the ongoing simulation:

```bash
# Force daylight for entire simulation
python simulator.py --force-daylight

# Force daylight with data preview
python simulator.py --generate-energy-data --force-daylight
```

**Benefits:**
- ✅ Always shows maximum solar generation (even at night)
- ✅ Perfect for demos and testing
- ✅ No need to wait for actual daylight hours
- ✅ Consistent results regardless of when you run it
- ✅ Works for the entire simulation, not just initial data

**Output:**
```
🌞 FORCING DAYLIGHT MODE: Simulating PEAK solar generation (12:00 noon)
   Actual time: 2025-09-30 19:35:00 UTC

2025-09-30 07:09:56 - INFO - 🌞 Running simulator in FORCE DAYLIGHT mode (peak solar generation)
2025-09-30 07:09:56 - INFO - Campus Summary - Consumption: 1428.46 kW, Generation: 856.32 kW, Grid Feed-in: 245.18 kW
                                                                      ^^^^^^^^^ Now showing generation!
```

**Important: Timezone Considerations**

By default, the simulator uses **local time (UTC+7 for Thailand)** to calculate solar generation. This ensures that:
- Solar panels generate power during daylight hours (6 AM - 6 PM local time)
- Generation values are realistic for your actual location
- Testing at night still shows generation if it would be daytime locally

If you see **Generation: 0.00 kW** for all meters:
1. **Use `--force-daylight`** for instant peak generation (recommended)
2. Or use local time if current local hour is 6-18
3. Or wait until daylight hours

**What it does:**

1. Loads the campus configuration
2. Initializes all smart meters
3. Generates a snapshot of current energy readings
4. Displays a comprehensive table with:
   - Meter ID
   - Building location
   - Meter type (prosumer/consumer)
   - Phase type (3-phase/single-phase)
   - Energy consumption (kW)
   - Energy generation (kW)
   - Grid feed-in (kW)
   - Solar panel status
   - Battery storage status

5. Shows campus-wide summary statistics:
   - Total meters count
   - Prosumer vs Consumer breakdown
   - Phase type distribution
   - Total consumption and generation
   - Net energy balance (surplus/deficit)
   - Grid feed-in totals
   - Self-sufficiency percentage

6. Continues to start the full simulator

**Example Output:**

```
🏫 UTCC University GridTokenX Smart Meter Simulator
============================================================
Generating current energy data for all meters...
============================================================

📊 Generated 20 meter readings at 2025-09-30 02:30:00 UTC

========================================================================================================================
Meter ID                  Building     Type       Phase        Consumption  Generation   Grid Feed-in Solar    Battery  
========================================================================================================================
METER-ENG-301-001        ENG          prosumer   3-phase      3.45         5.20         1.75         Yes      Yes     
METER-ENG-301-002        ENG          consumer   single       2.10         0.00         0.00         No       No      
METER-ENG-302-001        ENG          prosumer   3-phase      4.20         6.50         2.30         Yes      Yes     
...
========================================================================================================================
TOTALS                                                         45.30        38.20        5.10        

📈 Campus Energy Summary:
   • Total Meters: 20
   • Prosumers: 12 | Consumers: 8
   • 3-Phase: 15 | Single-Phase: 5
   • Total Consumption: 45.30 kW
   • Total Generation: 38.20 kW
   • Net Balance: -7.10 kW (Deficit)
   • Grid Feed-in: 5.10 kW
   • Self-Sufficiency: 84.3%

✅ Energy data generation completed!

🚀 Continuing to start the full simulator...
```

## Other Command Line Options

### Timezone Configuration

```bash
# Force peak solar generation (best for testing/demos)
python simulator.py --generate-energy-data --force-daylight

# Use local time for solar generation (default: UTC+7 for Thailand)
python simulator.py --generate-energy-data

# Use UTC time instead
python simulator.py --generate-energy-data --use-utc-time

# Set custom timezone offset (e.g., UTC+8 for Singapore/Hong Kong)
python simulator.py --timezone-offset 8

# UTC+9 for Japan
python simulator.py --timezone-offset 9

# UTC-5 for US Eastern Time
python simulator.py --timezone-offset -5
```

**Why this matters:**
- Solar generation only occurs during daylight hours (6 AM - 6 PM)
- Using local time ensures realistic generation values for your location
- Default is UTC+7 (Bangkok, Thailand)
- **Use `--force-daylight` for instant peak generation anytime**

### IEEE 2030.5 Protocol

```bash
# Disable IEEE 2030.5 Smart Energy Profile
python simulator.py --disable-ieee2030-5

# Use custom IEEE 2030.5 port
python simulator.py --ieee2030-5-port 8444
```

### InfluxDB Integration

```bash
# Disable InfluxDB data storage
python simulator.py --disable-influxdb
```

### Simulation Interval

```bash
# Set custom simulation interval (in seconds)
python simulator.py --simulation-interval 60

# Recommended intervals:
# - Fast testing: 15-30 seconds
# - Normal operation: 30-60 seconds
# - Production: 60-300 seconds (1-5 minutes)
```

### API Gateway Integration

```bash
# Enable publishing to API Gateway
python simulator.py --enable-gateway-publish \
  --gateway-url http://localhost:8080 \
  --gateway-jwt "your-jwt-token" \
  --engineering-signature "your-signature"

# Example with all options
python simulator.py \
  --generate-energy-data \
  --enable-gateway-publish \
  --gateway-url http://localhost:8080 \
  --gateway-jwt "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  --engineering-signature "eng-dept-signature-2025" \
  --simulation-interval 30
```

## Combined Usage Examples

### Development Mode

```bash
# Quick test with peak solar generation (best for night testing)
python simulator.py \
  --generate-energy-data \
  --force-daylight \
  --simulation-interval 15 \
  --disable-influxdb

# Or with local time
python simulator.py \
  --generate-energy-data \
  --simulation-interval 15 \
  --disable-influxdb
```

### Production Mode

```bash
# Full production setup with all features
python simulator.py \
  --config-file config/production_config.json \
  --enable-gateway-publish \
  --gateway-url https://api.gridtokenx.com \
  --gateway-jwt "$GATEWAY_JWT_TOKEN" \
  --engineering-signature "$ENG_SIGNATURE" \
  --simulation-interval 60
```

### Testing Mode

```bash
# Generate data snapshot without running simulator
# (Note: Currently continues to run simulator after generation)
python simulator.py --generate-energy-data
# Press Ctrl+C after viewing the data
```

### Docker Mode

When running in Docker, pass options via command override:

```bash
# docker-compose.yml
services:
  smart-meter-simulator:
    command: ["python", "simulator.py", "--generate-energy-data", "--simulation-interval", "30"]
```

Or via docker run:

```bash
docker run -it gridtokenx/smart-meter-simulator \
  python simulator.py --generate-energy-data --simulation-interval 30
```

## Environment Variables

You can also configure the simulator using environment variables (see `.env.example`):

```bash
# Simulation settings
SIMULATION_INTERVAL=30
NUM_METERS=20

# IEEE 2030.5
IEEE2030_5_ENABLED=true
IEEE2030_5_PORT=8443

# InfluxDB
INFLUXDB_ENABLED=true
INFLUXDB_URL=http://localhost:8086

# API Gateway
PUBLISH_TO_GATEWAY=true
API_GATEWAY_URL=http://localhost:8080
API_GATEWAY_JWT=your-jwt-token
```

Command-line arguments take precedence over environment variables.

## Help

View all available options:

```bash
python simulator.py --help
```

Output:

```
usage: simulator.py [-h] [--config-file CONFIG_FILE] [--disable-ieee2030-5]
                    [--ieee2030-5-port IEEE2030_5_PORT] [--disable-influxdb]
                    [--simulation-interval SIMULATION_INTERVAL]
                    [--generate-energy-data] [--enable-gateway-publish]
                    [--gateway-url GATEWAY_URL] [--gateway-jwt GATEWAY_JWT]
                    [--engineering-signature ENGINEERING_SIGNATURE]

UTCC Smart Meter Simulator

optional arguments:
  -h, --help            show this help message and exit
  --config-file CONFIG_FILE
                        Path to campus configuration file
  --disable-ieee2030-5  Disable IEEE 2030.5 Smart Energy Profile support
  --ieee2030-5-port IEEE2030_5_PORT
                        Port for IEEE 2030.5 server (default: 8443)
  --disable-influxdb    Disable InfluxDB data storage
  --simulation-interval SIMULATION_INTERVAL
                        Interval in seconds between data collection cycles
  --generate-energy-data
                        Generate and display current energy data for all meters
  --enable-gateway-publish
                        Enable publishing readings to API Gateway
  --gateway-url GATEWAY_URL
                        API Gateway base URL
  --gateway-jwt GATEWAY_JWT
                        JWT token for API Gateway Authorization
  --engineering-signature ENGINEERING_SIGNATURE
                        Engineering authority signature
```

## Troubleshooting

### Issue: Energy data shows all zeros

**Solution**: Check that your configuration file has valid meter definitions with solar panels and consumption patterns.

### Issue: Simulator exits immediately after generating data

**Behavior**: This is expected. The simulator generates the data snapshot and then continues to run the full simulator. Press Ctrl+C to stop after viewing the data if you only want the snapshot.

### Issue: Permission denied on ports 8443 or 4040

**Solution**: Run with sudo or use ports above 1024:

```bash
python simulator.py --ieee2030-5-port 8444
```

### Issue: Cannot connect to InfluxDB

**Solution**: Either start InfluxDB or disable it:

```bash
python simulator.py --disable-influxdb
```

### Issue: InfluxDB field type conflict error

**Error message:**
```
field type conflict: input field "grid_feed_in" on measurement "meter_readings" is type float, already exists as type integer
```

**Cause**: InfluxDB has strict type checking. If a field was previously stored as integer, it cannot be changed to float.

**Solutions:**

1. **Drop and recreate the bucket** (recommended for development):
   ```bash
   # Using InfluxDB CLI
   influx bucket delete --name meter_readings_2y
   influx bucket create --name meter_readings_2y --retention 2y
   ```

2. **Use a new bucket name**:
   ```bash
   # In .env file
   INFLUXDB_BUCKET=meter_readings_v2
   ```

3. **Disable InfluxDB temporarily**:
   ```bash
   python simulator.py --disable-influxdb
   ```

**Note**: The simulator now ensures all numeric fields are stored as floats for consistency.

## Performance Tips

1. **Adjust simulation interval** based on your needs:
   - Testing: 15-30 seconds
   - Development: 30-60 seconds
   - Production: 60-300 seconds

2. **Disable unused features** to reduce resource usage:
   ```bash
   python simulator.py --disable-ieee2030-5 --disable-influxdb
   ```

3. **Use `--generate-energy-data`** to verify configuration before long-running simulations

4. **Monitor resource usage** with the built-in health endpoint:
   ```bash
   curl http://localhost:4040/health
   ```

---

**Last Updated**: 2025-09-30
