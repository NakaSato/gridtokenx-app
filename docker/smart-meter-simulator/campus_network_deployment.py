#!/usr/bin/env python3
"""
IEEE 2030.5 Multi-Meter Campus Deployment

Deploys and manages 25 smart meters across Stanford University campus
with full IEEE 2030.5 protocol support and P2P trading capabilities.
"""

import os
import sys
import asyncio
import logging
import signal
import time
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from dataclasses import dataclass, field
import json
import random
import math

# Import IEEE 2030.5 components
from ieee2030_5.client import IEEE2030_5_Client
from ieee2030_5.server import IEEE2030_5_Server
from ieee2030_5.resources import MeterReading, Reading
from ieee2030_5.function_sets import DemandResponseControl, DERControl

logger = logging.getLogger(__name__)


@dataclass
class MeterConfiguration:
    """Configuration for individual smart meter"""
    meter_id: str
    building_name: str
    building_type: str
    generation_capacity: float  # kW
    storage_capacity: float     # kWh
    consumption_baseline: float # kW
    cert_path: str
    key_path: str
    port: int = 8443
    location: tuple = (0.0, 0.0)  # lat, lng
    prosumer_consumer: bool = True  # All meters are hybrid


@dataclass
class EnergyReading:
    """Real-time energy reading from a smart meter"""
    timestamp: str
    meter_id: str
    building_name: str
    building_type: str
    energy_generated: float    # kWh
    energy_consumed: float     # kWh
    energy_stored: float       # kWh
    storage_level: float       # %
    voltage: float             # V
    current: float             # A
    power_factor: float        # ratio
    frequency: float           # Hz
    temperature: float         # °C
    solar_irradiance: float    # W/m²
    available_for_trade: float # kWh
    trading_price: float       # $/kWh
    active_trades: int         # number
    is_generating: bool
    is_consuming: bool
    is_trading: bool


