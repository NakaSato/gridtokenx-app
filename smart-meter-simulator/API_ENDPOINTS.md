# GridTokenX Smart Meter Simulator API Documentation

## Overview

The GridTokenX Smart Meter Simulator provides a comprehensive REST API for accessing real-time smart meter data from the 25-meter UTCC University campus simulation.

**Base URL**: `http://localhost:4040` (default port)
**Content Type**: `application/json`
**Authentication**: None required

## API Endpoints

### 1. Health Check
**GET** `/health`

Returns the system health status and basic information.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-30T10:30:00.000Z",
  "meters_active": 25,
  "campus": "UTCC University"
}
```

### 2. Get All Meters
**GET** `/api/meters`

Returns configuration and status information for all 25 smart meters.

**Response**:
```json
[
  {
    "meter_id": "AMI_METER_UTCC_001",
    "building": "Engineering Building A",
    "floor": 1,
    "type": "prosumer",
    "capacity_kw": 150.0,
    "has_solar": true,
    "has_battery": true,
    "battery_level": 75.5
  }
]
```

### 3. Get Latest Readings
**GET** `/api/readings`

Returns the most recent energy readings from all 25 meters.

**Response**:
```json
[
  {
    "meter_id": "AMI_METER_UTCC_001",
    "timestamp": "2025-09-30T10:30:15.000Z",
    "building": "Engineering Building A",
    "floor": 1,
    "meter_type": "prosumer",
    "energy_consumed": 125.3,
    "energy_generated": 45.7,
    "voltage": 228.5,
    "current": 0.55,
    "power_factor": 0.97,
    "battery_level": 75.5,
    "solar_generation": 45.7,
    "grid_feed_in": 0.0,
    "temperature": 26.2,
    "humidity": 58.3
  }
]
```

### 4. Get Specific Meter Reading
**GET** `/api/meters/{meter_id}/reading`

Returns the latest reading for a specific meter.

**Parameters**:
- `meter_id` (path): The meter ID (e.g., `AMI_METER_UTCC_001`)

**Response**:
```json
{
  "meter_id": "AMI_METER_UTCC_001",
  "timestamp": "2025-09-30T10:30:15.000Z",
  "building": "Engineering Building A",
  "floor": 1,
  "meter_type": "prosumer",
  "energy_consumed": 125.3,
  "energy_generated": 45.7,
  "voltage": 228.5,
  "current": 0.55,
  "power_factor": 0.97,
  "battery_level": 75.5,
  "solar_generation": 45.7,
  "grid_feed_in": 0.0,
  "temperature": 26.2,
  "humidity": 58.3
}
```

**Error Response** (404):
```json
{
  "error": "Meter not found"
}
```

### 5. Get Campus Summary
**GET** `/api/campus/summary`

Returns aggregated energy statistics for the entire campus.

**Response**:
```json
{
  "timestamp": "2025-09-30T10:30:15.000Z",
  "campus": "UTCC University",
  "total_meters": 25,
  "total_consumption": 2456.8,
  "total_generation": 1876.3,
  "total_grid_feed_in": 234.2,
  "prosumer_count": 16,
  "consumer_count": 9,
  "meters_with_solar": 16,
  "meters_with_battery": 11,
  "average_battery_level": 68.5
}
```

### 6. Real-Time Meter Readings (WebSocket)
**WebSocket** `ws://localhost:4040/ws/readings`

Provides real-time streaming of all meter readings as they are collected.

**Connection Protocol**:
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:4040/ws/readings');

// Subscribe to readings
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'subscribe' }));
};

// Handle incoming messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'readings_update') {
    console.log('New readings:', data.data);
  }
};
```

**Message Types**:
- `readings_update`: Contains array of all meter readings
- `subscribed`: Confirmation of subscription
- `pong`: Response to ping messages

### 7. Real-Time Campus Summary (WebSocket)
**WebSocket** `ws://localhost:4040/ws/summary`

Provides real-time streaming of campus energy summary statistics.

**Connection Protocol**:
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:4040/ws/summary');

// Subscribe to summary updates
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'subscribe' }));
};

