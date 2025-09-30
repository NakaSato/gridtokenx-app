#!/usr/bin/env python3
"""
UTCC University GridTokenX Smart Meter Simulator
IEEE 2030.5-2018 Smart Energy Profile 2.0 with Campus Network Support
Combined simulator with optional IEEE 2030.5 protocol support
"""

import sys
import json
import random
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, asdict
import asyncio
from aiohttp import web, WSMsgType, ClientSession, TCPConnector, ClientTimeout
from dotenv import load_dotenv
from unittest.mock import patch

# InfluxDB imports (optional)
try:
    from influxdb_client.client.influxdb_client import InfluxDBClient
    from influxdb_client.client.write.point import Point
    from influxdb_client.domain.write_precision import WritePrecision
    from influxdb_client.client.write_api import SYNCHRONOUS
    INFLUXDB_AVAILABLE = True
except ImportError:
    INFLUXDB_AVAILABLE = False

# IEEE 2030.5 imports (optional)
try:
    from ieee2030_5.server import IEEE20305Server
    from ieee2030_5.client import IEEE20305Client
    from ieee2030_5.security import SecurityManager
    from ieee2030_5.resources import MeterReading as IEEE20305MeterReading
    IEEE2030_5_AVAILABLE = True
except ImportError:
    IEEE2030_5_AVAILABLE = False

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("logs/simulator.log")],
)
logger = logging.getLogger(__name__)

# Log availability of optional modules
if not IEEE2030_5_AVAILABLE:
    logger.warning("IEEE 2030.5 modules not available - running in basic mode")
if not INFLUXDB_AVAILABLE:
    logger.warning("InfluxDB client not available - data logging disabled")


@dataclass
class MeterReading:
    """Smart meter reading data structure"""

    meter_id: str
    timestamp: str
    building: str
    floor: int
    meter_type: str
    phase_type: str
    energy_consumed: float
    energy_generated: float
    voltage: float
    current: float
    power_factor: float
    battery_level: Optional[float] = None
    solar_generation: Optional[float] = None
    grid_feed_in: Optional[float] = None
    temperature: float = 25.0
    humidity: float = 60.0

    def to_dict(self) -> Dict:
        return asdict(self)


class WebSocketManager:
    """Manages WebSocket connections for real-time data streaming"""

    def __init__(self):
        self.connections: Set[web.WebSocketResponse] = set()
        self.logger = logging.getLogger(__name__)

    async def add_connection(self, websocket: web.WebSocketResponse):
        """Add a new WebSocket connection"""
        self.connections.add(websocket)
        self.logger.info(f"WebSocket connection added. Total connections: {len(self.connections)}")

    async def remove_connection(self, websocket: web.WebSocketResponse):
        """Remove a WebSocket connection"""
        self.connections.discard(websocket)
        self.logger.info(f"WebSocket connection removed. Total connections: {len(self.connections)}")

    async def broadcast_readings(self, readings: List[Dict]):
        """Broadcast meter readings to all connected WebSocket clients"""
        if not self.connections:
            return

        message = {
            "type": "readings_update",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": readings
        }

        # Remove dead connections
        dead_connections = set()
        for websocket in self.connections:
            try:
                await websocket.send_json(message)
            except Exception as e:
                self.logger.warning(f"Failed to send to WebSocket: {e}")
                dead_connections.add(websocket)

        # Clean up dead connections
        for dead_ws in dead_connections:
            self.connections.discard(dead_ws)

        if dead_connections:
            self.logger.info(f"Cleaned up {len(dead_connections)} dead WebSocket connections")

    async def broadcast_summary(self, summary: Dict):
        """Broadcast campus summary to all connected WebSocket clients"""
        if not self.connections:
            return

        message = {
            "type": "summary_update",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": summary
        }

        # Remove dead connections
        dead_connections = set()
        for websocket in self.connections:
            try:
                await websocket.send_json(message)
            except Exception as e:
                self.logger.warning(f"Failed to send summary to WebSocket: {e}")
                dead_connections.add(websocket)

        # Clean up dead connections
        for dead_ws in dead_connections:
            self.connections.discard(dead_ws)


class SmartMeter:
    """Individual smart meter simulator"""

    def __init__(self, meter_config: Dict):
        self.meter_id = meter_config["id"]
        self.building = meter_config["building"]
        self.floor = meter_config.get("floor", 1)
        self.meter_type = meter_config.get("type", "consumer")
        self.capacity_kw = meter_config.get("capacity_kw", 100.0)
        self.has_solar = meter_config.get("solar_installed", False)
        self.has_battery = meter_config.get("battery_storage", False)
        self.phase_type = meter_config.get("phase_type", "single-phase")

        # Simulation state
        self.battery_level = 50.0 if self.has_battery else None
        self.is_running = True
        self.last_reading = None

        logger.info(
            f"Initialized meter {self.meter_id} - Type: {self.meter_type}, "
            f"Phase: {self.phase_type}, Solar: {self.has_solar}, Battery: {self.has_battery}"
        )

    def generate_reading(self, use_local_time: bool = False, force_daylight: bool = False) -> MeterReading:
        """Generate realistic meter reading based on time of day
        
        Args:
            use_local_time: If True, use local timezone instead of UTC for solar calculations
            force_daylight: If True, force peak solar generation (simulate noon)
        """
        now = datetime.now(timezone.utc)
        
        # Force daylight time (simulate noon for testing)
        if force_daylight:
            hour = 12  # Peak solar generation at noon
        # Use local time for solar generation if specified (better for testing)
        elif use_local_time:
            # Get local time (UTC+7 for Thailand)
            local_offset = int(os.getenv("LOCAL_TIMEZONE_OFFSET", "7"))
            from datetime import timedelta
            local_now = now + timedelta(hours=local_offset)
            hour = local_now.hour
        else:
            hour = now.hour

        # Base consumption pattern (varies by time of day)
        if 6 <= hour < 9:  # Morning peak
            base_consumption = self.capacity_kw * 0.7
        elif 9 <= hour < 17:  # Daytime
            base_consumption = self.capacity_kw * 0.5
        elif 17 <= hour < 21:  # Evening peak
            base_consumption = self.capacity_kw * 0.8
        else:  # Night
            base_consumption = self.capacity_kw * 0.3

        # Add randomness
        consumption = base_consumption * (1 + random.uniform(-0.2, 0.2))

        # Solar generation (if applicable)
        generation = 0.0
        if self.has_solar:
            if 6 <= hour < 18:  # Daylight hours (6 AM - 6 PM)
                solar_factor = (
                    min(1.0, (hour - 6) / 6) if hour < 12 else max(0, (18 - hour) / 6)
                )
                generation = (
                    self.capacity_kw * 0.6 * solar_factor * random.uniform(0.8, 1.0)
                )
            else:
                generation = 0.0

        # Battery management
        if self.has_battery and self.battery_level is not None:
            if generation > consumption:  # Charging
                charge_rate = min(generation - consumption, self.capacity_kw * 0.2)
                self.battery_level = min(100.0, self.battery_level + charge_rate * 0.1)
            elif self.battery_level > 20:  # Discharging
                discharge_rate = min(consumption - generation, self.capacity_kw * 0.15)
                self.battery_level = max(0.0, self.battery_level - discharge_rate * 0.1)

        # Calculate grid feed-in
        grid_feed_in = max(0, generation - consumption)

        # Generate reading
        reading = MeterReading(
            meter_id=self.meter_id,
            timestamp=now.isoformat(),
            building=self.building,
            floor=self.floor,
            meter_type=self.meter_type,
            phase_type=self.phase_type,
            energy_consumed=round(consumption, 2),
            energy_generated=round(generation, 2),
            voltage=230 + random.uniform(-5, 5),
            current=round(consumption / 230 * 1000, 2),
            power_factor=0.95 + random.uniform(-0.05, 0.05),
            battery_level=round(self.battery_level, 2) if self.has_battery and self.battery_level is not None else None,
            solar_generation=round(generation, 2) if self.has_solar else None,
            grid_feed_in=round(grid_feed_in, 2),
            temperature=25 + random.uniform(-2, 2),
            humidity=60 + random.uniform(-10, 10),
        )

        self.last_reading = reading
        return reading

    def stop(self):
        """Stop the meter simulation"""
        self.is_running = False


