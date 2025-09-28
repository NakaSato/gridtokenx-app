#!/usr/bin/env python3
"""
AMI (Advanced Metering Infrastructure) Simulator with IEEE 2030.5 Protocol
GridTokenX P2P Energy Trading Platform

This simulator implements IEEE 2030.5-2018 (Smart Energy Profile 2.0) client functionality
to communicate with the API gateway using standard AMI protocols.
"""

import asyncio
import json
import logging
import random
import ssl
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
import aiohttp
import xml.etree.ElementTree as ET
from cryptography import x509
from cryptography.hazmat.backends import default_backend

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("logs/ami_simulator.log")],
)
logger = logging.getLogger(__name__)


@dataclass
class MeterReading:
    """IEEE 2030.5 compliant meter reading"""

    meter_id: str
    timestamp: int  # IEEE 2030.5 time format (seconds since epoch)
    energy_consumed: float  # Wh
    energy_generated: float  # Wh
    power_factor: float
    voltage: float  # V
    current: float  # A
    frequency: float  # Hz
    battery_level: Optional[float] = None
    battery_charging: bool = False
    grid_feed_in: float = 0.0
    quality_flags: int = 0x00  # 0x00 = VALID

    def to_ieee2030_5_xml(self) -> str:
        """Convert to IEEE 2030.5 XML format"""
        root = ET.Element("MeterReading", xmlns="urn:ieee:std:2030.5:ns")

        # Add meter ID
        meter_elem = ET.SubElement(root, "mRID")
        meter_elem.text = self.meter_id

        # Add timestamp
        time_elem = ET.SubElement(root, "timePeriodStart")
        time_elem.text = str(self.timestamp)

        # Add readings
        readings = ET.SubElement(root, "ReadingType")

        # Energy consumed
        consumed = ET.SubElement(readings, "Reading")
        ET.SubElement(consumed, "value").text = str(int(self.energy_consumed))
        ET.SubElement(consumed, "qualityFlags").text = str(self.quality_flags)
        ET.SubElement(consumed, "uom").text = "72"  # Wh
        ET.SubElement(consumed, "description").text = "Energy Consumed"

        # Energy generated
        generated = ET.SubElement(readings, "Reading")
        ET.SubElement(generated, "value").text = str(int(self.energy_generated))
        ET.SubElement(generated, "qualityFlags").text = str(self.quality_flags)
        ET.SubElement(generated, "uom").text = "72"  # Wh
        ET.SubElement(generated, "description").text = "Energy Generated"

        # Power factor
        pf = ET.SubElement(readings, "Reading")
        ET.SubElement(pf, "value").text = str(int(self.power_factor * 100))
        ET.SubElement(pf, "qualityFlags").text = str(self.quality_flags)
        ET.SubElement(pf, "description").text = "Power Factor"

        # Voltage
        volt = ET.SubElement(readings, "Reading")
        ET.SubElement(volt, "value").text = str(int(self.voltage * 10))
        ET.SubElement(volt, "qualityFlags").text = str(self.quality_flags)
        ET.SubElement(volt, "uom").text = "29"  # V
        ET.SubElement(volt, "description").text = "Voltage"

        # Battery level if available
        if self.battery_level is not None:
            battery = ET.SubElement(readings, "Reading")
            ET.SubElement(battery, "value").text = str(int(self.battery_level))
            ET.SubElement(battery, "qualityFlags").text = str(self.quality_flags)
            ET.SubElement(battery, "description").text = "Battery Level"
            ET.SubElement(battery, "uom").text = "5"  # Percentage

        return ET.tostring(root, encoding="unicode")


@dataclass
class AMIMeterConfig:
    """Configuration for an AMI smart meter"""

    meter_id: str
    building: str
    floor: int
    meter_type: str  # consumer, prosumer
    capacity_kw: float
    has_solar: bool
    has_battery: bool
    battery_capacity_kwh: float = 0.0
    solar_capacity_kw: float = 0.0
    certificate_path: Optional[str] = None
    private_key_path: Optional[str] = None