class CampusSmartMeter:
    """Individual IEEE 2030.5 smart meter with P2P trading capabilities"""
    
    def __init__(self, config: MeterConfiguration):
        self.config = config
        self.ieee2030_5_client: Optional[IEEE2030_5_Client] = None
        self.is_running = False
        self.last_reading: Optional[EnergyReading] = None
        self.active_trades: List[Dict] = []
        
        # Simulation parameters
        self.solar_phase = random.uniform(0, 2 * math.pi)
        self.consumption_phase = random.uniform(0, 2 * math.pi)
        self.battery_level = random.uniform(0.2, 0.8)  # Start between 20-80%
        
        # Building-specific patterns
        self.consumption_patterns = self._get_consumption_patterns()
        self.generation_patterns = self._get_generation_patterns()
    
    def _get_consumption_patterns(self) -> Dict[str, Any]:
        """Get building-type specific consumption patterns"""
        patterns = {
            "academic": {
                "base_load": 0.6,  # 60% of capacity
                "peak_hours": [(8, 18)],  # 8 AM to 6 PM
                "weekend_reduction": 0.3
            },
            "residential": {
                "base_load": 0.4,
                "peak_hours": [(6, 9), (17, 23)],  # Morning and evening
                "weekend_increase": 0.2
            },
            "administrative": {
                "base_load": 0.5,
                "peak_hours": [(8, 17)],  # Business hours
                "weekend_reduction": 0.8
            },
            "athletic": {
                "base_load": 0.3,
                "peak_hours": [(15, 22)],  # Afternoon/evening
                "weekend_increase": 0.5
            },
            "research": {
                "base_load": 0.7,  # High 24/7 load
                "peak_hours": [(9, 18)],
                "weekend_reduction": 0.1
            },
            "support": {
                "base_load": 0.4,
                "peak_hours": [(6, 14)],  # Early shift
                "weekend_reduction": 0.5
            }
        }
        return patterns.get(self.config.building_type, patterns["academic"])
    
    def _get_generation_patterns(self) -> Dict[str, Any]:
        """Get building-type specific solar generation patterns"""
        return {
            "peak_generation": 0.85,  # 85% of capacity at peak
            "generation_start": 6,    # 6 AM
            "generation_end": 19,     # 7 PM
            "weather_variance": 0.2   # ±20% weather variation
        }
    
    def _calculate_solar_generation(self) -> float:
        """Calculate solar generation based on time and weather"""
        now = datetime.now()
        hour = now.hour + now.minute / 60.0
        
        patterns = self.generation_patterns
        start_hour = patterns["generation_start"]
        end_hour = patterns["generation_end"]
        
        if hour < start_hour or hour > end_hour:
            return 0.0
        
        # Solar curve (sine-based)
        daylight_hours = end_hour - start_hour
        hour_into_day = hour - start_hour
        solar_factor = math.sin(math.pi * hour_into_day / daylight_hours)
        
        # Add weather variance
        weather_factor = 1.0 + random.uniform(
            -patterns["weather_variance"], 
            patterns["weather_variance"]
        )
        
        generation = (
            self.config.generation_capacity * 
            patterns["peak_generation"] * 
            solar_factor * 
            weather_factor
        )
        
        return max(0.0, generation)
    
    def _calculate_consumption(self) -> float:
        """Calculate building consumption based on patterns"""
        now = datetime.now()
        hour = now.hour
        is_weekend = now.weekday() >= 5
        
        patterns = self.consumption_patterns
        base_consumption = self.config.consumption_baseline * patterns["base_load"]
        
        # Check if in peak hours
        peak_factor = 1.0
        for start_hour, end_hour in patterns["peak_hours"]:
            if start_hour <= hour < end_hour:
                peak_factor = 1.5  # 50% increase during peak
                break
        
        # Weekend adjustment
        weekend_factor = 1.0
        if is_weekend:
            if "weekend_reduction" in patterns:
                weekend_factor = 1.0 - patterns["weekend_reduction"]
            elif "weekend_increase" in patterns:
                weekend_factor = 1.0 + patterns["weekend_increase"]
        
        consumption = base_consumption * peak_factor * weekend_factor
        
        # Add some randomness
        consumption *= random.uniform(0.8, 1.2)
        
        return max(0.0, consumption)
    
    def _update_battery_level(self, net_generation: float, interval_hours: float):
        """Update battery storage level"""
        if net_generation > 0:  # Excess generation
            # Charge battery
            charge_amount = min(
                net_generation * interval_hours,
                self.config.storage_capacity * (1.0 - self.battery_level)
            )
            self.battery_level += charge_amount / self.config.storage_capacity
        elif net_generation < 0:  # Net consumption
            # Discharge battery
            discharge_amount = min(
                abs(net_generation) * interval_hours,
                self.battery_level * self.config.storage_capacity
            )
            self.battery_level -= discharge_amount / self.config.storage_capacity
        
        # Keep within bounds
        self.battery_level = max(0.0, min(1.0, self.battery_level))
    
    def generate_reading(self) -> EnergyReading:
        """Generate current energy reading"""
        now = datetime.now(timezone.utc)
        
        # Calculate generation and consumption
        generation = self._calculate_solar_generation()  # kW
        consumption = self._calculate_consumption()      # kW
        net_generation = generation - consumption
        
        # Update battery (assuming 15-minute intervals)
        self._update_battery_level(net_generation, 0.25)
        
        # Calculate electrical parameters
        voltage = 240 + random.uniform(-5, 5)  # ~240V ±5V
        current = max(0.1, abs(net_generation) / voltage * 1000)  # A
        power_factor = random.uniform(0.92, 0.98)
        frequency = 60.0 + random.uniform(-0.1, 0.1)  # 60Hz ±0.1Hz
        
        # Environmental
        temperature = 20 + random.uniform(-5, 15)  # °C
        solar_irradiance = max(0, 1000 * (generation / self.config.generation_capacity))
        
        # Trading parameters
        available_for_trade = max(0, net_generation * 0.25)  # 15-min interval
        base_price = 0.15  # $0.15/kWh base
        trading_price = base_price * random.uniform(0.8, 1.3)
        
        reading = EnergyReading(
            timestamp=now.isoformat(),
            meter_id=self.config.meter_id,
            building_name=self.config.building_name,
            building_type=self.config.building_type,
            energy_generated=generation * 0.25,  # kWh for 15-min
            energy_consumed=consumption * 0.25,   # kWh for 15-min
            energy_stored=self.battery_level * self.config.storage_capacity,
            storage_level=self.battery_level * 100,
            voltage=voltage,
            current=current,
            power_factor=power_factor,
            frequency=frequency,
            temperature=temperature,
            solar_irradiance=solar_irradiance,
            available_for_trade=available_for_trade,
            trading_price=trading_price,
            active_trades=len(self.active_trades),
            is_generating=generation > 0.1,
            is_consuming=consumption > generation,
            is_trading=available_for_trade > 0.01
        )
        
        self.last_reading = reading
        return reading
    
    async def start(self):
        """Start the smart meter"""
        try:
            # Initialize IEEE 2030.5 client
            self.ieee2030_5_client = IEEE2030_5_Client(
                server_url=f"https://localhost:{self.config.port}",
                client_cert_path=self.config.cert_path,
                client_key_path=self.config.key_path,
                device_id=self.config.meter_id
            )
            
            await self.ieee2030_5_client.start()
            self.is_running = True
            
            logger.info(f"✅ Started meter {self.config.meter_id} ({self.config.building_name})")
            
        except Exception as e:
            logger.error(f"❌ Failed to start meter {self.config.meter_id}: {e}")
            raise
    
    async def stop(self):
        """Stop the smart meter"""
        self.is_running = False
        if self.ieee2030_5_client:
            await self.ieee2030_5_client.stop()
        logger.info(f"🛑 Stopped meter {self.config.meter_id}")