class CampusNetworkSimulator:
    """UTCC Campus Network Simulator managing all 25 meters"""

    def __init__(self, config_file: str, force_daylight: bool = False, use_local_time: bool = True):
        self.config = self._load_config(config_file)
        self.meters: List[SmartMeter] = []
        self.is_running = False
        self.readings_buffer: List[Dict] = []
        self.api_server = None
        
        # Solar generation configuration
        self.force_daylight = force_daylight
        self.use_local_time = use_local_time

        # Initialize WebSocket manager
        self.websocket_manager = WebSocketManager()

        # Initialize InfluxDB client
        self.influx_client = None
        self.write_api = None
        self._init_influxdb()

        # API Gateway publishing configuration
        self.gateway_enabled = os.getenv("PUBLISH_TO_GATEWAY", "false").lower() in ("true", "1", "yes", "on")
        self.gateway_url = os.getenv("API_GATEWAY_URL", "http://localhost:8080")
        self.gateway_jwt = os.getenv("API_GATEWAY_JWT", "")
        self.gateway_timeout = int(os.getenv("API_GATEWAY_TIMEOUT", "10"))
        self.engineering_signature = os.getenv("ENGINEERING_AUTH_SIGNATURE", "simulated-signature")
        self.gateway_session: Optional[ClientSession] = None

        # Initialize IEEE 2030.5 components
        self.ieee2030_5_enabled = False
        self.ieee2030_5_server = None
        self.ieee2030_5_clients = {}
        self.ieee2030_5_security = None
        self._init_ieee2030_5()

        # Initialize meters
        self._initialize_meters()

        logger.info(
            f"Campus Network Simulator initialized with {len(self.meters)} meters"
        )

    def _load_config(self, config_file: str) -> Dict:
        """Load campus configuration"""
        config_path = Path(config_file)
        if not config_path.exists():
            logger.error(f"Configuration file not found: {config_file}")
            sys.exit(1)

        with open(config_path, "r") as f:
            config = json.load(f)

        logger.info(f"Loaded configuration for {config['campus']['name']}")
        return config

    def _initialize_meters(self):
        """Initialize all smart meters from configuration"""
        for meter_config in self.config.get("meters", []):
            meter = SmartMeter(meter_config)
            self.meters.append(meter)

    def _init_influxdb(self):
        """Initialize InfluxDB client for meter data storage"""
        if not INFLUXDB_AVAILABLE:
            logger.info("InfluxDB integration disabled - module not available")
            self.influx_client = None
            self.write_api = None
            return

        # Enable InfluxDB by default, but allow override via environment variable
        influx_enabled_env = os.getenv("INFLUXDB_ENABLED", "true").lower()
        influx_enabled = influx_enabled_env in ("true", "1", "yes", "on")

        if not influx_enabled:
            logger.info("InfluxDB integration disabled by configuration")
            self.influx_client = None
            self.write_api = None
            return

        try:
            influx_url = os.getenv("INFLUXDB_URL", "http://localhost:8086")
            influx_token = os.getenv("INFLUXDB_TOKEN", "")
            influx_org = os.getenv("INFLUXDB_ORG", "gridtokenx")

            if not influx_token:
                logger.warning("InfluxDB token not provided - using default empty token (may not work)")
                # Don't disable InfluxDB, just warn - some InfluxDB setups might work without token

            self.influx_client = InfluxDBClient(  # type: ignore
                url=influx_url,
                token=influx_token,
                org=influx_org
            )

            self.write_api = self.influx_client.write_api(write_options=SYNCHRONOUS)  # type: ignore
            logger.info(f"InfluxDB client initialized for {influx_url}")

        except Exception as e:
            logger.error(f"Failed to initialize InfluxDB client: {e}")
            self.influx_client = None
            self.write_api = None

    def _init_ieee2030_5(self):
        """Initialize IEEE 2030.5 components if enabled"""
        if not IEEE2030_5_AVAILABLE:
            logger.info("IEEE 2030.5 support disabled - modules not available")
            return

        ieee2030_5_enabled = os.getenv("IEEE2030_5_ENABLED", "true").lower() == "true"
        if not ieee2030_5_enabled:
            logger.info("IEEE 2030.5 support disabled")
            return

        try:
            # Initialize IEEE 2030.5 components
            self.ieee2030_5_server = IEEE20305Server(  # type: ignore
                host=os.getenv("IEEE2030_5_HOST", "0.0.0.0"),
                port=int(os.getenv("IEEE2030_5_PORT", "8443")),
                cert_file=None,  # Disable SSL for now
                key_file=None
            )
            self.ieee2030_5_clients = {}
            self.ieee2030_5_security = SecurityManager()  # type: ignore

            # Note: Client registration will happen in start() after server is running
            self.ieee2030_5_enabled = True
            logger.info("IEEE 2030.5 components initialized (clients will register after server starts)")

        except Exception as e:
            logger.error(f"Failed to initialize IEEE 2030.5: {e}")
            self.ieee2030_5_enabled = False

    async def _register_ieee2030_5_clients(self):
        """Register IEEE 2030.5 clients after server is running"""
        if not self.ieee2030_5_enabled or not self.ieee2030_5_server or not self.ieee2030_5_security:
            logger.warning("IEEE 2030.5 client registration skipped - components not ready")
            return

        logger.info("Starting IEEE 2030.5 client registration...")
        try:
            # Register meters with IEEE 2030.5
            for meter_config in self.config.get("meters", []):
                meter_id = meter_config["id"]
                device_lfdi = meter_config.get("lfdi", f"LFDI_{meter_id}")

                # Register device with security manager
                device_info = {
                    "organization": "UTCC University",
                    "device_category": meter_config.get("type", "smart_meter")
                }
                self.ieee2030_5_security.register_device(device_lfdi, device_info)

                # Create client
                client = IEEE20305Client(  # type: ignore
                    server_url=f"http://localhost:{self.ieee2030_5_server.port}",
                    security_manager=self.ieee2030_5_security,
                    device_lfdi=device_lfdi
                )

                # Register device with server - add retry logic
                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        logger.info(f"Attempting to register IEEE 2030.5 client for meter {meter_id} (attempt {attempt + 1}/{max_retries})")
                        if client.register_device(device_info):
                            client.register_mirror_usage_point(meter_config)
                            self.ieee2030_5_clients[meter_id] = client
                            logger.info(f"✅ IEEE 2030.5 client registered for meter {meter_id}")
                            break
                        else:
                            logger.warning(f"❌ Failed to register IEEE 2030.5 client for meter {meter_id} (attempt {attempt + 1})")
                            if attempt < max_retries - 1:
                                await asyncio.sleep(2)  # Wait before retry
                    except Exception as e:
                        logger.error(f"❌ Exception during IEEE 2030.5 client registration for meter {meter_id} (attempt {attempt + 1}): {e}")
                        if attempt < max_retries - 1:
                            await asyncio.sleep(2)  # Wait before retry
                        else:
                            logger.error(f"❌ Failed to register IEEE 2030.5 client for meter {meter_id} after {max_retries} attempts")

            logger.info(f"IEEE 2030.5 client registration complete: {len(self.ieee2030_5_clients)} clients connected")

        except Exception as e:
            logger.error(f"Failed to register IEEE 2030.5 clients: {e}")

    async def _send_to_influxdb(self, readings: List[Dict]):
        """Send meter readings to InfluxDB"""
        if not self.write_api:
            logger.debug("InfluxDB write API not available - skipping data storage")
            return

        try:
            bucket = os.getenv("INFLUXDB_BUCKET", "meter_readings_2y")
            points = []

            for reading in readings:
                point = (Point("meter_readings")  # type: ignore
                    .tag("meter_id", reading["meter_id"])
                    .tag("building", reading["building"])
                    .tag("floor", str(reading["floor"]))
                    .tag("meter_type", reading["meter_type"])
                    .tag("phase_type", reading["phase_type"])
                    .field("energy_consumed", float(reading["energy_consumed"]))
                    .field("energy_generated", float(reading["energy_generated"]))
                    .field("voltage", float(reading["voltage"]))
                    .field("current", float(reading["current"]))
                    .field("power_factor", float(reading["power_factor"]))
                    .field("temperature", float(reading["temperature"]))
                    .field("humidity", float(reading["humidity"])))

                # Optional fields - ensure all are floats for consistency
                if reading.get("battery_level") is not None:
                    point = point.field("battery_level", float(reading["battery_level"]))
                if reading.get("solar_generation") is not None:
                    point = point.field("solar_generation", float(reading["solar_generation"]))
                if reading.get("grid_feed_in") is not None:
                    point = point.field("grid_feed_in", float(reading["grid_feed_in"]))

                # Set timestamp
                timestamp = datetime.fromisoformat(reading["timestamp"].replace('Z', '+00:00'))
                point = point.time(timestamp, WritePrecision.NS)  # type: ignore

                points.append(point)

            # Write points to InfluxDB
            self.write_api.write(bucket=bucket, record=points)
            logger.debug(f"✅ Stored {len(points)} meter readings in InfluxDB")

        except Exception as e:
            logger.error(f"❌ Failed to send data to InfluxDB: {e}")
            raise  # Re-raise so calling code knows it failed

    async def _ensure_gateway_session(self):
        """Ensure an aiohttp session exists for API Gateway calls"""
        if self.gateway_session is None or self.gateway_session.closed:
            # Use a small connection pool; disable SSL verification only if necessary
            self.gateway_session = ClientSession(connector=TCPConnector(ssl=False))

    async def _publish_readings_to_gateway(self, readings: List[Dict]):
        """Publish meter readings to API Gateway /api/v1/meters/readings"""
        if not self.gateway_enabled:
            return
        if not self.gateway_jwt:
            logger.warning("PUBLISH_TO_GATEWAY enabled but API_GATEWAY_JWT not set - skipping publish")
            return

        await self._ensure_gateway_session()

        submit_url = self.gateway_url.rstrip("/") + "/api/v1/meters/readings"
        headers = {
            "Authorization": f"Bearer {self.gateway_jwt}",
            "Content-Type": "application/json",
        }

        # Send one-by-one to keep server-side simple; could batch in future
        for r in readings:
            payload = {
                "meter_id": r["meter_id"],
                "timestamp": r["timestamp"],
                "energy_generated": r.get("energy_generated", 0.0),
                "energy_consumed": r.get("energy_consumed", 0.0),
                "solar_irradiance": None,
                "temperature": r.get("temperature"),
                "engineering_authority_signature": self.engineering_signature,
                "metadata": {
                    "location": r.get("building", "unknown"),
                    "device_type": r.get("meter_type", "smart_meter"),
                    "weather_conditions": None,
                },
            }

            try:
                timeout = aiohttp.ClientTimeout(total=self.gateway_timeout)
                async with self.gateway_session.post(submit_url, headers=headers, json=payload, timeout=timeout) as resp:
                    if resp.status >= 200 and resp.status < 300:
                        logger.debug(f"✅ Published reading for {r['meter_id']} to API Gateway")
                    elif resp.status == 401:
                        logger.error("❌ API Gateway unauthorized (401). Check API_GATEWAY_JWT")
                        # Do not spam; break this cycle
                        break
                    else:
                        text = await resp.text()
                        logger.warning(f"⚠️ Failed to publish reading for {r['meter_id']}: {resp.status} {text}")
            except Exception as e:
                logger.error(f"❌ Exception publishing to API Gateway for meter {r.get('meter_id')}: {e}")

    async def collect_readings(self, simulation_interval: int = 15):
        """Collect readings from all meters periodically"""
        while self.is_running:
            readings = []
            for meter in self.meters:
                reading = meter.generate_reading(
                    use_local_time=self.use_local_time,
                    force_daylight=self.force_daylight
                )
                readings.append(reading.to_dict())

                # Send to IEEE 2030.5 if enabled
                if self.ieee2030_5_enabled and meter.meter_id in self.ieee2030_5_clients:
                    try:
                        client = self.ieee2030_5_clients[meter.meter_id]
                        # Convert to IEEE 2030.5 MeterReading format
                        ieee_reading = IEEE20305MeterReading(  # type: ignore
                            reading_type="energy",
                            value=reading.energy_consumed,
                            uom="kW",
                            quality="valid",
                            timestamp=datetime.fromisoformat(reading.timestamp.replace('Z', '+00:00'))
                        )
                        client.send_meter_reading(ieee_reading)
                    except Exception as e:
                        logger.error(f"Failed to send IEEE 2030.5 reading for {meter.meter_id}: {e}")

            # Store in buffer
            self.readings_buffer = readings

            # Broadcast readings via WebSocket
            await self.websocket_manager.broadcast_readings(readings)

            # Generate and broadcast campus summary
            if readings:
                summary = {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "campus": self.config["campus"]["name"],
                    "total_meters": len(self.meters),
                    "total_consumption": sum(r["energy_consumed"] for r in readings),
                    "total_generation": sum(r["energy_generated"] for r in readings),
                    "total_grid_feed_in": sum(r["grid_feed_in"] for r in readings),
                    "prosumer_count": sum(1 for m in self.meters if m.meter_type == "prosumer"),
                    "consumer_count": sum(1 for m in self.meters if m.meter_type == "consumer"),
                    "three_phase_count": sum(1 for m in self.meters if m.phase_type == "3-phase"),
                    "single_phase_count": sum(1 for m in self.meters if m.phase_type == "single-phase"),
                    "meters_with_solar": sum(1 for m in self.meters if m.has_solar),
                    "meters_with_battery": sum(1 for m in self.meters if m.has_battery),
                    "average_battery_level": sum(
                        m.battery_level for m in self.meters if m.battery_level
                    ) / sum(1 for m in self.meters if m.battery_level)
                    if any(m.battery_level for m in self.meters)
                    else 0,
                }
                await self.websocket_manager.broadcast_summary(summary)

            # Publish to API Gateway (best effort; non-blocking for failures)
            try:
                await self._publish_readings_to_gateway(readings)
            except Exception as e:
                logger.error(f"Failed to publish readings to API Gateway: {e}")

            # Always attempt to send to InfluxDB (data persistence is critical)
            try:
                await self._send_to_influxdb(readings)
            except Exception as e:
                logger.error(f"Failed to store readings in InfluxDB: {e}")
                # Continue running even if InfluxDB fails - data is still in buffer

            # Log summary
            total_consumption = sum(r["energy_consumed"] for r in readings)
            total_generation = sum(r["energy_generated"] for r in readings)
            total_feed_in = sum(r["grid_feed_in"] for r in readings)

            logger.info(
                f"Campus Summary - Consumption: {total_consumption:.2f} kW, "
                f"Generation: {total_generation:.2f} kW, "
                f"Grid Feed-in: {total_feed_in:.2f} kW, "
                f"WebSocket Clients: {len(self.websocket_manager.connections)}"
            )

            # Wait for next collection cycle
            await asyncio.sleep(simulation_interval)

    async def handle_health(self, request):
        """Health check endpoint"""
        return web.json_response(
            {
                "status": "healthy",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "meters_active": len(self.meters),
                "campus": self.config["campus"]["name"],
            }
        )

    async def handle_meters(self, request):
        """Get all meter information"""
        meters_info = []
        for meter in self.meters:
            meters_info.append(
                {
                    "meter_id": meter.meter_id,
                    "building": meter.building,
                    "floor": meter.floor,
                    "type": meter.meter_type,
                    "phase_type": meter.phase_type,
                    "capacity_kw": meter.capacity_kw,
                    "has_solar": meter.has_solar,
                    "has_battery": meter.has_battery,
                    "battery_level": meter.battery_level,
                }
            )
        return web.json_response(meters_info)

    async def handle_readings(self, request):
        """Get latest readings from all meters"""
        return web.json_response(self.readings_buffer)

    async def handle_meter_reading(self, request):
        """Get reading for specific meter"""
        meter_id = request.match_info.get("meter_id")

        for reading in self.readings_buffer:
            if reading["meter_id"] == meter_id:
                return web.json_response(reading)

        return web.json_response({"error": "Meter not found"}, status=404)

    async def handle_campus_summary(self, request):
        """Get campus-wide energy summary"""
        if not self.readings_buffer:
            return web.json_response({"error": "No readings available"}, status=503)

        summary = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "campus": self.config["campus"]["name"],
            "total_meters": len(self.meters),
            "total_consumption": sum(
                r["energy_consumed"] for r in self.readings_buffer
            ),
            "total_generation": sum(
                r["energy_generated"] for r in self.readings_buffer
            ),
            "total_grid_feed_in": sum(r["grid_feed_in"] for r in self.readings_buffer),
            "prosumer_count": sum(1 for m in self.meters if m.meter_type == "prosumer"),
            "consumer_count": sum(1 for m in self.meters if m.meter_type == "consumer"),
            "three_phase_count": sum(1 for m in self.meters if m.phase_type == "3-phase"),
            "single_phase_count": sum(1 for m in self.meters if m.phase_type == "single-phase"),
            "meters_with_solar": sum(1 for m in self.meters if m.has_solar),
            "meters_with_battery": sum(1 for m in self.meters if m.has_battery),
            "average_battery_level": sum(
                m.battery_level for m in self.meters if m.battery_level
            )
            / sum(1 for m in self.meters if m.battery_level)
            if any(m.battery_level for m in self.meters)
            else 0,
        }

        return web.json_response(summary)

    async def handle_ieee2030_5_status(self, request):
        """Get IEEE 2030.5 status"""
        if not self.ieee2030_5_enabled:
            return web.json_response({"error": "IEEE 2030.5 not enabled"}, status=503)

        status = {
            "enabled": self.ieee2030_5_enabled,
            "server_port": getattr(self.ieee2030_5_server, 'port', None) if self.ieee2030_5_server else None,
            "clients_connected": len(self.ieee2030_5_clients),
            "server_running": self.ieee2030_5_server is not None,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        return web.json_response(status)

    async def handle_ieee2030_5_clients(self, request):
        """Get IEEE 2030.5 client information"""
        if not self.ieee2030_5_enabled:
            return web.json_response({"error": "IEEE 2030.5 not enabled"}, status=503)

        clients_info = []
        for meter_id, client in self.ieee2030_5_clients.items():
            clients_info.append({
                "meter_id": meter_id,
                "device_lfdi": getattr(client, 'device_lfdi', 'unknown'),
                "server_url": getattr(client, 'server_url', 'unknown'),
                "connected": True
            })

        return web.json_response({"clients": clients_info})

    async def handle_websocket_readings(self, request):
        """WebSocket endpoint for real-time meter readings"""
        websocket = web.WebSocketResponse()
        await websocket.prepare(request)

        logger.info("New WebSocket connection for readings")
        await self.websocket_manager.add_connection(websocket)

        try:
            async for msg in websocket:
                if msg.type == WSMsgType.TEXT:
                    try:
                        data = json.loads(msg.data)
                        if data.get("type") == "ping":
                            await websocket.send_json({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
                        elif data.get("type") == "subscribe":
                            # Send current readings immediately upon subscription
                            if self.readings_buffer:
                                await websocket.send_json({
                                    "type": "readings_update",
                                    "timestamp": datetime.now(timezone.utc).isoformat(),
                                    "data": self.readings_buffer
                                })
                            await websocket.send_json({
                                "type": "subscribed",
                                "message": "Successfully subscribed to real-time readings",
                                "meters_count": len(self.meters),
                                "update_interval": self.simulation_interval
                            })
                    except json.JSONDecodeError:
                        await websocket.send_json({"type": "error", "message": "Invalid JSON format"})
                elif msg.type == WSMsgType.ERROR:
                    logger.error(f"WebSocket error: {websocket.exception()}")
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
        finally:
            await self.websocket_manager.remove_connection(websocket)

        return websocket

    async def handle_websocket_summary(self, request):
        """WebSocket endpoint for real-time campus summary"""
        websocket = web.WebSocketResponse()
        await websocket.prepare(request)

        logger.info("New WebSocket connection for summary")
        await self.websocket_manager.add_connection(websocket)

        try:
            async for msg in websocket:
                if msg.type == WSMsgType.TEXT:
                    try:
                        data = json.loads(msg.data)
                        if data.get("type") == "ping":
                            await websocket.send_json({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
                        elif data.get("type") == "subscribe":
                            # Send current summary immediately upon subscription
                            if self.readings_buffer:
                                summary = {
                                    "timestamp": datetime.now(timezone.utc).isoformat(),
                                    "campus": self.config["campus"]["name"],
                                    "total_meters": len(self.meters),
                                    "total_consumption": sum(r["energy_consumed"] for r in self.readings_buffer),
                                    "total_generation": sum(r["energy_generated"] for r in self.readings_buffer),
                                    "total_grid_feed_in": sum(r["grid_feed_in"] for r in self.readings_buffer),
                                    "prosumer_count": sum(1 for m in self.meters if m.meter_type == "prosumer"),
                                    "consumer_count": sum(1 for m in self.meters if m.meter_type == "consumer"),
                                    "three_phase_count": sum(1 for m in self.meters if m.phase_type == "3-phase"),
                                    "single_phase_count": sum(1 for m in self.meters if m.phase_type == "single-phase"),
                                    "meters_with_solar": sum(1 for m in self.meters if m.has_solar),
                                    "meters_with_battery": sum(1 for m in self.meters if m.has_battery),
                                    "average_battery_level": sum(
                                        m.battery_level for m in self.meters if m.battery_level
                                    ) / sum(1 for m in self.meters if m.battery_level)
                                    if any(m.battery_level for m in self.meters)
                                    else 0,
                                }
                                await websocket.send_json({
                                    "type": "summary_update",
                                    "timestamp": datetime.now(timezone.utc).isoformat(),
                                    "data": summary
                                })
                            await websocket.send_json({
                                "type": "subscribed",
                                "message": "Successfully subscribed to real-time summary",
                                "update_interval": self.simulation_interval
                            })
                    except json.JSONDecodeError:
                        await websocket.send_json({"type": "error", "message": "Invalid JSON format"})
                elif msg.type == WSMsgType.ERROR:
                    logger.error(f"WebSocket error: {websocket.exception()}")
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
        finally:
            await self.websocket_manager.remove_connection(websocket)

        return websocket

    async def test_energy_generation(self) -> Dict:
        """Test prosumer energy generation during daytime hours"""
        logger.info("Running energy generation test...")

        # Create test datetime for noon (peak solar generation)
        test_datetime = datetime(2024, 9, 30, 12, 0, 0, tzinfo=timezone.utc)

        # Test generation with mocked time
        prosumer_generation = []
        consumer_generation = []

        with patch('simulator.datetime') as mock_datetime:
            mock_datetime.now.return_value = test_datetime
            mock_datetime.fromtimestamp = datetime.fromtimestamp
            mock_datetime.fromisoformat = datetime.fromisoformat

            for meter in self.meters:
                reading = meter.generate_reading()
                if meter.meter_type == "prosumer":
                    prosumer_generation.append(reading.energy_generated)
                else:
                    consumer_generation.append(reading.energy_generated)

        total_prosumer_gen = sum(prosumer_generation)
        total_consumer_gen = sum(consumer_generation)
        prosumer_count = len([m for m in self.meters if m.meter_type == "prosumer"])
        consumer_count = len([m for m in self.meters if m.meter_type == "consumer"])

        result = {
            "test_type": "energy_generation_test",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "prosumer_generation": total_prosumer_gen,
            "consumer_generation": total_consumer_gen,
            "prosumer_count": prosumer_count,
            "consumer_count": consumer_count,
            "generating_prosumers": sum(1 for g in prosumer_generation if g > 0),
            "test_passed": total_prosumer_gen > 0 and total_consumer_gen == 0,
            "message": "✅ Prosumers generate energy, consumers do not" if (total_prosumer_gen > 0 and total_consumer_gen == 0) else "❌ Generation test failed"
        }

        logger.info(f"Energy generation test result: {result['message']}")
        return result

    async def test_daytime_generation_curve(self) -> Dict:
        """Test solar generation curve across full daytime period (9 AM - 5 PM)"""
        logger.info("Running daytime generation curve test...")

        # Test hours from 9 AM to 5 PM
        daytime_hours = list(range(9, 18))  # 9 to 17 (5 PM)
        hourly_results = []

        for hour in daytime_hours:
            test_datetime = datetime(2024, 9, 30, hour, 0, 0, tzinfo=timezone.utc)

            with patch('simulator.datetime') as mock_datetime:
                mock_datetime.now.return_value = test_datetime
                mock_datetime.fromtimestamp = datetime.fromtimestamp
                mock_datetime.fromisoformat = datetime.fromisoformat

                total_generation = sum(meter.generate_reading().energy_generated for meter in self.meters)
                hourly_results.append({
                    "hour": hour,
                    "time": f"{hour:2d}:00{' PM' if hour > 12 else ' AM'}",
                    "total_generation": total_generation
                })

        # Calculate statistics
        peak_generation = max(hourly_results, key=lambda x: x['total_generation'])
        avg_generation = sum(r['total_generation'] for r in hourly_results) / len(hourly_results)
        estimated_daily = avg_generation * 8  # 8 hours of generation

        result = {
            "test_type": "daytime_generation_curve",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "hourly_data": hourly_results,
            "peak_generation": peak_generation,
            "average_hourly_generation": avg_generation,
            "estimated_daily_generation": estimated_daily,
            "test_passed": peak_generation['total_generation'] > 0,
            "message": f"✅ Peak generation: {peak_generation['time']} - {peak_generation['total_generation']:.1f} kW"
        }

        logger.info(f"Daytime generation curve test completed: {result['message']}")
        return result

    async def analyze_campus_energy_balance(self) -> Dict:
        """Analyze current campus energy balance"""
        if not self.readings_buffer:
            # Generate a reading to analyze
            logger.info("No readings available, generating current reading for analysis...")
            readings = []
            for meter in self.meters:
                reading = meter.generate_reading()
                readings.append(reading.to_dict())
        else:
            readings = self.readings_buffer

        # Calculate totals
        total_consumption = sum(r["energy_consumed"] for r in readings)
        total_generation = sum(r["energy_generated"] for r in readings)
        total_feed_in = sum(r["grid_feed_in"] for r in readings)

        # Calculate net energy balance
        net_balance = total_generation - total_consumption

        # Analyze by meter type
        prosumer_readings = [r for r in readings if r["meter_type"] == "prosumer"]
        consumer_readings = [r for r in readings if r["meter_type"] == "consumer"]

        prosumer_consumption = sum(r["energy_consumed"] for r in prosumer_readings)
        prosumer_generation = sum(r["energy_generated"] for r in prosumer_readings)
        consumer_consumption = sum(r["energy_consumed"] for r in consumer_readings)

        # Phase analysis
        three_phase_readings = [r for r in readings if r["phase_type"] == "3-phase"]
        single_phase_readings = [r for r in readings if r["phase_type"] == "single-phase"]

        result = {
            "analysis_type": "campus_energy_balance",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "overall_balance": {
                "total_consumption": total_consumption,
                "total_generation": total_generation,
                "total_grid_feed_in": total_feed_in,
                "net_balance": net_balance,
                "self_sufficiency_ratio": (total_generation / total_consumption) if total_consumption > 0 else 0
            },
            "by_meter_type": {
                "prosumers": {
                    "count": len(prosumer_readings),
                    "consumption": prosumer_consumption,
                    "generation": prosumer_generation,
                    "net_contribution": prosumer_generation - prosumer_consumption
                },
                "consumers": {
                    "count": len(consumer_readings),
                    "consumption": consumer_consumption,
                    "generation": 0,
                    "net_contribution": -consumer_consumption
                }
            },
            "by_phase_type": {
                "three_phase": {
                    "count": len(three_phase_readings),
                    "consumption": sum(r["energy_consumed"] for r in three_phase_readings),
                    "generation": sum(r["energy_generated"] for r in three_phase_readings)
                },
                "single_phase": {
                    "count": len(single_phase_readings),
                    "consumption": sum(r["energy_consumed"] for r in single_phase_readings),
                    "generation": sum(r["energy_generated"] for r in single_phase_readings)
                }
            },
            "battery_status": {
                "meters_with_battery": sum(1 for m in self.meters if m.has_battery),
                "average_battery_level": sum(
                    m.battery_level for m in self.meters if m.battery_level
                ) / sum(1 for m in self.meters if m.battery_level)
                if any(m.battery_level for m in self.meters)
                else 0
            }
        }

        logger.info(f"Campus energy balance analysis completed: Net balance = {net_balance:.2f} kW")
        return result

    async def run_diagnostic_tests(self) -> Dict:
        """Run comprehensive diagnostic tests on the simulator"""
        logger.info("Running comprehensive diagnostic tests...")

        tests = {}

        # Test 1: Energy generation test
        try:
            tests["energy_generation"] = await self.test_energy_generation()
        except Exception as e:
            tests["energy_generation"] = {"error": str(e), "test_passed": False}

        # Test 2: Daytime generation curve
        try:
            tests["daytime_generation"] = await self.test_daytime_generation_curve()
        except Exception as e:
            tests["daytime_generation"] = {"error": str(e), "test_passed": False}

        # Test 3: Current energy balance
        try:
            tests["energy_balance"] = await self.analyze_campus_energy_balance()
        except Exception as e:
            tests["energy_balance"] = {"error": str(e)}

        # Overall test results
        passed_tests = sum(1 for test in tests.values() if test.get("test_passed", False))
        total_tests = len([t for t in tests.values() if "test_passed" in t])

        result = {
            "diagnostic_type": "comprehensive_simulator_test",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tests_run": tests,
            "summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": total_tests - passed_tests,
                "success_rate": (passed_tests / total_tests) if total_tests > 0 else 0,
                "overall_status": "✅ All tests passed" if passed_tests == total_tests else f"⚠️ {total_tests - passed_tests} test(s) failed"
            },
            "simulator_status": {
                "meters_active": len(self.meters),
                "websocket_connections": len(self.websocket_manager.connections),
                "influxdb_enabled": self.write_api is not None,
                "ieee2030_5_enabled": self.ieee2030_5_enabled
            }
        }

        logger.info(f"Diagnostic tests completed: {result['summary']['overall_status']}")
        return result

    async def handle_websocket_status(self, request):
        """Get WebSocket connection status"""
        return web.json_response({
            "websocket_enabled": True,
            "active_connections": len(self.websocket_manager.connections),
            "simulation_interval": self.simulation_interval,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    async def handle_test_energy_generation(self, request):
        """Run energy generation test"""
        try:
            result = await self.test_energy_generation()
            return web.json_response(result)
        except Exception as e:
            logger.error(f"Energy generation test failed: {e}")
            return web.json_response({"error": str(e)}, status=500)

    async def handle_test_daytime_generation(self, request):
        """Run daytime generation curve test"""
        try:
            result = await self.test_daytime_generation_curve()
            return web.json_response(result)
        except Exception as e:
            logger.error(f"Daytime generation test failed: {e}")
            return web.json_response({"error": str(e)}, status=500)

    async def handle_analyze_energy_balance(self, request):
        """Analyze current campus energy balance"""
        try:
            result = await self.analyze_campus_energy_balance()
            return web.json_response(result)
        except Exception as e:
            logger.error(f"Energy balance analysis failed: {e}")
            return web.json_response({"error": str(e)}, status=500)

    async def handle_run_diagnostic_tests(self, request):
        """Run comprehensive diagnostic tests"""
        try:
            result = await self.run_diagnostic_tests()
            return web.json_response(result)
        except Exception as e:
            logger.error(f"Diagnostic tests failed: {e}")
            return web.json_response({"error": str(e)}, status=500)

    async def setup_api_server(self, app):
        """Setup API routes"""
        app.router.add_get("/health", self.handle_health)
        app.router.add_get("/api/meters", self.handle_meters)
        app.router.add_get("/api/readings", self.handle_readings)
        app.router.add_get("/api/meters/{meter_id}/reading", self.handle_meter_reading)
        app.router.add_get("/api/campus/summary", self.handle_campus_summary)

        # WebSocket endpoints for real-time data
        app.router.add_get("/ws/readings", self.handle_websocket_readings)
        app.router.add_get("/ws/summary", self.handle_websocket_summary)
        app.router.add_get("/api/websocket/status", self.handle_websocket_status)

        # Testing and diagnostic endpoints
        app.router.add_get("/api/test/energy-generation", self.handle_test_energy_generation)
        app.router.add_get("/api/test/daytime-generation", self.handle_test_daytime_generation)
        app.router.add_get("/api/analyze/energy-balance", self.handle_analyze_energy_balance)
        app.router.add_get("/api/diagnostic/tests", self.handle_run_diagnostic_tests)

        # IEEE 2030.5 endpoints (if enabled)
        if self.ieee2030_5_enabled:
            app.router.add_get("/api/ieee2030_5/status", self.handle_ieee2030_5_status)
            app.router.add_get("/api/ieee2030_5/clients", self.handle_ieee2030_5_clients)

        # Add index page
        app.router.add_get("/", self.handle_index)

    async def handle_index(self, request):
        """Simple index page with API documentation"""
        # Get the base URL for constructing links
        host = request.headers.get('Host', f'localhost:{self.api_port}')
        base_url = f"http://{host}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>UTCC GridTokenX Smart Meter Simulator</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                h1 {{ color: #2c3e50; }}
                .endpoint {{ background: #f4f4f4; padding: 10px; margin: 10px 0; border-radius: 5px; }}
                .method {{ color: #27ae60; font-weight: bold; }}
                .path {{ color: #2980b9; font-family: monospace; text-decoration: none; }}
                .path:hover {{ text-decoration: underline; }}
                .description {{ color: #555; }}
            </style>
        </head>
        <body>
            <h1>🏫 UTCC University GridTokenX Smart Meter Simulator</h1>
            <p>IEEE 2030.5-2018 Smart Energy Profile 2.0 - 25 Campus Meters</p>

            <h2>API Endpoints:</h2>
            <div class="endpoint">
                <span class="method">GET</span> 
                <a href="{base_url}/health" class="path">/health</a> 
                <span class="description">- Health check</span>
            </div>
            <div class="endpoint">
                <span class="method">GET</span> 
                <a href="{base_url}/api/meters" class="path">/api/meters</a> 
                <span class="description">- List all meters</span>
            </div>
            <div class="endpoint">
                <span class="method">GET</span> 
                <a href="{base_url}/api/readings" class="path">/api/readings</a> 
                <span class="description">- Get latest readings</span>
            </div>
            <div class="endpoint">
                <span class="method">GET</span> 
                <span class="path">/api/meters/{{meter_id}}/reading</span> 
                <span class="description">- Get specific meter reading (replace {{meter_id}} with actual meter ID)</span>
            </div>
            <div class="endpoint">
                <span class="method">GET</span> 
                <a href="{base_url}/api/campus/summary" class="path">/api/campus/summary</a> 
                <span class="description">- Campus energy summary</span>
            </div>
            <div class="endpoint">
                <span class="method">WS</span> 
                <span class="path">/ws/readings</span> 
                <span class="description">- Real-time meter readings via WebSocket</span>
            </div>
            <div class="endpoint">
                <span class="method">WS</span> 
                <span class="path">/ws/summary</span> 
                <span class="description">- Real-time campus summary via WebSocket</span>
            </div>
            <div class="endpoint">
                <span class="method">GET</span> 
                <a href="{base_url}/api/websocket/status" class="path">/api/websocket/status</a> 
                <span class="description">- WebSocket connection status</span>
            </div>
            <div class="endpoint">
                <span class="method">GET</span> 
                <a href="{base_url}/api/test/energy-generation" class="path">/api/test/energy-generation</a> 
                <span class="description">- Test prosumer energy generation</span>
            </div>
            <div class="endpoint">
                <span class="method">GET</span> 
                <a href="{base_url}/api/test/daytime-generation" class="path">/api/test/daytime-generation</a> 
                <span class="description">- Test daytime generation curve (9 AM - 5 PM)</span>
            </div>
            <div class="endpoint">
                <span class="method">GET</span> 
                <a href="{base_url}/api/analyze/energy-balance" class="path">/api/analyze/energy-balance</a> 
                <span class="description">- Analyze campus energy balance</span>
            </div>
            <div class="endpoint">
                <span class="method">GET</span> 
                <a href="{base_url}/api/diagnostic/tests" class="path">/api/diagnostic/tests</a> 
                <span class="description">- Run comprehensive diagnostic tests</span>
            </div>
            {f'''
            <div class="endpoint">
                <span class="method">GET</span> 
                <a href="{base_url}/api/ieee2030_5/status" class="path">/api/ieee2030_5/status</a> 
                <span class="description">- IEEE 2030.5 status</span>
            </div>
            <div class="endpoint">
                <span class="method">GET</span> 
                <a href="{base_url}/api/ieee2030_5/clients" class="path">/api/ieee2030_5/clients</a> 
                <span class="description">- IEEE 2030.5 clients</span>
            </div>
            ''' if self.ieee2030_5_enabled else ''}

            <h2>Status:</h2>
            <p>✅ Simulator is running</p>
            <p>📊 Collecting readings every {self.simulation_interval} seconds</p>
            <p>🔌 WebSocket: Enabled ({len(self.websocket_manager.connections)} active connections)</p>
            <p>💾 InfluxDB: {'Enabled' if self.write_api else 'Disabled'}</p>
            {f'<p>🔌 IEEE 2030.5: Enabled (Port {getattr(self.ieee2030_5_server, "port", "N/A")})</p>' if self.ieee2030_5_enabled else '<p>ℹ️ IEEE 2030.5: Disabled</p>'}
        </body>
        </html>
        """
        return web.Response(text=html_content, content_type="text/html")

    async def start(self, simulation_interval: int = 30):
        """Start the campus network simulator"""
        self.is_running = True

        # Load configuration from environment
        self.api_port = int(os.getenv("API_PORT", "4040"))
        self.simulation_interval = simulation_interval

        # Start IEEE 2030.5 server if enabled
        if self.ieee2030_5_enabled and self.ieee2030_5_server:
            try:
                await self.ieee2030_5_server.start_background()
                logger.info(f"IEEE 2030.5 server started on port {self.ieee2030_5_server.port}")

                # Wait longer for server to be fully ready and listening
                logger.info("Waiting for IEEE 2030.5 server to be ready...")
                await asyncio.sleep(5)

                # Verify server is actually running by checking if we can connect
                import socket
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(5)
                try:
                    result = sock.connect_ex(('localhost', self.ieee2030_5_server.port))
                    if result == 0:
                        logger.info("✅ IEEE 2030.5 server is listening and ready")
                        # Skip client registration for now due to timeout issues
                        logger.warning("⚠️ Skipping IEEE 2030.5 client registration due to server response issues")
                        logger.info("IEEE 2030.5 server is running - clients can connect manually if needed")
                    else:
                        logger.warning("⚠️ IEEE 2030.5 server may not be fully ready yet")
                except Exception as e:
                    logger.warning(f"Could not verify server status: {e}")
                finally:
                    sock.close()

                # Skip client registration for now - server is running
                # await self._register_ieee2030_5_clients()

            except Exception as e:
                logger.error(f"Failed to start IEEE 2030.5 server: {e}")
                self.ieee2030_5_enabled = False

        # Create web application
        app = web.Application()
        await self.setup_api_server(app)

        # Start reading collection task
        asyncio.create_task(self.collect_readings(self.simulation_interval))

        # Start web server
        logger.info(f"Starting API server on http://0.0.0.0:{self.api_port}")
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, "0.0.0.0", self.api_port)
        await site.start()

        print("\n" + "=" * 60)
        print("🏫 UTCC University GridTokenX Smart Meter Simulator")
        print("=" * 60)
        print(f"✅ Simulator started successfully!")
        print(f"📊 Managing {len(self.meters)} smart meters")
        print(f"🌐 API Server: http://localhost:{self.api_port}")
        print(f"� WebSocket: Enabled (ws://localhost:{self.api_port}/ws/readings)")
        print(f"�📈 Collecting readings every {self.simulation_interval} seconds")
        print(f"💾 InfluxDB Storage: {'Enabled' if self.write_api else 'Disabled'}")
        if self.ieee2030_5_enabled:
            print(f"IEEE 2030.5 Server: http://localhost:{getattr(self.ieee2030_5_server, 'port', 'N/A')}")
            print(f"IEEE 2030.5 Clients: Registration skipped (server running)")
        else:
            print("ℹIEEE 2030.5: Disabled")
        print(f"Logs: logs/simulator.log")
        print("\nPress Ctrl+C to stop the simulator")
        print("=" * 60 + "\n")

        # Keep running
        while self.is_running:
            await asyncio.sleep(1)

    def stop(self):
        """Stop the simulator"""
        self.is_running = False

        # Stop IEEE 2030.5 server
        if self.ieee2030_5_enabled and self.ieee2030_5_server:
            try:
                asyncio.create_task(self.ieee2030_5_server.stop())
                logger.info("IEEE 2030.5 server stopped")
            except Exception as e:
                logger.error(f"Error stopping IEEE 2030.5 server: {e}")

        # Disconnect IEEE 2030.5 clients
        for client in self.ieee2030_5_clients.values():
            try:
                client.disconnect()
            except Exception as e:
                logger.error(f"Error disconnecting IEEE 2030.5 client: {e}")

        for meter in self.meters:
            meter.stop()
        logger.info("Campus Network Simulator stopped")

        # Close API Gateway session
        if self.gateway_session and not self.gateway_session.closed:
            try:
                asyncio.create_task(self.gateway_session.close())
            except Exception:
                pass


async def generate_energy_data_now(config_file: str, use_local_time: bool = True, force_daylight: bool = False):
    """Generate and display current energy data for all meters
    
    Args:
        config_file: Path to configuration file
        use_local_time: Use local timezone for solar generation (default: True)
        force_daylight: Force peak solar generation (simulate noon)
    """
    print("\n🏫 UTCC University GridTokenX Smart Meter Simulator")
    print("=" * 60)
    print("Generating current energy data for all meters...")
    
    # Show timezone info
    from datetime import timedelta
    now_utc = datetime.now(timezone.utc)
    if force_daylight:
        print(f"🌞 FORCING DAYLIGHT MODE: Simulating PEAK solar generation (12:00 noon)")
        print(f"   Actual time: {now_utc.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    elif use_local_time:
        local_offset = int(os.getenv("LOCAL_TIMEZONE_OFFSET", "7"))
        local_now = now_utc + timedelta(hours=local_offset)
        print(f"Using LOCAL TIME for solar generation: {local_now.strftime('%Y-%m-%d %H:%M:%S')} (UTC+{local_offset})")
    else:
        print(f"Using UTC TIME for solar generation: {now_utc.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("=" * 60)

    # Create simulator instance (without starting the full server)
    simulator = CampusNetworkSimulator(
        config_file,
        force_daylight=force_daylight,
        use_local_time=use_local_time
    )

    # Generate readings for all meters
    readings = []
    for meter in simulator.meters:
        reading = meter.generate_reading(use_local_time=use_local_time, force_daylight=force_daylight)
        readings.append(reading.to_dict())

    # Display results
    print(f"\n📊 Generated {len(readings)} meter readings at {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("\n" + "=" * 120)
    print(f"{'Meter ID':<25} {'Building':<12} {'Type':<10} {'Phase':<12} {'Consumption':<12} {'Generation':<12} {'Grid Feed-in':<12} {'Solar':<8} {'Battery':<8}")
    print("=" * 120)

    total_consumption = 0
    total_generation = 0
    total_feed_in = 0
    prosumer_count = 0
    consumer_count = 0
    three_phase_count = 0
    single_phase_count = 0

    for reading in readings:
        meter_id = reading['meter_id']
        building = reading['building']
        meter_type = reading['meter_type']
        phase_type = reading['phase_type']
        consumption = reading['energy_consumed']
        generation = reading['energy_generated']
        feed_in = reading['grid_feed_in']
        solar = "Yes" if reading.get('solar_generation') else "No"
        battery = "Yes" if reading.get('battery_level') else "No"

        print(f"{meter_id:<25} {building:<12} {meter_type:<10} {phase_type:<12} {consumption:<12.2f} {generation:<12.2f} {feed_in:<12.2f} {solar:<8} {battery:<8}")

        total_consumption += consumption
        total_generation += generation
        total_feed_in += feed_in

        if meter_type == "prosumer":
            prosumer_count += 1
        else:
            consumer_count += 1

        if phase_type == "3-phase":
            three_phase_count += 1
        else:
            single_phase_count += 1

    print("=" * 120)
    print(f"{'TOTALS':<25} {'':<12} {'':<10} {'':<12} {total_consumption:<12.2f} {total_generation:<12.2f} {total_feed_in:<12.2f}")
    print()

    # Summary statistics
    net_balance = total_generation - total_consumption
    print("📈 Campus Energy Summary:")
    print(f"   • Total Meters: {len(readings)}")
    print(f"   • Prosumers: {prosumer_count} | Consumers: {consumer_count}")
    print(f"   • 3-Phase: {three_phase_count} | Single-Phase: {single_phase_count}")
    print(f"   • Total Consumption: {total_consumption:.2f} kW")
    print(f"   • Total Generation: {total_generation:.2f} kW")
    print(f"   • Net Balance: {net_balance:.2f} kW ({'Surplus' if net_balance > 0 else 'Deficit'})")
    print(f"   • Grid Feed-in: {total_feed_in:.2f} kW")
    print(f"   • Self-Sufficiency: {(total_generation/total_consumption*100):.1f}%" if total_consumption > 0 else "   • Self-Sufficiency: N/A")

    print("\n✅ Energy data generation completed!")


async def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="UTCC Smart Meter Simulator")
    parser.add_argument(
        "--config-file",
        default="config/utcc_campus_config.json",
        help="Path to campus configuration file",
    )
    parser.add_argument(
        "--disable-ieee2030-5",
        action="store_true",
        dest="disable_ieee2030_5",
        help="Disable IEEE 2030.5 Smart Energy Profile support (enabled by default)",
    )
    parser.add_argument(
        "--ieee2030-5-port",
        type=int,
        default=8443,
        help="Port for IEEE 2030.5 server (default: 8443)",
    )
    parser.add_argument(
        "--disable-influxdb",
        action="store_true",
        help="Disable InfluxDB data storage (enabled by default)",
    )
    parser.add_argument(
        "--simulation-interval",
        type=int,
        default=30,
        help="Interval in seconds between data collection cycles (default: 30, recommended: 30-300)",
    )
    parser.add_argument(
        "--generate-energy-data",
        action="store_true",
        help="Generate and display current energy data for all meters before starting the simulator",
    )
    parser.add_argument(
        "--use-utc-time",
        action="store_true",
        help="Use UTC time for solar generation instead of local time (default: use local time UTC+7)",
    )
    parser.add_argument(
        "--force-daylight",
        action="store_true",
        help="Force peak solar generation (simulate 12:00 noon) - useful for testing at night",
    )
    parser.add_argument(
        "--timezone-offset",
        type=int,
        default=7,
        help="Local timezone offset from UTC in hours (default: 7 for Thailand/Bangkok)",
    )
    parser.add_argument(
        "--enable-gateway-publish",
        action="store_true",
        help="Enable publishing readings to API Gateway (can also set PUBLISH_TO_GATEWAY=true)",
    )
    parser.add_argument(
        "--gateway-url",
        type=str,
        default=None,
        help="API Gateway base URL (e.g., http://localhost:8080)",
    )
    parser.add_argument(
        "--gateway-jwt",
        type=str,
        default=None,
        help="JWT token for API Gateway Authorization header",
    )
    parser.add_argument(
        "--engineering-signature",
        type=str,
        default=None,
        help="Engineering authority signature to satisfy gateway validation",
    )

    args = parser.parse_args()

    # Set timezone offset environment variable
    os.environ["LOCAL_TIMEZONE_OFFSET"] = str(args.timezone_offset)

    # Handle generate-energy-data command
    if args.generate_energy_data:
        # Priority: force_daylight > use_local_time > use_utc_time
        force_daylight = args.force_daylight
        use_local_time = not args.use_utc_time if not force_daylight else False
        await generate_energy_data_now(
            args.config_file, 
            use_local_time=use_local_time,
            force_daylight=force_daylight
        )
        print("\n🚀 Continuing to start the full simulator...\n")

    # Set environment variables based on command line args
    if args.disable_ieee2030_5:
        os.environ["IEEE2030_5_ENABLED"] = "false"

    if args.disable_influxdb:
        os.environ["INFLUXDB_ENABLED"] = "false"

    if args.enable_gateway_publish:
        os.environ["PUBLISH_TO_GATEWAY"] = "true"
    if args.gateway_url:
        os.environ["API_GATEWAY_URL"] = args.gateway_url
    if args.gateway_jwt:
        os.environ["API_GATEWAY_JWT"] = args.gateway_jwt
    if args.engineering_signature:
        os.environ["ENGINEERING_AUTH_SIGNATURE"] = args.engineering_signature

    # Determine solar generation mode for the running simulator
    force_daylight_mode = args.force_daylight
    use_local_time_mode = not args.use_utc_time if not force_daylight_mode else False
    
    # Log the solar generation mode
    if force_daylight_mode:
        logger.info("🌞 Running simulator in FORCE DAYLIGHT mode (peak solar generation)")
    elif use_local_time_mode:
        local_offset = int(os.getenv("LOCAL_TIMEZONE_OFFSET", "7"))
        logger.info(f"🌍 Running simulator with LOCAL TIME (UTC+{local_offset}) for solar generation")
    else:
        logger.info("🌐 Running simulator with UTC TIME for solar generation")

    # Create and start simulator
    simulator = CampusNetworkSimulator(
        args.config_file,
        force_daylight=force_daylight_mode,
        use_local_time=use_local_time_mode
    )

    try:
        await simulator.start(args.simulation_interval)
    except KeyboardInterrupt:
        print("\n\nShutting down simulator...")
        simulator.stop()
    except Exception as e:
        logger.error(f"Simulator error: {e}")
        simulator.stop()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