class AMISmartMeter:
    """IEEE 2030.5 compliant AMI smart meter simulator"""

    def __init__(self, config: AMIMeterConfig):
        self.config = config
        self.meter_id = config.meter_id
        self.battery_level = 50.0 if config.has_battery else None
        self.is_running = True
        self.last_reading = None
        self.registration_status = False
        self.sfdi = self._generate_sfdi()  # Short Form Device Identifier
        self.lfdi = self._generate_lfdi()  # Long Form Device Identifier

        logger.info(
            f"Initialized AMI meter {self.meter_id} - Type: {config.meter_type}, "
            f"Solar: {config.has_solar}, Battery: {config.has_battery}"
        )

    def _generate_sfdi(self) -> int:
        """Generate Short Form Device Identifier (40-bit)"""
        # Use meter ID hash for consistent SFDI
        import hashlib

        hash_val = hashlib.sha256(self.meter_id.encode()).hexdigest()
        return int(hash_val[:10], 16)

    def _generate_lfdi(self) -> int:
        """Generate Long Form Device Identifier (160-bit)"""
        # Use meter ID hash for consistent LFDI
        import hashlib

        hash_val = hashlib.sha256(self.meter_id.encode()).hexdigest()
        return int(hash_val[:40], 16)

    def generate_reading(self) -> MeterReading:
        """Generate realistic meter reading based on time and conditions"""
        now = datetime.now(timezone.utc)
        hour = now.hour

        # Base consumption pattern
        if 6 <= hour < 9:  # Morning peak
            base_consumption = self.config.capacity_kw * 0.7
        elif 9 <= hour < 17:  # Daytime
            base_consumption = self.config.capacity_kw * 0.5
        elif 17 <= hour < 21:  # Evening peak
            base_consumption = self.config.capacity_kw * 0.8
        else:  # Night
            base_consumption = self.config.capacity_kw * 0.3

        # Add variability
        consumption = base_consumption * (1 + random.uniform(-0.2, 0.2))

        # Solar generation
        generation = 0.0
        if self.config.has_solar and 6 <= hour < 18:
            solar_factor = (
                min(1.0, (hour - 6) / 6) if hour < 12 else max(0, (18 - hour) / 6)
            )
            generation = (
                self.config.solar_capacity_kw * solar_factor * random.uniform(0.8, 1.0)
            )

        # Battery management
        battery_charging = False
        if self.config.has_battery and self.battery_level is not None:
            if generation > consumption and self.battery_level < 90:
                # Charge battery
                charge_rate = min(
                    generation - consumption, self.config.capacity_kw * 0.2
                )
                self.battery_level = min(100.0, self.battery_level + charge_rate * 0.1)
                battery_charging = True
            elif self.battery_level > 20 and consumption > generation:
                # Discharge battery
                discharge_rate = min(
                    consumption - generation, self.config.capacity_kw * 0.15
                )
                self.battery_level = max(0.0, self.battery_level - discharge_rate * 0.1)

        # Calculate grid feed-in
        grid_feed_in = max(0, generation - consumption)

        reading = MeterReading(
            meter_id=self.meter_id,
            timestamp=int(now.timestamp()),
            energy_consumed=consumption * 1000,  # Convert to Wh
            energy_generated=generation * 1000,  # Convert to Wh
            power_factor=0.95 + random.uniform(-0.05, 0.05),
            voltage=230 + random.uniform(-5, 5),
            current=consumption / 0.23 * random.uniform(0.95, 1.05),
            frequency=50 + random.uniform(-0.1, 0.1),
            battery_level=self.battery_level,
            battery_charging=battery_charging,
            grid_feed_in=grid_feed_in * 1000,  # Convert to Wh
            quality_flags=0x00,  # VALID
        )

        self.last_reading = reading
        return reading

    def get_device_capability_xml(self) -> str:
        """Generate IEEE 2030.5 DeviceCapability XML"""
        root = ET.Element("DeviceCapability", xmlns="urn:ieee:std:2030.5:ns")

        # Add device information
        ET.SubElement(root, "mRID").text = self.meter_id
        ET.SubElement(root, "sFDI").text = str(self.sfdi)
        ET.SubElement(root, "lFDI").text = str(self.lfdi)

        # Add supported function sets
        functions = ET.SubElement(root, "FunctionSetAssignments")

        # Metering
        metering = ET.SubElement(functions, "MirrorUsagePoint")
        ET.SubElement(metering, "href").text = f"/mir/{self.meter_id}"
        ET.SubElement(
            metering, "roleFlags"
        ).text = "49"  # IsMirror | IsPremisesAggregationPoint

        # DER capabilities if prosumer
        if self.config.meter_type == "prosumer":
            der = ET.SubElement(functions, "DERProgram")
            ET.SubElement(der, "href").text = f"/der/{self.meter_id}"

        # Time sync
        ET.SubElement(functions, "TimeLink", href="/tm")

        return ET.tostring(root, encoding="unicode")


