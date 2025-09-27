#!/usr/bin/env python3

import os
import json
import time
import random
import logging
import schedule
import math
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable, KafkaTimeoutError
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MeterType(Enum):
    SOLAR_PROSUMER = "Solar_Prosumer"
    GRID_CONSUMER = "Grid_Consumer"
    HYBRID_PROSUMER = "Hybrid_Prosumer"
    BATTERY_STORAGE = "Battery_Storage"

class WeatherCondition(Enum):
    SUNNY = "Sunny"
    PARTLY_CLOUDY = "Partly_Cloudy"
    CLOUDY = "Cloudy"
    OVERCAST = "Overcast"
    RAINY = "Rainy"

class GridConnectionStatus(Enum):
    CONNECTED = "Connected"
    DISCONNECTED = "Disconnected"
    MAINTENANCE = "Maintenance"

@dataclass
class EnergyReading:
    timestamp: str
    meter_id: str
    meter_type: str
    location: str
    user_type: str
    
    # Energy Data (kWh)
    energy_generated: float
    energy_consumed: float
    energy_available_for_sale: float
    energy_needed_from_grid: float
    battery_level: float
    
    # Electrical Parameters
    voltage: float
    current: float
    power_factor: float
    frequency: float
    temperature: float
    
    # Solar Specific
    irradiance: Optional[float]
    panel_temperature: Optional[float]
    weather_condition: Optional[str]
    
    # Grid Connection
    grid_connection_status: str
    grid_feed_in_rate: float
    grid_purchase_rate: float
    
    # Trading Data
    surplus_energy: float
    deficit_energy: float
    trading_preference: str
    max_sell_price: float
    max_buy_price: float
    
    # REC Data (Renewable Energy Certificate)
    rec_eligible: bool
    carbon_offset: float

