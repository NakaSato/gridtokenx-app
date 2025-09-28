#!/usr/bin/env python3
"""
IEEE 2030.5 Smart Meter Simulator

This module provides IEEE 2030.5 Smart Energy Profile 2.0 protocol compliant
smart meter simulation for P2P energy trading systems.

Key Features:
- IEEE 2030.5 compliant communication
- P2P energy trading integration
- Blockchain oracle updates via IEEE 2030.5
- RESTful API with TLS client certificates
- Real-time demand response and DER control
- Standardized meter reading formats
"""

import os
import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from dataclasses import dataclass

# Import IEEE 2030.5 components
from ieee2030_5.client import IEEE2030_5_Client
from ieee2030_5.server import IEEE2030_5_Server
from ieee2030_5.resources import MeterReading, Reading
from ieee2030_5.function_sets import DemandResponseControl, DERControl

logger = logging.getLogger(__name__)


@dataclass
class SimpleEnergyReading:
    """Simple energy reading data structure for IEEE 2030.5 simulator"""
    timestamp: str
    meter_id: str
    energy_generated: float  # kWh
    energy_consumed: float   # kWh
    voltage: float          # V
    current: float          # A
    power_factor: float     # ratio
    frequency: float        # Hz


class IEEE2030_5_SmartMeterSimulator:
    """
    IEEE 2030.5 Smart Meter Simulator
    
    Standalone smart meter simulator using IEEE 2030.5 protocol for P2P energy trading.
    """
    
    DEFAULT_SIMULATION_INTERVAL = 15  # seconds
    
    def __init__(self):
        # Basic configuration
        self.simulation_interval = int(os.getenv('SIMULATION_INTERVAL', self.DEFAULT_SIMULATION_INTERVAL))
        self.meter_id = os.getenv('METER_ID', f"AMI_METER_{id(self):08x}")
        
        # IEEE 2030.5 configuration
        self.ieee2030_5_enabled = os.getenv('IEEE2030_5_ENABLED', 'true').lower() == 'true'
        self.ieee2030_5_server_url = os.getenv('IEEE2030_5_SERVER_URL', 'https://localhost:8443')
        self.client_cert_path = os.getenv('CLIENT_CERT_PATH', './certs/client.pem')
        self.client_key_path = os.getenv('CLIENT_KEY_PATH', './certs/client.key')
        self.ca_cert_path = os.getenv('CA_CERT_PATH', './certs/ca.pem')

        # IEEE 2030.5 client
        self.ieee2030_5_client: Optional[IEEE2030_5_Client] = None

        # Event loop for async operations
        self.loop: Optional[asyncio.AbstractEventLoop] = None

        # IEEE 2030.5 state
        self.current_dr_events: Dict[str, DemandResponseControl] = {}
        self.current_der_controls: Dict[str, DERControl] = {}
        self.p2p_pricing: Dict[str, int] = {'current_rate': 200}  # 20 cents default

        if self.ieee2030_5_enabled:
            self.initialize_ieee2030_5()
    
    def initialize_ieee2030_5(self):
        """Initialize IEEE 2030.5 components"""
        try:
            # Create IEEE 2030.5 client
            self.ieee2030_5_client = IEEE2030_5_Client(
                server_url=self.ieee2030_5_server_url,
                client_cert_path=self.client_cert_path,
                client_key_path=self.client_key_path,
                ca_cert_path=self.ca_cert_path,
                device_id=self.meter_id
            )

            logger.info("IEEE 2030.5 components initialized")

        except Exception as e:
            logger.error(f"Failed to initialize IEEE 2030.5: {e}")
            self.ieee2030_5_enabled = False

    async def start_ieee2030_5_client(self):
        """Start IEEE 2030.5 client"""
        if self.ieee2030_5_client:
            try:
                await self.ieee2030_5_client.start()
                logger.info("IEEE 2030.5 client started")
            except Exception as e:
                logger.error(f"Failed to start IEEE 2030.5 client: {e}")

    async def stop_ieee2030_5_client(self):
        """Stop IEEE 2030.5 client"""
        if self.ieee2030_5_client:
            try:
                await self.ieee2030_5_client.stop()
                logger.info("IEEE 2030.5 client stopped")
            except Exception as e:
                logger.error(f"Failed to stop IEEE 2030.5 client: {e}")

    def generate_reading(self) -> SimpleEnergyReading:
        """Generate a simple energy reading"""
        import random
        
        # Generate basic meter reading with some randomness
        now = datetime.now(timezone.utc).isoformat()
        
        # Simulate basic energy values
        energy_generated = random.uniform(0.5, 5.0)  # kWh
        energy_consumed = random.uniform(1.0, 4.0)   # kWh
        voltage = random.uniform(230, 240)           # V
        current = random.uniform(5, 20)              # A
        power_factor = random.uniform(0.85, 0.95)    # ratio
        frequency = random.uniform(49.5, 50.5)       # Hz
        
        reading = SimpleEnergyReading(
            timestamp=now,
            meter_id=self.meter_id,
            energy_generated=energy_generated,
            energy_consumed=energy_consumed,
            voltage=voltage,
            current=current,
            power_factor=power_factor,
            frequency=frequency
        )
        
        logger.debug(f"Generated reading for {self.meter_id}: {energy_generated:.2f} kWh generated, {energy_consumed:.2f} kWh consumed")
        return reading
    
    def apply_ieee2030_5_controls(self, reading: SimpleEnergyReading) -> SimpleEnergyReading:
        """Apply IEEE 2030.5 demand response and DER controls to reading"""
        try:
            # Apply active demand response events
            for dr_event in self.current_dr_events.values():
                reading = self.apply_demand_response(reading, dr_event)

            # Apply active DER controls
            for der_control in self.current_der_controls.values():
                reading = self.apply_der_control(reading, der_control)

        except Exception as e:
            logger.error(f"Failed to apply IEEE 2030.5 controls: {e}")

        return reading

    def apply_demand_response(self, reading: SimpleEnergyReading, dr_event: DemandResponseControl) -> SimpleEnergyReading:
        """Apply demand response event to energy reading"""
        try:
            # Reduce consumption based on DR target
            if hasattr(dr_event, 'target_reduction') and dr_event.target_reduction and dr_event.target_reduction > 0:
                reduction_kw = dr_event.target_reduction / 1000  # Convert W to kW
                reduction_kwh = reduction_kw * (self.simulation_interval / 3600)  # Convert to kWh

                # Apply reduction to consumption
                original_consumption = reading.energy_consumed
                reading.energy_consumed = max(0, reading.energy_consumed - reduction_kwh)

                actual_reduction = original_consumption - reading.energy_consumed
                logger.debug(f"DR reduction applied: {actual_reduction:.3f} kWh")

        except Exception as e:
            logger.error(f"Failed to apply demand response: {e}")

        return reading

    def apply_der_control(self, reading: SimpleEnergyReading, der_control: DERControl) -> SimpleEnergyReading:
        """Apply DER control to energy reading"""
        try:
            if hasattr(der_control, 'der_control_base') and der_control.der_control_base:
                der_base = der_control.der_control_base

                # Apply power limits
                if hasattr(der_base, 'op_mod_max_lim_w') and der_base.op_mod_max_lim_w:
                    max_power_kw = der_base.op_mod_max_lim_w / 1000
                    max_energy_kwh = max_power_kw * (self.simulation_interval / 3600)

                    # Limit energy generation
                    if reading.energy_generated > max_energy_kwh:
                        reading.energy_generated = max_energy_kwh
                        logger.debug(f"DER limit applied: {max_energy_kwh:.3f} kWh max")

                # Apply target power settings
                if hasattr(der_base, 'op_mod_target_w') and der_base.op_mod_target_w:
                    target_power_kw = der_base.op_mod_target_w / 1000
                    target_energy_kwh = target_power_kw * (self.simulation_interval / 3600)

                    # Adjust generation toward target
                    reading.energy_generated = target_energy_kwh
                    logger.debug(f"DER target applied: {target_energy_kwh:.3f} kWh")

        except Exception as e:
            logger.error(f"Failed to apply DER control: {e}")

        return reading
    
    async def send_ieee2030_5_reading(self, reading: SimpleEnergyReading) -> bool:
        """Send reading via IEEE 2030.5 protocol"""
        if not self.ieee2030_5_client:
            return False

        try:
            # Convert SimpleEnergyReading to IEEE 2030.5 MeterReading format
            meter_reading = MeterReading(
                mRID=f"reading_{reading.timestamp}_{reading.meter_id}",
                energy_generated=Reading(
                    value=int(reading.energy_generated * 1000),  # Convert kWh to Wh
                    time_period_start=int(datetime.fromisoformat(reading.timestamp.replace('Z', '+00:00')).timestamp())
                ),
                energy_consumed=Reading(
                    value=int(reading.energy_consumed * 1000),
                    time_period_start=int(datetime.fromisoformat(reading.timestamp.replace('Z', '+00:00')).timestamp())
                ),
                instantaneous_power=Reading(
                    value=int((reading.energy_generated - reading.energy_consumed) * 1000 / 
                            (self.simulation_interval / 3600)),  # Convert to watts
                    time_period_start=int(datetime.fromisoformat(reading.timestamp.replace('Z', '+00:00')).timestamp())
                ),
                voltage=Reading(
                    value=int(reading.voltage * 100),  # Convert to centi-volts
                    time_period_start=int(datetime.fromisoformat(reading.timestamp.replace('Z', '+00:00')).timestamp())
                ),
                current=Reading(
                    value=int(reading.current * 1000),  # Convert to milli-amps
                    time_period_start=int(datetime.fromisoformat(reading.timestamp.replace('Z', '+00:00')).timestamp())
                ),
                power_factor=Reading(
                    value=int(reading.power_factor * 1000),  # Convert to milli units
                    time_period_start=int(datetime.fromisoformat(reading.timestamp.replace('Z', '+00:00')).timestamp())
                ),
                frequency=Reading(
                    value=int(reading.frequency * 100),  # Convert to centi-hertz
                    time_period_start=int(datetime.fromisoformat(reading.timestamp.replace('Z', '+00:00')).timestamp())
                )
            )

            # Send to IEEE 2030.5 server
            success = await self.ieee2030_5_client.post_meter_reading(meter_reading)

            if success:
                logger.debug(f"IEEE 2030.5 reading sent for {reading.meter_id}")

            return success

        except Exception as e:
            logger.error(f"Failed to send IEEE 2030.5 reading: {e}")
            return False

    async def handle_demand_response_event(self, dr_event: DemandResponseControl):
        """Handle incoming demand response event"""
        try:
            if hasattr(dr_event, 'mRID') and dr_event.mRID:
                self.current_dr_events[dr_event.mRID] = dr_event
                logger.info(f"Received DR event {dr_event.mRID}")

        except Exception as e:
            logger.error(f"Failed to handle DR event: {e}")

    async def handle_der_control_event(self, der_control: DERControl):
        """Handle incoming DER control event"""
        try:
            if hasattr(der_control, 'mRID') and der_control.mRID:
                self.current_der_controls[der_control.mRID] = der_control
                logger.info(f"Received DER control {der_control.mRID}")

        except Exception as e:
            logger.error(f"Failed to handle DER control: {e}")

    async def handle_tariff_update(self, tariff_profile):
        """Handle tariff profile update"""
        try:
            logger.info(f"Received tariff update")

            # Update P2P pricing based on new tariff
            if hasattr(tariff_profile, 'base_peer_rate'):
                self.p2p_pricing['base_rate'] = tariff_profile.base_peer_rate

        except Exception as e:
            logger.error(f"Failed to handle tariff update: {e}")

    async def handle_trading_opportunity(self, trading_data: Dict[str, Any]):
        """Handle P2P trading opportunity"""
        try:
            logger.info(f"P2P trading opportunity: {trading_data}")

        except Exception as e:
            logger.error(f"Failed to handle trading opportunity: {e}")

    def simulate_readings(self):
        """Generate and process readings"""
        try:
            # Generate a reading
            reading = self.generate_reading()
            
            # Apply IEEE 2030.5 controls
            if self.ieee2030_5_enabled:
                reading = self.apply_ieee2030_5_controls(reading)
            
            # Send via IEEE 2030.5 if enabled
            if self.ieee2030_5_enabled and self.ieee2030_5_client:
                # In a real implementation, you'd want proper async handling here
                # For now, just log that we would send it
                logger.info(f"Would send IEEE 2030.5 reading: {reading.energy_generated:.2f}kWh gen, {reading.energy_consumed:.2f}kWh cons")
            
            # Sleep for the simulation interval
            time.sleep(self.simulation_interval)
            
        except Exception as e:
            logger.error(f"Failed to process readings: {e}")
    
    def run(self):
        """Run the IEEE 2030.5 Smart Meter Simulator"""
        print("Starting IEEE 2030.5 Smart Meter Simulator")
        print("=" * 70)
        print(f"Meter ID: {self.meter_id}")
        print(f"IEEE 2030.5 Enabled: {self.ieee2030_5_enabled}")
        if self.ieee2030_5_enabled:
            print(f"IEEE 2030.5 Server: {self.ieee2030_5_server_url}")
        print(f"Simulation Interval: {self.simulation_interval}s")
        print("=" * 70)

        # Start IEEE 2030.5 client if enabled
        if self.ieee2030_5_enabled and self.ieee2030_5_client:
            try:
                self.loop = asyncio.new_event_loop()
                asyncio.set_event_loop(self.loop)
                
                async def start_client():
                    await self.start_ieee2030_5_client()
                
                self.loop.create_task(start_client())
                
            except Exception as e:
                logger.error(f"Failed to start IEEE 2030.5 components: {e}")
                self.ieee2030_5_enabled = False

        # Main simulation loop
        try:
            while True:
                self.simulate_readings()
                
        except KeyboardInterrupt:
            print("\nShutting down IEEE 2030.5 simulator...")
            
            if self.ieee2030_5_enabled and self.ieee2030_5_client and self.loop:
                try:
                    self.loop.run_until_complete(self.stop_ieee2030_5_client())
                except Exception as e:
                    logger.error(f"Error stopping IEEE 2030.5 client: {e}")
            
            print("IEEE 2030.5 simulator shutdown complete")


def run_ieee2030_5_server():
    """Run standalone IEEE 2030.5 server for testing"""
    import asyncio
    
    server = IEEE2030_5_Server(
        host='0.0.0.0',
        port=8443,
        cert_path=os.getenv('SERVER_CERT_PATH', './certs/server.pem'),
        key_path=os.getenv('SERVER_KEY_PATH', './certs/server.key'),
        ca_cert_path=os.getenv('CA_CERT_PATH', './certs/ca.pem')
    )
    
    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        print("IEEE 2030.5 server stopped")


if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run simulator with IEEE 2030.5 support
    simulator = IEEE2030_5_SmartMeterSimulator()
    simulator.run()