class AMINetworkSimulator:
    """AMI Network Simulator managing multiple meters with IEEE 2030.5 protocol"""

    def __init__(self, config_file: str, api_gateway_url: str):
        self.config = self._load_config(config_file)
        self.api_gateway_url = api_gateway_url
        self.meters: List[AMISmartMeter] = []
        self.is_running = False
        self.session: Optional[aiohttp.ClientSession] = None
        self.ssl_context = None
        self.polling_interval = 15  # seconds
        self.registration_complete = False

        # Initialize meters
        self._initialize_meters()

        # Setup SSL context for IEEE 2030.5
        self._setup_ssl_context()

        logger.info(f"AMI Network Simulator initialized with {len(self.meters)} meters")
        logger.info(f"API Gateway URL: {self.api_gateway_url}")

    def _load_config(self, config_file: str) -> Dict:
        """Load campus configuration"""
        config_path = Path(config_file)
        if not config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_file}")

        with open(config_path, "r") as f:
            return json.load(f)

    def _initialize_meters(self):
        """Initialize all AMI meters from configuration"""
        for meter_config in self.config.get("meters", []):
            # Create AMI meter configuration
            ami_config = AMIMeterConfig(
                meter_id=meter_config["id"],
                building=meter_config.get("building", "Unknown"),
                floor=meter_config.get("floor", 1),
                meter_type=meter_config.get("type", "consumer"),
                capacity_kw=meter_config.get("capacity_kw", 100.0),
                has_solar=meter_config.get("solar_installed", False),
                has_battery=meter_config.get("battery_storage", False),
                battery_capacity_kwh=meter_config.get("battery_capacity_kwh", 10.0),
                solar_capacity_kw=meter_config.get("solar_capacity_kw", 5.0),
            )

            # Set certificate paths
            cert_dir = Path("certs/meters") / meter_config["id"]
            if cert_dir.exists():
                ami_config.certificate_path = str(
                    cert_dir / f"{meter_config['id']}.pem"
                )
                ami_config.private_key_path = str(
                    cert_dir / f"{meter_config['id']}-key.pem"
                )

            meter = AMISmartMeter(ami_config)
            self.meters.append(meter)

    def _setup_ssl_context(self):
        """Setup SSL context for IEEE 2030.5 mutual TLS authentication"""
        try:
            self.ssl_context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)

            # Load CA certificate
            ca_cert_path = Path("certs/ca.pem")
            if ca_cert_path.exists():
                self.ssl_context.load_verify_locations(str(ca_cert_path))

            # Load first meter's client certificate for testing
            # In production, each meter would use its own certificate
            if self.meters:
                meter = self.meters[0]
                if meter.config.certificate_path and meter.config.private_key_path:
                    self.ssl_context.load_cert_chain(
                        meter.config.certificate_path, meter.config.private_key_path
                    )

            # Set TLS 1.2 minimum
            self.ssl_context.minimum_version = ssl.TLSVersion.TLSv1_2

            logger.info("SSL context configured for IEEE 2030.5 mutual TLS")
        except Exception as e:
            logger.warning(f"SSL context setup failed, using default: {e}")
            self.ssl_context = ssl.create_default_context()
            self.ssl_context.check_hostname = False
            self.ssl_context.verify_mode = ssl.CERT_NONE

    async def register_meters(self):
        """Register all meters with the API gateway using IEEE 2030.5"""
        logger.info("Registering meters with API gateway...")

        for meter in self.meters:
            try:
                # Create EndDevice registration
                registration_data = {
                    "EndDevice": {
                        "mRID": meter.meter_id,
                        "sFDI": meter.sfdi,
                        "lFDI": meter.lfdi,
                        "deviceCategory": "1281",  # Smart meter category
                        "deviceInformation": {
                            "mfModel": "GridTokenX-AMI-v2",
                            "mfSerNum": meter.meter_id,
                            "primaryPower": "0",  # AC power
                            "secondaryPower": "4" if meter.config.has_battery else "0",
                        },
                    }
                }

                # Send registration request
                async with self.session.post(
                    f"{self.api_gateway_url}/edev",
                    json=registration_data,
                    ssl=self.ssl_context,
                ) as resp:
                    if resp.status in [200, 201]:
                        meter.registration_status = True
                        logger.info(f"✅ Registered meter {meter.meter_id}")
                    else:
                        logger.error(
                            f"❌ Failed to register meter {meter.meter_id}: {resp.status}"
                        )

            except Exception as e:
                logger.error(f"Registration error for meter {meter.meter_id}: {e}")

        self.registration_complete = True

    async def discover_services(self):
        """Discover available services from API gateway"""
        try:
            async with self.session.get(
                f"{self.api_gateway_url}/dcap", ssl=self.ssl_context
            ) as resp:
                if resp.status == 200:
                    data = await resp.text()
                    logger.info("Service discovery successful")
                    # Parse DeviceCapability response
                    return data
        except Exception as e:
            logger.error(f"Service discovery failed: {e}")
        return None

    async def send_meter_readings(self):
        """Send meter readings to API gateway using IEEE 2030.5 protocol"""
        while self.is_running:
            try:
                # Generate readings for all meters
                readings = []
                total_consumption = 0
                total_generation = 0
                total_feed_in = 0

                for meter in self.meters:
                    if meter.registration_status:
                        reading = meter.generate_reading()
                        readings.append(reading)

                        total_consumption += reading.energy_consumed
                        total_generation += reading.energy_generated
                        total_feed_in += reading.grid_feed_in

                        # Send individual meter reading
                        await self._post_meter_reading(meter, reading)

                # Log campus summary
                logger.info(
                    f"📊 Campus Summary - Consumption: {total_consumption / 1000:.2f} kWh, "
                    f"Generation: {total_generation / 1000:.2f} kWh, "
                    f"Grid Feed-in: {total_feed_in / 1000:.2f} kWh"
                )

                # Wait for next polling interval
                await asyncio.sleep(self.polling_interval)

            except Exception as e:
                logger.error(f"Error sending meter readings: {e}")
                await asyncio.sleep(self.polling_interval)

    async def _post_meter_reading(self, meter: AMISmartMeter, reading: MeterReading):
        """Post individual meter reading to API gateway"""
        try:
            # Convert to IEEE 2030.5 XML format
            xml_data = reading.to_ieee2030_5_xml()

            # Post to mirror usage point
            async with self.session.post(
                f"{self.api_gateway_url}/mir/{meter.meter_id}/mr",
                data=xml_data,
                headers={"Content-Type": "application/sep+xml"},
                ssl=self.ssl_context,
            ) as resp:
                if resp.status in [200, 201, 204]:
                    logger.debug(f"✅ Posted reading for meter {meter.meter_id}")
                else:
                    logger.warning(
                        f"⚠️ Failed to post reading for {meter.meter_id}: {resp.status}"
                    )

        except Exception as e:
            logger.error(f"Error posting reading for {meter.meter_id}: {e}")

    async def handle_demand_response(self):
        """Poll and handle demand response events from API gateway"""
        while self.is_running:
            try:
                # Poll for DR events
                async with self.session.get(
                    f"{self.api_gateway_url}/dr", ssl=self.ssl_context
                ) as resp:
                    if resp.status == 200:
                        events = await resp.json()
                        for event in events:
                            await self._process_dr_event(event)

                await asyncio.sleep(60)  # Poll every minute for DR events

            except Exception as e:
                logger.error(f"Error polling demand response: {e}")
                await asyncio.sleep(60)

    async def _process_dr_event(self, event: Dict):
        """Process demand response event"""
        logger.info(f"📢 Processing DR event: {event.get('mRID', 'unknown')}")

        # Implement demand response logic
        if event.get("type") == "LoadShed":
            target_reduction = event.get("targetReduction", 0)
            logger.info(f"Load shed requested: {target_reduction} W")

            # Reduce consumption on capable meters
            for meter in self.meters:
                if meter.config.meter_type == "prosumer":
                    # Prosumers can reduce load
                    meter.config.capacity_kw *= 0.8  # Reduce by 20%

    async def start(self):
        """Start the AMI network simulator"""
        self.is_running = True

        # Create aiohttp session
        connector = aiohttp.TCPConnector(ssl=self.ssl_context)
        self.session = aiohttp.ClientSession(connector=connector)

        try:
            # Discover services
            await self.discover_services()

            # Register meters
            await self.register_meters()

            # Start background tasks
            tasks = [
                asyncio.create_task(self.send_meter_readings()),
                asyncio.create_task(self.handle_demand_response()),
            ]

            logger.info("=" * 60)
            logger.info("🏭 AMI Network Simulator Started")
            logger.info(f"📡 Connected to API Gateway: {self.api_gateway_url}")
            logger.info(f"📊 Managing {len(self.meters)} smart meters")
            logger.info(f"🔐 Using IEEE 2030.5-2018 protocol")
            logger.info(f"⏱️ Polling interval: {self.polling_interval} seconds")
            logger.info("=" * 60)

            # Keep running
            await asyncio.gather(*tasks)

        except KeyboardInterrupt:
            logger.info("Shutting down AMI simulator...")
        finally:
            await self.stop()

    async def stop(self):
        """Stop the AMI network simulator"""
        self.is_running = False

        if self.session:
            await self.session.close()

        logger.info("AMI Network Simulator stopped")


async def main():
    """Main entry point for AMI simulator"""
    import argparse

    parser = argparse.ArgumentParser(
        description="AMI Network Simulator with IEEE 2030.5"
    )
    parser.add_argument(
        "--config",
        default="config/utcc_campus_config.json",
        help="Path to campus configuration file",
    )
    parser.add_argument(
        "--gateway", default="https://localhost:8443", help="API Gateway URL"
    )
    parser.add_argument(
        "--interval", type=int, default=15, help="Polling interval in seconds"
    )

    args = parser.parse_args()

    # Create and start simulator
    simulator = AMINetworkSimulator(args.config, args.gateway)
    simulator.polling_interval = args.interval

    try:
        await simulator.start()
    except Exception as e:
        logger.error(f"Simulator error: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