class EnhancedSmartMeterSimulator:
    def __init__(self):
        # Service Configuration
        self.kafka_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
        self.db_url = os.getenv('DATABASE_URL', 'postgresql://p2p_user:p2p_password@localhost:5432/p2p_energy_trading')
        self.timescale_url = os.getenv('TIMESCALE_URL', 'postgresql://timescale_user:timescale_password@localhost:5433/p2p_timeseries')
        
        # Simulation Configuration
        self.simulation_interval = int(os.getenv('SIMULATION_INTERVAL', '30'))
        self.num_meters = int(os.getenv('NUM_METERS', '20'))
        self.output_file = os.getenv('OUTPUT_FILE', './data/meter_readings.jsonl')
        
        # Solar Configuration
        self.solar_panel_efficiency_min = float(os.getenv('SOLAR_PANEL_EFFICIENCY_MIN', '0.85'))
        self.solar_panel_efficiency_max = float(os.getenv('SOLAR_PANEL_EFFICIENCY_MAX', '0.95'))
        self.base_generation_min = float(os.getenv('BASE_GENERATION_MIN', '3.0'))
        self.base_generation_max = float(os.getenv('BASE_GENERATION_MAX', '12.0'))
        
        # Trading Configuration
        self.min_sell_price = float(os.getenv('MIN_SELL_PRICE', '0.15'))  # USD per kWh
        self.max_sell_price = float(os.getenv('MAX_SELL_PRICE', '0.35'))
        self.min_buy_price = float(os.getenv('MIN_BUY_PRICE', '0.20'))
        self.max_buy_price = float(os.getenv('MAX_BUY_PRICE', '0.40'))
        self.grid_feed_in_rate = float(os.getenv('GRID_FEED_IN_RATE', '0.12'))
        self.grid_purchase_rate = float(os.getenv('GRID_PURCHASE_RATE', '0.28'))
        
        # Weather Weights
        self.weather_weights = {
            WeatherCondition.SUNNY: float(os.getenv('WEATHER_SUNNY_WEIGHT', '0.4')),
            WeatherCondition.PARTLY_CLOUDY: float(os.getenv('WEATHER_PARTLY_CLOUDY_WEIGHT', '0.3')),
            WeatherCondition.CLOUDY: float(os.getenv('WEATHER_CLOUDY_WEIGHT', '0.15')),
            WeatherCondition.OVERCAST: float(os.getenv('WEATHER_OVERCAST_WEIGHT', '0.1')),
            WeatherCondition.RAINY: float(os.getenv('WEATHER_RAINY_WEIGHT', '0.05'))
        }
        
        # Initialize services
        self.producer = None
        self.db_conn = None
        self.timescale_conn = None
        self.standalone_mode = False
        
        self.initialize_services()
        
        # Initialize enhanced meter configurations
        self.meters = self.initialize_enhanced_meters()
        
        # Statistics
        self.stats = {
            'total_readings': 0,
            'kafka_sends': 0,
            'db_stores': 0,
            'file_saves': 0,
            'trading_opportunities': 0,
            'rec_generated': 0
        }
        
        # Weather simulation state
        self.current_weather = WeatherCondition.SUNNY
        self.weather_duration = 0
        self.weather_change_interval = random.randint(3, 8)  # Change weather every 3-8 cycles

    def initialize_services(self):
        """Initialize external services with enhanced error handling"""
        services_available = 0
        
        # Initialize Kafka
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=self.kafka_servers.split(','),
                value_serializer=lambda v: json.dumps(v, default=str).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
                request_timeout_ms=10000,
                retries=3
            )
            logger.info("Kafka producer initialized successfully")
            services_available += 1
        except Exception as e:
            logger.warning(f"Kafka not available: {e}")
            self.producer = None
        
        # Initialize Database connections
        try:
            self.db_conn = psycopg2.connect(self.db_url)
            logger.info("Main database connection established")
            services_available += 1
        except Exception as e:
            logger.warning(f"Main database not available: {e}")
            self.db_conn = None
        
        try:
            self.timescale_conn = psycopg2.connect(self.timescale_url)
            logger.info("TimescaleDB connection established")
            services_available += 1
        except Exception as e:
            logger.warning(f"TimescaleDB not available: {e}")
            self.timescale_conn = None
        
        # Set mode
        self.standalone_mode = services_available == 0
        
        if self.standalone_mode:
            logger.info("Running in STANDALONE mode")
        else:
            logger.info(f"Running in INTEGRATED mode - {services_available}/3 services available")
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(self.output_file) if os.path.dirname(self.output_file) else './data', exist_ok=True)

    def initialize_enhanced_meters(self) -> List[Dict[str, Any]]:
        """Initialize enhanced meter configurations with trading capabilities"""
        meters = []
        
        # Try to get meters from database first
        if self.db_conn:
            try:
                with self.db_conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT sm.meter_id, sm.meter_type, sm.location, 
                               u.user_type, u.trading_preferences
                        FROM smart_meters sm
                        JOIN users u ON sm.user_id = u.id
                        WHERE sm.status = 'Active'
                        LIMIT %s
                    """, (self.num_meters,))
                    
                    db_meters = cursor.fetchall()
                    for meter in db_meters:
                        meter_config = self.create_meter_config(
                            meter['meter_id'],
                            meter['meter_type'],
                            meter['location'],
                            meter['user_type'],
                            meter.get('trading_preferences', {})
                        )
                        meters.append(meter_config)
            except Exception as e:
                logger.warning(f"Failed to load meters from database: {e}")
        
        # Fallback to simulated meters
        if not meters:
            meter_types = [
                MeterType.SOLAR_PROSUMER,
                MeterType.GRID_CONSUMER,
                MeterType.HYBRID_PROSUMER,
                MeterType.BATTERY_STORAGE
            ]
            
            for i in range(self.num_meters):
                meter_type = random.choice(meter_types)
                user_type = self.get_user_type_from_meter_type(meter_type)
                
                meter_config = self.create_meter_config(
                    f'AMI_METER_{i+1:03d}',
                    meter_type.value,
                    f'Zone_{random.randint(1, 5)}_Building_{i+1}',
                    user_type
                )
                meters.append(meter_config)
        
        logger.info(f"Initialized {len(meters)} enhanced meters")
        return meters

    def get_user_type_from_meter_type(self, meter_type: MeterType) -> str:
        """Map meter type to user type"""
        mapping = {
            MeterType.SOLAR_PROSUMER: 'Prosumer',
            MeterType.GRID_CONSUMER: 'Consumer',
            MeterType.HYBRID_PROSUMER: 'Prosumer',
            MeterType.BATTERY_STORAGE: 'Storage_Provider'
        }
        return mapping.get(meter_type, 'Consumer')

    def create_meter_config(self, meter_id: str, meter_type: str, location: str, 
                          user_type: str, trading_prefs: Optional[Dict] = None) -> Dict[str, Any]:
        """Create enhanced meter configuration"""
        config = {
            'meter_id': meter_id,
            'meter_type': meter_type,
            'location': location,
            'user_type': user_type,
            
            # Generation capabilities
            'has_solar': meter_type in ['Solar_Prosumer', 'Hybrid_Prosumer'],
            'has_battery': meter_type in ['Hybrid_Prosumer', 'Battery_Storage'],
            'solar_capacity': random.uniform(5.0, 15.0) if 'Prosumer' in meter_type else 0.0,
            'battery_capacity': random.uniform(10.0, 30.0) if 'Battery' in meter_type or 'Hybrid' in meter_type else 0.0,
            
            # Efficiency parameters
            'panel_efficiency': random.uniform(self.solar_panel_efficiency_min, self.solar_panel_efficiency_max),
            'inverter_efficiency': random.uniform(0.94, 0.98),
            'battery_efficiency': random.uniform(0.90, 0.95),
            
            # Consumption patterns
            'base_consumption': random.uniform(1.5, 8.0),
            'consumption_variability': random.uniform(0.1, 0.3),
            
            # Trading preferences
            'trading_enabled': trading_prefs.get('enabled', True) if trading_prefs else True,
            'preferred_sell_price': random.uniform(self.min_sell_price, self.max_sell_price),
            'preferred_buy_price': random.uniform(self.min_buy_price, self.max_buy_price),
            'trading_strategy': random.choice(['Conservative', 'Moderate', 'Aggressive']),
            
            # Battery state (if applicable)
            'current_battery_level': random.uniform(20, 80) if 'Battery' in meter_type or 'Hybrid' in meter_type else 0,
            
            # Noise and variability
            'noise_factor': random.uniform(0.05, 0.15),
            'weather_sensitivity': random.uniform(0.7, 1.0)
        }
        
        return config

    def update_weather_simulation(self):
        """Update weather conditions with realistic patterns"""
        self.weather_duration += 1
        
        if self.weather_duration >= self.weather_change_interval:
            # Choose new weather condition based on current weather and probabilities
            weather_transitions = {
                WeatherCondition.SUNNY: [WeatherCondition.SUNNY, WeatherCondition.PARTLY_CLOUDY],
                WeatherCondition.PARTLY_CLOUDY: [WeatherCondition.SUNNY, WeatherCondition.CLOUDY, WeatherCondition.PARTLY_CLOUDY],
                WeatherCondition.CLOUDY: [WeatherCondition.PARTLY_CLOUDY, WeatherCondition.OVERCAST, WeatherCondition.CLOUDY],
                WeatherCondition.OVERCAST: [WeatherCondition.CLOUDY, WeatherCondition.RAINY, WeatherCondition.OVERCAST],
                WeatherCondition.RAINY: [WeatherCondition.OVERCAST, WeatherCondition.CLOUDY]
            }
            
            possible_conditions = weather_transitions.get(self.current_weather, list(WeatherCondition))
            weights = [self.weather_weights[condition] for condition in possible_conditions]
            
            self.current_weather = random.choices(possible_conditions, weights=weights)[0]
            self.weather_duration = 0
            self.weather_change_interval = random.randint(2, 10)
            
            logger.info(f"Weather changed to: {self.current_weather.value}")

    def calculate_solar_generation_factor(self) -> Tuple[float, float, float]:
        """Calculate solar generation factors with enhanced weather modeling"""
        current_time = datetime.now()
        hour = current_time.hour
        
        # Base solar curve (time of day factor)
        if 6 <= hour <= 18:
            # Enhanced solar curve with more realistic progression
            time_factor = math.sin(math.pi * (hour - 6) / 12) ** 2
        else:
            time_factor = 0.0
        
        # Weather impact on solar generation
        weather_factors = {
            WeatherCondition.SUNNY: 1.0,
            WeatherCondition.PARTLY_CLOUDY: random.uniform(0.7, 0.9),
            WeatherCondition.CLOUDY: random.uniform(0.4, 0.7),
            WeatherCondition.OVERCAST: random.uniform(0.2, 0.4),
            WeatherCondition.RAINY: random.uniform(0.1, 0.3)
        }
        
        weather_factor = weather_factors.get(self.current_weather, 0.8)
        
        # Calculate irradiance (W/m²)
        max_irradiance = 1200  # Clear sky peak irradiance
        irradiance = time_factor * weather_factor * max_irradiance + random.gauss(0, 50)
        irradiance = max(0, irradiance)
        
        # Panel temperature affects efficiency (higher temp = lower efficiency)
        ambient_temp = random.gauss(25, 5)  # Base temperature
        panel_temp = ambient_temp + (irradiance / 1000) * 25  # Panel heating from solar
        
        return time_factor * weather_factor, irradiance, panel_temp

    def calculate_consumption_pattern(self, hour: int, meter_config: Dict[str, Any]) -> float:
        """Calculate realistic consumption patterns based on user type and time"""
        base_consumption = meter_config['base_consumption']
        variability = meter_config['consumption_variability']
        user_type = meter_config['user_type']
        
        # Time-of-day patterns by user type
        if user_type == 'Consumer':
            # Residential pattern: morning and evening peaks
            if 6 <= hour <= 9 or 17 <= hour <= 22:  # Peak hours
                time_factor = random.uniform(1.4, 2.0)
            elif 22 <= hour or hour <= 6:  # Night
                time_factor = random.uniform(0.3, 0.7)
            else:  # Day
                time_factor = random.uniform(0.7, 1.1)
        
        elif user_type == 'Prosumer':
            # Smart prosumer: lower consumption during high solar generation
            if 10 <= hour <= 15:  # Solar peak hours - shifted consumption
                time_factor = random.uniform(0.6, 0.9)
            elif 7 <= hour <= 9 or 18 <= hour <= 21:  # Morning/evening
                time_factor = random.uniform(1.2, 1.6)
            else:
                time_factor = random.uniform(0.8, 1.2)
        
        else:  # Storage_Provider or other
            # More consistent industrial-like pattern
            if 8 <= hour <= 17:  # Business hours
                time_factor = random.uniform(1.1, 1.4)
            else:
                time_factor = random.uniform(0.7, 1.0)
        
        # Add randomness and variability
        consumption = base_consumption * time_factor * random.gauss(1.0, variability)
        return max(0, consumption)

    def generate_enhanced_reading(self, meter_config: Dict[str, Any]) -> EnergyReading:
        """Generate enhanced meter reading with trading data"""
        current_time = datetime.now(timezone.utc)
        timestamp = current_time.isoformat()
        hour = current_time.hour
        
        # Update weather
        self.update_weather_simulation()
        
        # Calculate solar generation
        solar_factor, irradiance, panel_temp = self.calculate_solar_generation_factor()
        
        energy_generated = 0.0
        if meter_config['has_solar']:
            solar_capacity = meter_config['solar_capacity']
            panel_efficiency = meter_config['panel_efficiency'] * meter_config['weather_sensitivity']
            inverter_efficiency = meter_config['inverter_efficiency']
            
            # Temperature derating (panels lose efficiency when hot)
            temp_coefficient = -0.004  # -0.4% per degree above 25°C
            temp_derating = 1 + temp_coefficient * (panel_temp - 25)
            temp_derating = max(0.7, min(1.0, temp_derating))  # Limit between 70% and 100%
            
            base_generation = solar_capacity * solar_factor * panel_efficiency * inverter_efficiency * temp_derating
            noise = random.gauss(0, base_generation * meter_config['noise_factor'])
            energy_generated = max(0, base_generation + noise)
        
        # Calculate consumption
        energy_consumed = self.calculate_consumption_pattern(hour, meter_config)
        
        # Battery simulation
        battery_level = meter_config.get('current_battery_level', 0)
        if meter_config['has_battery']:
            battery_capacity = meter_config['battery_capacity']
            battery_efficiency = meter_config['battery_efficiency']
            
            # Simple battery management: charge during excess, discharge during deficit
            net_energy = energy_generated - energy_consumed
            
            if net_energy > 0:  # Excess energy, charge battery
                charge_amount = min(net_energy * battery_efficiency, 
                                  (100 - battery_level) / 100 * battery_capacity)
                battery_level += (charge_amount / battery_capacity) * 100
            elif net_energy < 0:  # Energy deficit, discharge battery
                discharge_amount = min(abs(net_energy), 
                                     (battery_level / 100) * battery_capacity)
                battery_level -= (discharge_amount / battery_capacity) * 100
                energy_generated += discharge_amount  # Add battery energy to generation
            
            battery_level = max(0, min(100, battery_level))
            meter_config['current_battery_level'] = battery_level
        
        # Calculate trading parameters
        net_energy = energy_generated - energy_consumed
        surplus_energy = max(0, net_energy)
        deficit_energy = max(0, -net_energy)
        
        energy_available_for_sale = surplus_energy * 0.8  # Reserve 20% for self-consumption buffer
        energy_needed_from_grid = deficit_energy if not meter_config['has_battery'] or battery_level < 10 else max(0, deficit_energy - (battery_level/100 * meter_config.get('battery_capacity', 0)))
        
        # Trading preferences based on strategy
        strategy = meter_config['trading_strategy']
        base_sell_price = meter_config['preferred_sell_price']
        base_buy_price = meter_config['preferred_buy_price']
        
        if strategy == 'Aggressive':
            max_sell_price = base_sell_price * random.uniform(1.1, 1.3)
            max_buy_price = base_buy_price * random.uniform(0.8, 0.95)
        elif strategy == 'Conservative':
            max_sell_price = base_sell_price * random.uniform(0.9, 1.05)
            max_buy_price = base_buy_price * random.uniform(1.05, 1.2)
        else:  # Moderate
            max_sell_price = base_sell_price * random.uniform(0.95, 1.15)
            max_buy_price = base_buy_price * random.uniform(0.95, 1.1)
        
        # REC eligibility (Renewable Energy Certificate)
        rec_eligible = meter_config['has_solar'] and energy_generated > 0
        carbon_offset = energy_generated * 0.7 if rec_eligible else 0  # kg CO2 offset per kWh
        
        # Electrical parameters
        voltage = random.gauss(240.0, 3.0)
        total_power = energy_generated + energy_consumed
        current = (total_power / voltage * 1000) if voltage > 0 else 0
        power_factor = random.uniform(0.92, 0.98)
        frequency = random.gauss(50.0, 0.05)
        
        return EnergyReading(
            timestamp=timestamp,
            meter_id=meter_config['meter_id'],
            meter_type=meter_config['meter_type'],
            location=meter_config['location'],
            user_type=meter_config['user_type'],
            
            energy_generated=round(energy_generated, 4),
            energy_consumed=round(energy_consumed, 4),
            energy_available_for_sale=round(energy_available_for_sale, 4),
            energy_needed_from_grid=round(energy_needed_from_grid, 4),
            battery_level=round(battery_level, 1),
            
            voltage=round(voltage, 2),
            current=round(current, 3),
            power_factor=round(power_factor, 3),
            frequency=round(frequency, 2),
            temperature=round(panel_temp if meter_config['has_solar'] else random.gauss(25, 3), 1),
            
            irradiance=round(irradiance, 1) if meter_config['has_solar'] else None,
            panel_temperature=round(panel_temp, 1) if meter_config['has_solar'] else None,
            weather_condition=self.current_weather.value,
            
            grid_connection_status=GridConnectionStatus.CONNECTED.value,
            grid_feed_in_rate=round(self.grid_feed_in_rate, 3),
            grid_purchase_rate=round(self.grid_purchase_rate, 3),
            
            surplus_energy=round(surplus_energy, 4),
            deficit_energy=round(deficit_energy, 4),
            trading_preference=strategy,
            max_sell_price=round(max_sell_price, 3),
            max_buy_price=round(max_buy_price, 3),
            
            rec_eligible=rec_eligible,
            carbon_offset=round(carbon_offset, 3)
        )

    def send_to_kafka(self, reading: EnergyReading) -> bool:
        """Send enhanced reading to Kafka with multiple topics"""
        if not self.producer:
            return False
        
        try:
            reading_dict = asdict(reading)
            
            # Send to main energy readings topic
            self.producer.send('energy-readings', 
                             key=reading.meter_id, 
                             value=reading_dict)
            
            # Send trading data to trading topic if surplus or deficit exists
            if reading.surplus_energy > 0 or reading.deficit_energy > 0:
                trading_data = {
                    'timestamp': reading.timestamp,
                    'meter_id': reading.meter_id,
                    'user_type': reading.user_type,
                    'surplus_energy': reading.surplus_energy,
                    'deficit_energy': reading.deficit_energy,
                    'max_sell_price': reading.max_sell_price,
                    'max_buy_price': reading.max_buy_price,
                    'trading_preference': reading.trading_preference,
                    'location': reading.location
                }
                
                self.producer.send('trading-opportunities', 
                                 key=reading.meter_id,
                                 value=trading_data)
                self.stats['trading_opportunities'] += 1
            
            # Send REC data if eligible
            if reading.rec_eligible:
                rec_data = {
                    'timestamp': reading.timestamp,
                    'meter_id': reading.meter_id,
                    'energy_generated': reading.energy_generated,
                    'carbon_offset': reading.carbon_offset,
                    'weather_condition': reading.weather_condition,
                    'irradiance': reading.irradiance
                }
                
                self.producer.send('renewable-certificates',
                                 key=reading.meter_id,
                                 value=rec_data)
                self.stats['rec_generated'] += 1
            
            self.stats['kafka_sends'] += 1
            return True
            
        except Exception as e:
            logger.error(f"Failed to send to Kafka: {e}")
            return False

    def store_in_timescaledb(self, reading: EnergyReading) -> bool:
        """Store enhanced reading in TimescaleDB"""
        if not self.timescale_conn:
            return False
        
        try:
            with self.timescale_conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO energy_readings_enhanced (
                        time, meter_id, meter_type, location, user_type,
                        energy_generated, energy_consumed, energy_available_for_sale,
                        energy_needed_from_grid, battery_level,
                        voltage, current, power_factor, frequency, temperature,
                        irradiance, panel_temperature, weather_condition,
                        grid_connection_status, grid_feed_in_rate, grid_purchase_rate,
                        surplus_energy, deficit_energy, trading_preference,
                        max_sell_price, max_buy_price,
                        rec_eligible, carbon_offset
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    reading.timestamp, reading.meter_id, reading.meter_type,
                    reading.location, reading.user_type,
                    reading.energy_generated, reading.energy_consumed,
                    reading.energy_available_for_sale, reading.energy_needed_from_grid,
                    reading.battery_level, reading.voltage, reading.current,
                    reading.power_factor, reading.frequency, reading.temperature,
                    reading.irradiance, reading.panel_temperature,
                    reading.weather_condition, reading.grid_connection_status,
                    reading.grid_feed_in_rate, reading.grid_purchase_rate,
                    reading.surplus_energy, reading.deficit_energy,
                    reading.trading_preference, reading.max_sell_price,
                    reading.max_buy_price, reading.rec_eligible, reading.carbon_offset
                ))
            
            self.timescale_conn.commit()
            self.stats['db_stores'] += 1
            return True
            
        except Exception as e:
            logger.error(f"Failed to store in TimescaleDB: {e}")
            return False

    def save_to_file(self, reading: EnergyReading) -> bool:
        """Save reading to JSONL file"""
        try:
            with open(self.output_file, 'a') as f:
                json.dump(asdict(reading), f, default=str)
                f.write('\n')
            
            self.stats['file_saves'] += 1
            return True
            
        except Exception as e:
            logger.error(f"Failed to save to file: {e}")
            return False

    def simulate_readings(self):
        """Generate and process all meter readings"""
        logger.info(f"Generating enhanced readings for {len(self.meters)} meters")
        
        batch_readings = []
        
        for meter_config in self.meters:
            try:
                reading = self.generate_enhanced_reading(meter_config)
                batch_readings.append(reading)
                
                self.stats['total_readings'] += 1
                
                # Send to various outputs
                kafka_success = self.send_to_kafka(reading)
                db_success = self.store_in_timescaledb(reading)
                file_success = self.save_to_file(reading)
                
                if not (kafka_success or db_success or file_success):
                    logger.warning(f"Failed to store reading for {meter_config['meter_id']}")
                
            except Exception as e:
                logger.error(f"Failed to process meter {meter_config['meter_id']}: {e}")
        
        # Flush Kafka producer
        if self.producer:
            try:
                self.producer.flush()
            except Exception as e:
                logger.error(f"Failed to flush Kafka: {e}")
        
        # Log summary
        total_surplus = sum(r.surplus_energy for r in batch_readings)
        total_deficit = sum(r.deficit_energy for r in batch_readings)
        total_generation = sum(r.energy_generated for r in batch_readings)
        total_consumption = sum(r.energy_consumed for r in batch_readings)
        
        logger.info(f"Cycle Summary - Generation: {total_generation:.2f} kWh, "
                   f"Consumption: {total_consumption:.2f} kWh, "
                   f"Surplus: {total_surplus:.2f} kWh, "
                   f"Deficit: {total_deficit:.2f} kWh")

    def print_statistics(self):
        """Print comprehensive statistics"""
        print(f"\n{'='*60}")
        print("Enhanced AMI Simulator Statistics")
        print(f"{'='*60}")
        print(f"Total Readings Generated: {self.stats['total_readings']:,}")
        print(f"Kafka Messages Sent: {self.stats['kafka_sends']:,}")
        print(f"Database Records Stored: {self.stats['db_stores']:,}")
        print(f"Files Saved: {self.stats['file_saves']:,}")
        print(f"Trading Opportunities: {self.stats['trading_opportunities']:,}")
        print(f"REC Certificates Generated: {self.stats['rec_generated']:,}")
        print(f"Current Weather: {self.current_weather.value}")
        print(f"Active Meters: {len(self.meters)}")
        print(f"Simulation Interval: {self.simulation_interval}s")
        print(f"Mode: {'Standalone' if self.standalone_mode else 'Integrated'}")
        print(f"{'='*60}")

    def run(self):
        """Run the enhanced simulator"""
        print("Starting Enhanced Smart Meter Simulator for P2P Energy Trading")
        print("="*70)
        print(f"Meters: {self.num_meters}")
        print(f"Simulation Interval: {self.simulation_interval} seconds")
        print(f"Weather: {self.current_weather.value}")
        print(f"Mode: {'Standalone' if self.standalone_mode else 'Integrated'}")
        print(f"Output File: {self.output_file}")
        print("="*70)
        
        # Print meter summary
        meter_types = {}
        for meter in self.meters:
            meter_type = meter['meter_type']
            meter_types[meter_type] = meter_types.get(meter_type, 0) + 1
        
        print("Meter Distribution:")
        for meter_type, count in meter_types.items():
            print(f"  {meter_type}: {count}")
        print("="*70)
        
        # Schedule periodic readings
        schedule.every(self.simulation_interval).seconds.do(self.simulate_readings)
        
        # Generate initial readings
        self.simulate_readings()
        
        try:
            while True:
                schedule.run_pending()
                time.sleep(1)
                
        except KeyboardInterrupt:
            logger.info("Shutting down enhanced simulator...")
            self.print_statistics()
            
            # Cleanup connections
            if self.producer:
                try:
                    self.producer.close()
                except Exception as e:
                    logger.error(f"Error closing Kafka producer: {e}")
            
            for conn_name, conn in [('Database', self.db_conn), ('TimescaleDB', self.timescale_conn)]:
                if conn:
                    try:
                        conn.close()
                    except Exception as e:
                        logger.error(f"Error closing {conn_name} connection: {e}")
            
            logger.info("Enhanced simulator shutdown complete")

if __name__ == "__main__":
    simulator = EnhancedSmartMeterSimulator()
    simulator.run()