// Handle incoming messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'summary_update') {
    console.log('Campus summary:', data.data);
  }
};
```

### 8. WebSocket Status
**GET** `/api/websocket/status`

Returns information about active WebSocket connections.

**Response**:
```json
{
  "websocket_enabled": true,
  "active_connections": 3,
  "simulation_interval": 15,
  "timestamp": "2025-09-30T10:30:15.000Z"
}
```

### 9. IEEE 2030.5 Status (Optional)
**GET** `/api/ieee2030_5/status`

Returns the status of IEEE 2030.5 protocol implementation (only available if enabled).

**Response**:
```json
{
  "enabled": true,
  "server_port": 8443,
  "clients_connected": 25,
  "server_running": true,
  "timestamp": "2025-09-30T10:30:15.000Z"
}
```

**Error Response** (503):
```json
{
  "error": "IEEE 2030.5 not enabled"
}
```

### 10. IEEE 2030.5 Clients (Optional)
**GET** `/api/ieee2030_5/clients`

Returns information about connected IEEE 2030.5 clients (only available if enabled).

**Response**:
```json
{
  "clients": [
    {
      "meter_id": "AMI_METER_UTCC_001",
      "device_lfdi": "LFDI_AMI_METER_UTCC_001",
      "server_url": "http://localhost:8443",
      "connected": true
    }
  ]
}
```

**Error Response** (503):
```json
{
  "error": "IEEE 2030.5 not enabled"
}
```

### 11. API Documentation Page
**GET** `/`

Returns an HTML page with interactive API documentation and links to all endpoints.

## Data Field Descriptions

### Meter Configuration Fields
- `meter_id`: Unique identifier for the meter
- `building`: Building name where meter is located
- `floor`: Floor number within the building
- `type`: Meter type ("prosumer" or "consumer")
- `capacity_kw`: Maximum power capacity in kilowatts
- `has_solar`: Boolean indicating solar panel installation
- `has_battery`: Boolean indicating battery storage
- `battery_level`: Current battery charge level (0-100, null if no battery)

### Reading Data Fields
- `meter_id`: Unique identifier for the meter
- `timestamp`: ISO 8601 timestamp of the reading
- `building`: Building name
- `floor`: Floor number
- `meter_type`: Meter type
- `energy_consumed`: Energy consumption in kW
- `energy_generated`: Energy generation in kW (solar)
- `voltage`: Voltage in volts
- `current`: Current in amperes
- `power_factor`: Power factor (0.0-1.0)
- `battery_level`: Battery charge level (0-100, null if no battery)
- `solar_generation`: Solar generation in kW
- `grid_feed_in`: Net energy fed to grid in kW
- `temperature`: Ambient temperature in Celsius
- `humidity`: Relative humidity percentage

## Usage Examples

### Get All Meter Data
```bash
curl http://localhost:4040/api/meters
```

### Monitor Real-time Readings
```bash
# Get latest readings every 15 seconds
while true; do
  curl -s http://localhost:4040/api/readings | jq '.[0:3]'  # First 3 meters
  sleep 15
done
```

### Check Campus Energy Balance
```bash
curl http://localhost:4040/api/campus/summary | jq '.total_generation - .total_consumption'
```

### Get Specific Meter History
```bash
# Get reading for Engineering Building A Floor 1
curl http://localhost:4040/api/meters/AMI_METER_UTCC_001/reading
```

### Real-Time WebSocket Monitoring (JavaScript)
```javascript
// Real-time readings monitoring
const readingsWs = new WebSocket('ws://localhost:4040/ws/readings');

readingsWs.onopen = () => {
  console.log('Connected to readings WebSocket');
  readingsWs.send(JSON.stringify({ type: 'subscribe' }));
};

readingsWs.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'readings_update') {
    const totalConsumption = data.data.reduce((sum, meter) => sum + meter.energy_consumed, 0);
    const totalGeneration = data.data.reduce((sum, meter) => sum + meter.energy_generated, 0);
    console.log(`Real-time: Consumption: ${totalConsumption.toFixed(2)} kW, Generation: ${totalGeneration.toFixed(2)} kW`);
  }
};

// Real-time summary monitoring
const summaryWs = new WebSocket('ws://localhost:4040/ws/summary');

summaryWs.onopen = () => {
  console.log('Connected to summary WebSocket');
  summaryWs.send(JSON.stringify({ type: 'subscribe' }));
};

summaryWs.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'summary_update') {
    console.log('Campus Summary:', data.data);
  }
};
```

### Real-Time WebSocket Monitoring (Python)
```python
import asyncio
import websockets
import json

async def monitor_readings():
    uri = "ws://localhost:4040/ws/readings"
    async with websockets.connect(uri) as websocket:
        # Subscribe to readings
        await websocket.send(json.dumps({"type": "subscribe"}))
        
        async for message in websocket:
            data = json.loads(message)
            if data["type"] == "readings_update":
                readings = data["data"]
                total_consumption = sum(meter["energy_consumed"] for meter in readings)
                total_generation = sum(meter["energy_generated"] for meter in readings)
                print(f"Real-time: Consumption: {total_consumption:.2f} kW, Generation: {total_generation:.2f} kW")

# Run the monitor
asyncio.run(monitor_readings())
```

### Check WebSocket Status
```bash
curl http://localhost:4040/api/websocket/status
```

## Response Codes

- `200`: Success
- `404`: Meter not found
- `503`: Service not available (IEEE 2030.5 not enabled)

## WebSocket Message Types

### Client to Server Messages
- `{"type": "subscribe"}`: Subscribe to real-time updates
- `{"type": "ping"}`: Ping to check connection (server responds with pong)

### Server to Client Messages
- `{"type": "readings_update", "data": [...], "timestamp": "..."}`: Real-time meter readings
- `{"type": "summary_update", "data": {...}, "timestamp": "..."}`: Real-time campus summary
- `{"type": "subscribed", "message": "..."}`: Subscription confirmation
- `{"type": "pong", "timestamp": "..."}`: Ping response
- `{"type": "error", "message": "..."}`: Error message

## Rate Limiting

No rate limiting is currently implemented. The simulator updates readings every 15 seconds by default.

## WebSocket Connection Management

- **Automatic Cleanup**: Dead connections are automatically removed
- **Broadcasting**: All connected clients receive the same real-time data
- **Connection Status**: Monitor active connections via `/api/websocket/status`
- **Ping/Pong**: Use ping messages to maintain connection health

## Notes

- All timestamps are in UTC and ISO 8601 format
- Energy values are in kilowatts (kW)
- The simulator runs continuously and updates readings in real-time
- IEEE 2030.5 endpoints are only available when the protocol is enabled
- All endpoints support CORS for web application integration
- WebSocket connections automatically receive data every simulation interval (default: 15 seconds)
- WebSocket clients should handle reconnection logic for production use