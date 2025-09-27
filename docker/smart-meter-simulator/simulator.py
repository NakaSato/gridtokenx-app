#!/usr/bin/env python3

import os
import json
import time
import random
import logging
import schedule
import math
from datetime import datetime, timezone
from typing import Dict, List, Any
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable, KafkaTimeoutError
import psycopg2
from psycopg2.extras import RealDictCursor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SmartMeterSimulator:
    def __init__(self):
        self.kafka_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
        self.db_url = os.getenv('DATABASE_URL', 'postgresql://p2p_user:p2p_password@localhost:5432/p2p_energy_trading')
        self.simulation_interval = int(os.getenv('SIMULATION_INTERVAL', '30'))  # seconds
        self.num_meters = int(os.getenv('NUM_METERS', '10'))
        self.output_file = os.getenv('OUTPUT_FILE', 'meter_readings.jsonl')

        # Initialize services
        self.producer = None
        self.db_conn = None
        self.standalone_mode = False

        # Try to initialize external services
        self.initialize_services()

        # Meter configurations
        self.meters = self.initialize_meters()

        # Statistics
        self.stats = {
            'total_readings': 0,
            'kafka_sends': 0,
            'db_stores': 0,
            'file_saves': 0
        }

    def initialize_services(self):
        """Initialize external services (Kafka, Database) with fallback to standalone mode"""
        services_available = 0
        total_services = 2

        # Initialize Kafka
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=self.kafka_servers.split(','),
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
                request_timeout_ms=5000,
                retries=1
            )
            # Test the connection
            self.producer.partitions_for('test-topic')
            logger.info("Kafka producer initialized successfully")
            services_available += 1
        except (NoBrokersAvailable, KafkaTimeoutError, Exception) as e:
            logger.warning(f"Kafka not available: {e}")
            self.producer = None

        # Initialize Database
        try:
            self.connect_db()
            if self.db_conn:
                logger.info("Database connection initialized successfully")
                services_available += 1
        except Exception as e:
            logger.warning(f"Database not available: {e}")
            self.db_conn = None

        # Determine mode
        if services_available == 0:
            self.standalone_mode = True
            logger.info("Running in STANDALONE mode - data will be saved to file only")
        elif services_available < total_services:
            logger.info(f"Running in HYBRID mode - {services_available}/{total_services} services available")
        else:
            logger.info("Running in FULL mode - all services available")

        # Ensure output directory exists for file backup
        os.makedirs(os.path.dirname(self.output_file) if os.path.dirname(self.output_file) else '.', exist_ok=True)

    def connect_db(self):
        """Connect to PostgreSQL database"""
        try:
            self.db_conn = psycopg2.connect(self.db_url)
            logger.info("Connected to database successfully")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise

    def initialize_meters(self) -> List[Dict[str, Any]]:
        """Initialize meter configurations from database or fallback to simulated meters"""
        meters = []

        if self.db_conn:
            try:
                with self.db_conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT sm.meter_id, sm.meter_type, sm.location, u.user_type
                        FROM smart_meters sm
                        JOIN users u ON sm.user_id = u.id
                        WHERE sm.status = 'Active'
                        LIMIT %s
                    """, (self.num_meters,))

                    db_meters = cursor.fetchall()

                    for meter in db_meters:
                        meter_config = {
                            'meter_id': meter['meter_id'],
                            'meter_type': meter['meter_type'],
                            'location': meter['location'],
                            'user_type': meter['user_type'],
                            'base_generation': random.uniform(2.0, 8.0) if meter['meter_type'] == 'Solar' else 0.0,
                            'base_consumption': random.uniform(1.0, 5.0),
                            'efficiency': random.uniform(0.85, 0.95),
                            'noise_factor': random.uniform(0.05, 0.15)
                        }
                        meters.append(meter_config)

            except Exception as e:
                logger.error(f"Failed to initialize meters from database: {e}")

        # Fallback to simulated meters if database failed or no database
        if not meters:
            for i in range(self.num_meters):
                meter_type = 'Solar' if i % 2 == 0 else 'Consumption'
                user_type = 'Prosumer' if meter_type == 'Solar' else 'Consumer'
                meters.append({
                    'meter_id': f'SIM_METER_{i+1:03d}',
                    'meter_type': meter_type,
                    'location': f'Simulated Location {i+1}',
                    'user_type': user_type,
                    'base_generation': random.uniform(2.0, 8.0) if meter_type == 'Solar' else 0.0,
                    'base_consumption': random.uniform(1.0, 5.0),
                    'efficiency': random.uniform(0.85, 0.95),
                    'noise_factor': random.uniform(0.05, 0.15)
                })

        logger.info(f"Initialized {len(meters)} meters for simulation")
        return meters

    def calculate_solar_factor(self) -> float:
        """Calculate solar generation factor based on time of day"""
        current_hour = datetime.now().hour

        # Solar generation curve (0-1 factor)
        if 6 <= current_hour <= 18:  # Daylight hours
            # Peak at noon (12), minimum at 6 and 18
            hour_factor = 1 - abs(current_hour - 12) / 6
            # Add some randomness for weather conditions
            weather_factor = random.uniform(0.7, 1.0)
            return min(hour_factor * weather_factor, 1.0)
        else:
            return 0.0  # No solar generation at night

    def calculate_consumption_factor(self) -> float:
        """Calculate consumption factor based on time of day"""
        current_hour = datetime.now().hour

        # Higher consumption during peak hours
        if 7 <= current_hour <= 9 or 17 <= current_hour <= 21:  # Peak hours
            return random.uniform(1.2, 1.8)
        elif 22 <= current_hour or current_hour <= 6:  # Night hours
            return random.uniform(0.3, 0.7)
        else:  # Regular hours
            return random.uniform(0.8, 1.2)

    def generate_meter_reading(self, meter: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a single meter reading"""
        timestamp = datetime.now(timezone.utc).isoformat()
        solar_factor = self.calculate_solar_factor()
        consumption_factor = self.calculate_consumption_factor()

        # Calculate energy values
        energy_generated = 0.0
        if meter['meter_type'] == 'Solar':
            base_gen = meter['base_generation'] * solar_factor * meter['efficiency']
            noise = random.gauss(0, base_gen * meter['noise_factor'])
            energy_generated = max(0, base_gen + noise)

        base_cons = meter['base_consumption'] * consumption_factor
        noise = random.gauss(0, base_cons * meter['noise_factor'])
        energy_consumed = max(0, base_cons + noise)

        # Generate electrical parameters
        voltage = random.gauss(240.0, 5.0)  # 240V ± 5V
        current = (energy_generated + energy_consumed) / voltage * 1000 if voltage > 0 else 0
        power_factor = random.uniform(0.90, 0.98)
        frequency = random.gauss(50.0, 0.1)  # 50Hz ± 0.1Hz
        temperature = random.gauss(25.0, 3.0)  # 25°C ± 3°C

        # Solar-specific parameters
        irradiance = None
        weather_condition = None
        if meter['meter_type'] == 'Solar':
            irradiance = solar_factor * random.uniform(800, 1200)  # W/m²
            weather_conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Overcast']
            weather_condition = random.choice(weather_conditions)

        reading = {
            'timestamp': timestamp,
            'meter_id': meter['meter_id'],
            'meter_type': meter['meter_type'],
            'location': meter['location'],
            'user_type': meter['user_type'],
            'energy_generated': round(energy_generated, 4),
            'energy_consumed': round(energy_consumed, 4),
            'voltage': round(voltage, 2),
            'current': round(current, 2),
            'power_factor': round(power_factor, 3),
            'frequency': round(frequency, 2),
            'temperature': round(temperature, 1),
            'irradiance': round(irradiance, 1) if irradiance else None,
            'weather_condition': weather_condition,
            'grid_connection_status': 'Connected'
        }

        return reading

    def send_to_kafka(self, reading: Dict[str, Any]):
        """Send meter reading to Kafka"""
        if not self.producer:
            return False

        try:
            topic = 'energy-readings'
            key = reading['meter_id']

            self.producer.send(topic, key=key, value=reading)
            logger.debug(f"Sent reading to Kafka: {reading['meter_id']}")
            self.stats['kafka_sends'] += 1
            return True

        except Exception as e:
            logger.error(f"Failed to send reading to Kafka: {e}")
            return False

    def store_in_timescaledb(self, reading: Dict[str, Any]):
        """Store reading in TimescaleDB"""
        try:
            timescale_url = os.getenv('TIMESCALE_URL', 'postgresql://timescale_user:timescale_password@timescaledb:5432/p2p_timeseries')

            with psycopg2.connect(timescale_url) as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO energy_readings (
                            time, meter_id, energy_generated, energy_consumed,
                            voltage, current, power_factor, frequency, temperature,
                            irradiance, weather_condition, grid_connection_status
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                    """, (
                        reading['timestamp'],
                        reading['meter_id'],
                        reading['energy_generated'],
                        reading['energy_consumed'],
                        reading['voltage'],
                        reading['current'],
                        reading['power_factor'],
                        reading['frequency'],
                        reading['temperature'],
                        reading['irradiance'],
                        reading['weather_condition'],
                        reading['grid_connection_status']
                    ))

            self.stats['db_stores'] += 1
            return True

        except Exception as e:
            logger.error(f"Failed to store reading in TimescaleDB: {e}")
            return False

    def save_to_file(self, reading: Dict[str, Any]):
        """Save reading to JSON Lines file as backup"""
        try:
            with open(self.output_file, 'a') as f:
                json.dump(reading, f)
                f.write('\n')

            self.stats['file_saves'] += 1
            return True

        except Exception as e:
            logger.error(f"Failed to save reading to file: {e}")
            return False

    def simulate_readings(self):
        """Generate and send readings for all meters"""
        logger.info(f"Generating readings for {len(self.meters)} meters")

        for meter in self.meters:
            try:
                reading = self.generate_meter_reading(meter)
                self.stats['total_readings'] += 1

                # Try multiple storage methods
                kafka_success = self.send_to_kafka(reading)
                db_success = self.store_in_timescaledb(reading)
                file_success = self.save_to_file(reading)

                # Log success status
                if kafka_success or db_success or file_success:
                    success_methods = []
                    if kafka_success:
                        success_methods.append("Kafka")
                    if db_success:
                        success_methods.append("Database")
                    if file_success:
                        success_methods.append("File")
                    logger.debug(f"Stored reading for {meter['meter_id']} via: {', '.join(success_methods)}")
                else:
                    logger.error(f"Failed to store reading for {meter['meter_id']} via any method")

            except Exception as e:
                logger.error(f"Failed to process meter {meter['meter_id']}: {e}")

        # Flush Kafka producer if available
        if self.producer:
            try:
                self.producer.flush()
            except Exception as e:
                logger.error(f"Failed to flush Kafka producer: {e}")

        logger.info(f"Completed meter reading simulation cycle - {self.stats['total_readings']} total readings")

    def print_statistics(self):
        """Print current statistics"""
        print(f"\nSimulation Statistics:")
        print(f"   Total Readings: {self.stats['total_readings']}")
        print(f"   Kafka Sends: {self.stats['kafka_sends']}")
        print(f"   Database Stores: {self.stats['db_stores']}")
        print(f"   File Saves: {self.stats['file_saves']}")
        print(f"   Mode: {'Standalone' if self.standalone_mode else 'Integrated'}")

    def run(self):
        """Run the simulator"""
        print("Starting Smart Meter Simulator")
        print("="*50)
        print(f"Meters: {self.num_meters}")
        print(f"Interval: {self.simulation_interval} seconds")
        print(f"Mode: {'Standalone' if self.standalone_mode else 'Integrated'}")
        print(f"Output File: {self.output_file}")
        print("="*50)

        # Schedule periodic readings
        schedule.every(self.simulation_interval).seconds.do(self.simulate_readings)

        # Initial reading
        self.simulate_readings()

        # Keep running
        try:
            while True:
                schedule.run_pending()
                time.sleep(1)

        except KeyboardInterrupt:
            logger.info("Shutting down simulator...")
            self.print_statistics()

            if self.producer:
                try:
                    self.producer.close()
                except Exception as e:
                    logger.error(f"Error closing Kafka producer: {e}")

            if self.db_conn:
                try:
                    self.db_conn.close()
                except Exception as e:
                    logger.error(f"Error closing database connection: {e}")

            logger.info("Simulator shutdown complete")

if __name__ == "__main__":
    simulator = SmartMeterSimulator()
    simulator.run()