class CampusNetworkManager:
    """Manages the 25-meter campus smart meter network"""
    
    def __init__(self):
        self.meters: Dict[str, CampusSmartMeter] = {}
        self.ieee2030_5_server: Optional[IEEE2030_5_Server] = None
        self.is_running = False
        
        # Load meter configurations
        self.meter_configs = self._load_meter_configurations()
        
        # Initialize meters
        for config in self.meter_configs:
            self.meters[config.meter_id] = CampusSmartMeter(config)
    
    def _load_meter_configurations(self) -> List[MeterConfiguration]:
        """Load configurations for all 25 campus meters"""
        base_dir = Path(__file__).parent
        certs_dir = base_dir / "certs" / "meters"
        
        # Campus meter definitions (same as certificate generator)
        campus_buildings = {
            "academic": [
                {"id": "AMI_METER_STANFORD_ENG_001", "building": "Engineering", "gen": 50, "storage": 30, "consumption": 40},
                {"id": "AMI_METER_STANFORD_PHYS_001", "building": "Physics", "gen": 45, "storage": 25, "consumption": 35},
                {"id": "AMI_METER_STANFORD_CHEM_001", "building": "Chemistry", "gen": 40, "storage": 20, "consumption": 32},
                {"id": "AMI_METER_STANFORD_BIO_001", "building": "Biology", "gen": 35, "storage": 18, "consumption": 28},
                {"id": "AMI_METER_STANFORD_MATH_001", "building": "Mathematics", "gen": 30, "storage": 15, "consumption": 25},
                {"id": "AMI_METER_STANFORD_CS_001", "building": "Computer Science", "gen": 55, "storage": 35, "consumption": 45},
                {"id": "AMI_METER_STANFORD_HIST_001", "building": "History", "gen": 25, "storage": 12, "consumption": 20},
                {"id": "AMI_METER_STANFORD_ART_001", "building": "Art", "gen": 20, "storage": 10, "consumption": 16},
            ],
            "residential": [
                {"id": "AMI_METER_STANFORD_DORM_001", "building": "Dormitory West", "gen": 60, "storage": 40, "consumption": 50},
                {"id": "AMI_METER_STANFORD_DORM_002", "building": "Dormitory East", "gen": 55, "storage": 35, "consumption": 45},
                {"id": "AMI_METER_STANFORD_DORM_003", "building": "Dormitory North", "gen": 50, "storage": 30, "consumption": 40},
                {"id": "AMI_METER_STANFORD_GRAD_001", "building": "Graduate Housing", "gen": 45, "storage": 25, "consumption": 38},
                {"id": "AMI_METER_STANFORD_FRAT_001", "building": "Fraternity Row", "gen": 35, "storage": 20, "consumption": 30},
                {"id": "AMI_METER_STANFORD_APART_001", "building": "Faculty Apartments", "gen": 40, "storage": 22, "consumption": 32},
            ],
            "administrative": [
                {"id": "AMI_METER_STANFORD_ADMIN_001", "building": "Administration", "gen": 30, "storage": 15, "consumption": 25},
                {"id": "AMI_METER_STANFORD_REGIST_001", "building": "Registrar", "gen": 25, "storage": 12, "consumption": 20},
                {"id": "AMI_METER_STANFORD_FINANCE_001", "building": "Financial Aid", "gen": 28, "storage": 14, "consumption": 22},
                {"id": "AMI_METER_STANFORD_PRES_001", "building": "President Office", "gen": 32, "storage": 16, "consumption": 26},
            ],
            "athletic": [
                {"id": "AMI_METER_STANFORD_GYM_001", "building": "Main Gymnasium", "gen": 80, "storage": 60, "consumption": 70},
                {"id": "AMI_METER_STANFORD_POOL_001", "building": "Aquatic Center", "gen": 70, "storage": 50, "consumption": 65},
                {"id": "AMI_METER_STANFORD_FIELD_001", "building": "Athletic Fields", "gen": 45, "storage": 30, "consumption": 35},
            ],
            "research": [
                {"id": "AMI_METER_STANFORD_LAB_001", "building": "Research Laboratory", "gen": 65, "storage": 45, "consumption": 58},
                {"id": "AMI_METER_STANFORD_MED_001", "building": "Medical Research", "gen": 75, "storage": 55, "consumption": 68},
            ],
            "support": [
                {"id": "AMI_METER_STANFORD_MAINT_001", "building": "Maintenance", "gen": 35, "storage": 20, "consumption": 28},
                {"id": "AMI_METER_STANFORD_DINING_001", "building": "Dining Hall", "gen": 50, "storage": 30, "consumption": 42},
            ]
        }
        
        configs = []
        port_base = 8443
        
        for building_type, meters in campus_buildings.items():
            for i, meter in enumerate(meters):
                meter_id = meter["id"]
                cert_path = certs_dir / meter_id / f"{meter_id}.pem"
                key_path = certs_dir / meter_id / f"{meter_id}-key.pem"
                
                config = MeterConfiguration(
                    meter_id=meter_id,
                    building_name=meter["building"],
                    building_type=building_type,
                    generation_capacity=meter["gen"],
                    storage_capacity=meter["storage"],
                    consumption_baseline=meter["consumption"],
                    cert_path=str(cert_path),
                    key_path=str(key_path),
                    port=port_base + len(configs)
                )
                configs.append(config)
        
        return configs
    
    async def start_network(self):
        """Start the entire 25-meter campus network"""
        logger.info("🏫 Starting Stanford University 25-meter campus network...")
        
        # Start IEEE 2030.5 server
        try:
            ca_cert = Path(__file__).parent / "certs" / "ca.pem"
            self.ieee2030_5_server = IEEE2030_5_Server(
                port=8443,
                cert_path=str(Path(__file__).parent / "certs" / "client.pem"),
                key_path=str(Path(__file__).parent / "certs" / "client-key.pem"),
                ca_cert_path=str(ca_cert)
            )
            await self.ieee2030_5_server.start()
            logger.info("✅ IEEE 2030.5 server started on port 8443")
        except Exception as e:
            logger.error(f"❌ Failed to start IEEE 2030.5 server: {e}")
            raise
        
        # Start all meters
        successful_starts = 0
        for meter_id, meter in self.meters.items():
            try:
                await meter.start()
                successful_starts += 1
            except Exception as e:
                logger.error(f"❌ Failed to start meter {meter_id}: {e}")
        
        self.is_running = True
        
        logger.info(f"🎉 Campus network started: {successful_starts}/25 meters active")
        return successful_starts
    
    async def stop_network(self):
        """Stop the entire campus network"""
        logger.info("🛑 Stopping campus network...")
        
        self.is_running = False
        
        # Stop all meters
        for meter in self.meters.values():
            await meter.stop()
        
        # Stop server
        if self.ieee2030_5_server:
            await self.ieee2030_5_server.stop()
        
        logger.info("✅ Campus network stopped")
    
    def get_network_summary(self) -> Dict[str, Any]:
        """Get real-time network summary"""
        active_meters = sum(1 for meter in self.meters.values() if meter.is_running)
        
        total_generation = 0
        total_consumption = 0
        total_storage = 0
        total_available_trade = 0
        active_trades = 0
        
        readings_by_type = {}
        
        for meter in self.meters.values():
            if meter.last_reading:
                reading = meter.last_reading
                total_generation += reading.energy_generated
                total_consumption += reading.energy_consumed
                total_storage += reading.energy_stored
                total_available_trade += reading.available_for_trade
                active_trades += reading.active_trades
                
                building_type = reading.building_type
                if building_type not in readings_by_type:
                    readings_by_type[building_type] = []
                readings_by_type[building_type].append(reading)
        
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "network_status": {
                "active_meters": active_meters,
                "total_meters": 25,
                "uptime_percent": (active_meters / 25) * 100
            },
            "energy_summary": {
                "total_generation_kWh": round(total_generation, 2),
                "total_consumption_kWh": round(total_consumption, 2),
                "net_generation_kWh": round(total_generation - total_consumption, 2),
                "total_storage_kWh": round(total_storage, 2),
                "available_for_trade_kWh": round(total_available_trade, 2)
            },
            "trading_activity": {
                "active_trades": active_trades,
                "potential_trading_pairs": 300,  # 25 × 24 ÷ 2
                "trading_utilization_percent": min(100, (active_trades / 300) * 100)
            },
            "building_breakdown": {
                building_type: {
                    "meter_count": len(readings),
                    "total_generation": sum(r.energy_generated for r in readings),
                    "total_consumption": sum(r.energy_consumed for r in readings),
                    "average_storage_level": sum(r.storage_level for r in readings) / len(readings)
                }
                for building_type, readings in readings_by_type.items()
            }
        }
    
    async def monitoring_loop(self):
        """Main monitoring and data collection loop"""
        while self.is_running:
            try:
                # Generate readings for all meters
                for meter in self.meters.values():
                    if meter.is_running:
                        reading = meter.generate_reading()
                        # Here we would normally send to API Gateway
                        logger.debug(f"Generated reading for {reading.meter_id}")
                
                # Print network summary every 5 minutes
                if int(time.time()) % 300 == 0:
                    summary = self.get_network_summary()
                    logger.info(f"📊 Network Summary: "
                              f"{summary['network_status']['active_meters']}/25 active, "
                              f"{summary['energy_summary']['net_generation_kWh']:.2f} kWh net, "
                              f"{summary['trading_activity']['active_trades']} trades")
                
                await asyncio.sleep(15)  # 15-second intervals
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(5)


def setup_logging():
    """Setup logging for campus network"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('campus_network.log'),
            logging.StreamHandler(sys.stdout)
        ]
    )


async def main():
    """Main campus network deployment"""
    setup_logging()
    
    print("🏫 Stanford University GridTokenX Campus Smart Meter Network")
    print("🔌 IEEE 2030.5 Multi-Meter Deployment")
    print("=" * 60)
    
    network_manager = CampusNetworkManager()
    
    def signal_handler(signum, frame):
        logger.info("Received shutdown signal")
        asyncio.create_task(network_manager.stop_network())
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Start the campus network
        active_meters = await network_manager.start_network()
        
        if active_meters > 0:
            logger.info(f"🚀 Campus network operational with {active_meters}/25 meters")
            
            # Run monitoring loop
            await network_manager.monitoring_loop()
        else:
            logger.error("❌ Failed to start any meters")
    
    except KeyboardInterrupt:
        logger.info("Shutdown requested by user")
    except Exception as e:
        logger.error(f"❌ Campus network error: {e}")
    finally:
        await network_manager.stop_network()
        logger.info("👋 Campus network deployment complete")


if __name__ == "__main__":
    asyncio.run(main())