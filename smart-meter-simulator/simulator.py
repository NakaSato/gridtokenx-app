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
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
import asyncio
from aiohttp import web
from dotenv import load_dotenv

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

        # Simulation state
        self.battery_level = 50.0 if self.has_battery else None
        self.is_running = True
        self.last_reading = None

        logger.info(
            f"Initialized meter {self.meter_id} - Type: {self.meter_type}, "
            f"Solar: {self.has_solar}, Battery: {self.has_battery}"
        )

    def generate_reading(self) -> MeterReading:
        """Generate realistic meter reading based on time of day"""
        now = datetime.now(timezone.utc)
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
            if 6 <= hour < 18:  # Daylight hours
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

    def __init__(self, config_file: str):
        self.config = self._load_config(config_file)
        self.meters: List[SmartMeter] = []
        self.is_running = False
        self.readings_buffer: List[Dict] = []
        self.api_server = None

        # Initialize InfluxDB client
        self.influx_client = None
        self.write_api = None
        self._init_influxdb()

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

                # Register device with server
                if client.register_device(device_info):
                    client.register_mirror_usage_point(meter_config)
                    self.ieee2030_5_clients[meter_id] = client
                    logger.info(f"✅ IEEE 2030.5 client registered for meter {meter_id}")
                else:
                    logger.warning(f"❌ Failed to register IEEE 2030.5 client for meter {meter_id}")

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
                    .field("energy_consumed", reading["energy_consumed"])
                    .field("energy_generated", reading["energy_generated"])
                    .field("voltage", reading["voltage"])
                    .field("current", reading["current"])
                    .field("power_factor", reading["power_factor"])
                    .field("temperature", reading["temperature"])
                    .field("humidity", reading["humidity"]))

                # Optional fields
                if reading.get("battery_level") is not None:
                    point = point.field("battery_level", reading["battery_level"])
                if reading.get("solar_generation") is not None:
                    point = point.field("solar_generation", reading["solar_generation"])
                if reading.get("grid_feed_in") is not None:
                    point = point.field("grid_feed_in", reading["grid_feed_in"])

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

    async def collect_readings(self, simulation_interval: int = 15):
        """Collect readings from all meters periodically"""
        while self.is_running:
            readings = []
            for meter in self.meters:
                reading = meter.generate_reading()
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
                f"Grid Feed-in: {total_feed_in:.2f} kW"
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

    async def setup_api_server(self, app):
        """Setup API routes"""
        app.router.add_get("/health", self.handle_health)
        app.router.add_get("/api/meters", self.handle_meters)
        app.router.add_get("/api/readings", self.handle_readings)
        app.router.add_get("/api/meters/{meter_id}/reading", self.handle_meter_reading)
        app.router.add_get("/api/campus/summary", self.handle_campus_summary)

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
            <p>💾 InfluxDB: {'Enabled' if self.write_api else 'Disabled'}</p>
            {f'<p>🔌 IEEE 2030.5: Enabled (Port {getattr(self.ieee2030_5_server, "port", "N/A")})</p>' if self.ieee2030_5_enabled else '<p>ℹ️ IEEE 2030.5: Disabled</p>'}
        </body>
        </html>
        """
        return web.Response(text=html_content, content_type="text/html")

    async def start(self):
        """Start the campus network simulator"""
        self.is_running = True

        # Load configuration from environment
        self.api_port = int(os.getenv("API_PORT", "4040"))
        self.simulation_interval = int(os.getenv("SIMULATION_INTERVAL", "15"))

        # Start IEEE 2030.5 server if enabled
        if self.ieee2030_5_enabled and self.ieee2030_5_server:
            try:
                await self.ieee2030_5_server.start_background()
                logger.info(f"IEEE 2030.5 server started on port {self.ieee2030_5_server.port}")

                # Wait a moment for server to be fully ready
                await asyncio.sleep(2)

                # Now register clients after server is running
                await self._register_ieee2030_5_clients()

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
        print(f"📈 Collecting readings every {self.simulation_interval} seconds")
        print(f"💾 InfluxDB Storage: {'Enabled' if self.write_api else 'Disabled'}")
        if self.ieee2030_5_enabled:
            print(f"IEEE 2030.5 Server: http://localhost:{getattr(self.ieee2030_5_server, 'port', 'N/A')}")
            print(f"IEEE 2030.5 Clients: {len(self.ieee2030_5_clients)} connected")
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

    args = parser.parse_args()

    # Set environment variables based on command line args
    if args.disable_ieee2030_5:
        os.environ["IEEE2030_5_ENABLED"] = "false"

    if args.disable_influxdb:
        os.environ["INFLUXDB_ENABLED"] = "false"

    # Create and start simulator
    simulator = CampusNetworkSimulator(args.config_file)

    try:
        await simulator.start()
    except KeyboardInterrupt:
        print("\n\nShutting down simulator...")
        simulator.stop()
    except Exception as e:
        logger.error(f"Simulator error: {e}")
        simulator.stop()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
