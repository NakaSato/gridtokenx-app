#!/usr/bin/env python3
"""
Simplified Smart Meter Simulator Runner for UTCC University GridTokenX Campus Network
IEEE 2030.5-2018 Smart Energy Profile 2.0
"""

import sys
import json
import time
import random
import logging
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field, asdict
import asyncio
import aiohttp
from aiohttp import web

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("logs/simulator.log")],
)
logger = logging.getLogger(__name__)


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
        if self.has_battery:
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
            battery_level=round(self.battery_level, 2) if self.has_battery else None,
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

    async def collect_readings(self):
        """Collect readings from all meters periodically"""
        while self.is_running:
            readings = []
            for meter in self.meters:
                reading = meter.generate_reading()
                readings.append(reading.to_dict())

            # Store in buffer
            self.readings_buffer = readings

            # Log summary
            total_consumption = sum(r["energy_consumed"] for r in readings)
            total_generation = sum(r["energy_generated"] for r in readings)
            total_feed_in = sum(r["grid_feed_in"] for r in readings)

            logger.info(
                f"Campus Summary - Consumption: {total_consumption:.2f} kW, "
                f"Generation: {total_generation:.2f} kW, "
                f"Grid Feed-in: {total_feed_in:.2f} kW"
            )

            # Wait for next collection cycle (15 seconds by default)
            await asyncio.sleep(15)

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

    async def setup_api_server(self, app):
        """Setup API routes"""
        app.router.add_get("/health", self.handle_health)
        app.router.add_get("/api/meters", self.handle_meters)
        app.router.add_get("/api/readings", self.handle_readings)
        app.router.add_get("/api/meters/{meter_id}/reading", self.handle_meter_reading)
        app.router.add_get("/api/campus/summary", self.handle_campus_summary)

        # Add index page
        app.router.add_get("/", self.handle_index)

    async def handle_index(self, request):
        """Simple index page with API documentation"""
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>UTCC GridTokenX Smart Meter Simulator</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #2c3e50; }
                .endpoint { background: #f4f4f4; padding: 10px; margin: 10px 0; border-radius: 5px; }
                .method { color: #27ae60; font-weight: bold; }
                .path { color: #2980b9; font-family: monospace; }
            </style>
        </head>
        <body>
            <h1>🏫 UTCC University GridTokenX Smart Meter Simulator</h1>
            <p>IEEE 2030.5-2018 Smart Energy Profile 2.0 - 25 Campus Meters</p>

            <h2>API Endpoints:</h2>
            <div class="endpoint">
                <span class="method">GET</span> <span class="path">/health</span> - Health check
            </div>
            <div class="endpoint">
                <span class="method">GET</span> <span class="path">/api/meters</span> - List all meters
            </div>
            <div class="endpoint">
                <span class="method">GET</span> <span class="path">/api/readings</span> - Get latest readings
            </div>
            <div class="endpoint">
                <span class="method">GET</span> <span class="path">/api/meters/{meter_id}/reading</span> - Get specific meter reading
            </div>
            <div class="endpoint">
                <span class="method">GET</span> <span class="path">/api/campus/summary</span> - Campus energy summary
            </div>

            <h2>Status:</h2>
            <p>✅ Simulator is running</p>
            <p>📊 Collecting readings every 15 seconds</p>
        </body>
        </html>
        """
        return web.Response(text=html_content, content_type="text/html")

    async def start(self):
        """Start the campus network simulator"""
        self.is_running = True

        # Create web application
        app = web.Application()
        await self.setup_api_server(app)

        # Start reading collection task
        asyncio.create_task(self.collect_readings())

        # Start web server
        logger.info("Starting API server on http://0.0.0.0:8080")
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, "0.0.0.0", 8080)
        await site.start()

        print("\n" + "=" * 60)
        print("🏫 UTCC University GridTokenX Smart Meter Simulator")
        print("=" * 60)
        print(f"✅ Simulator started successfully!")
        print(f"📊 Managing {len(self.meters)} smart meters")
        print(f"🌐 API Server: http://localhost:8080")
        print(f"📈 Collecting readings every 15 seconds")
        print(f"📝 Logs: logs/simulator.log")
        print("\nPress Ctrl+C to stop the simulator")
        print("=" * 60 + "\n")

        # Keep running
        while self.is_running:
            await asyncio.sleep(1)

    def stop(self):
        """Stop the simulator"""
        self.is_running = False
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

    args = parser.parse_args()

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
