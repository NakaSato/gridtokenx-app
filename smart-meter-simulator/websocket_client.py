#!/usr/bin/env python3
"""
GridTokenX Smart Meter WebSocket Client Example

This script demonstrates how to connect to the smart meter simulator's
WebSocket endpoints for real-time data streaming.

Usage:
    python websocket_client.py

Requirements:
    pip install websockets
"""

import asyncio
import json
import websockets
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SmartMeterWebSocketClient:
    def __init__(self, host='localhost', port=4040):
        self.host = host
        self.port = port
        self.readings_ws = None
        self.summary_ws = None

    async def connect_readings(self):
        """Connect to the readings WebSocket endpoint"""
        uri = f"ws://{self.host}:{self.port}/ws/readings"
        try:
            async with websockets.connect(uri) as websocket:
                logger.info("Connected to readings WebSocket")
                self.readings_ws = websocket

                # Send subscription message
                await websocket.send(json.dumps({"type": "subscribe"}))
                logger.info("Subscribed to readings updates")

                async for message in websocket:
                    try:
                        data = json.loads(message)
                        if data.get('type') == 'readings_update':
                            self.handle_readings_update(data)
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse readings message: {e}")

        except Exception as e:
            logger.error(f"Readings WebSocket error: {e}")

    async def connect_summary(self):
        """Connect to the summary WebSocket endpoint"""
        uri = f"ws://{self.host}:{self.port}/ws/summary"
        try:
            async with websockets.connect(uri) as websocket:
                logger.info("Connected to summary WebSocket")
                self.summary_ws = websocket

                # Send subscription message
                await websocket.send(json.dumps({"type": "subscribe"}))
                logger.info("Subscribed to summary updates")

                async for message in websocket:
                    try:
                        data = json.loads(message)
                        if data.get('type') == 'summary_update':
                            self.handle_summary_update(data)
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse summary message: {e}")

        except Exception as e:
            logger.error(f"Summary WebSocket error: {e}")

    def handle_readings_update(self, data):
        """Handle incoming readings update"""
        timestamp = data.get('timestamp', 'Unknown')
        readings = data.get('data', [])

        logger.info(f"Received readings update at {timestamp} - {len(readings)} meters")

        # Display summary statistics
        total_consumption = sum(meter.get('energy_consumed', 0) for meter in readings)
        total_generation = sum(meter.get('energy_generated', 0) for meter in readings)
        total_feed_in = sum(meter.get('grid_feed_in', 0) for meter in readings)

        print(f"\n📊 Campus Summary:")
        print(f"   Total Consumption: {total_consumption:.2f} kW")
        print(f"   Total Generation: {total_generation:.2f} kW")
        print(f"   Grid Feed-in: {total_feed_in:.2f} kW")
        print(f"   Net Balance: {total_generation - total_consumption:.2f} kW")

        # Show a few sample meters
        print(f"\n🔍 Sample Meter Readings:")
        for i, meter in enumerate(readings[:3]):  # Show first 3 meters
            print(f"   {meter.get('meter_id', 'Unknown')}: "
                  f"{meter.get('energy_consumed', 0):.2f} kW consumed, "
                  f"{meter.get('energy_generated', 0):.2f} kW generated")

        if len(readings) > 3:
            print(f"   ... and {len(readings) - 3} more meters")

    def handle_summary_update(self, data):
        """Handle incoming summary update"""
        timestamp = data.get('timestamp', 'Unknown')
        summary = data.get('data', {})

        logger.info(f"Received summary update at {timestamp}")

        print(f"\n📈 Campus Summary Update:")
        print(f"   Total Consumption: {summary.get('total_consumption', 0):.2f} kW")
        print(f"   Total Generation: {summary.get('total_generation', 0):.2f} kW")
        print(f"   Grid Feed-in: {summary.get('total_grid_feed_in', 0):.2f} kW")
        print(f"   Active Meters: {summary.get('active_meters', 0)}")
        print(f"   Simulation Interval: {summary.get('simulation_interval', 15)} seconds")

    async def run(self):
        """Run both WebSocket connections concurrently"""
        logger.info("Starting GridTokenX Smart Meter WebSocket Client")
        logger.info(f"Connecting to simulator at {self.host}:{self.port}")

        # Run both connections concurrently
        await asyncio.gather(
            self.connect_readings(),
            self.connect_summary()
        )

async def main():
    """Main entry point"""
    print("🏫 GridTokenX Smart Meter WebSocket Client")
    print("=" * 50)
    print("This client will connect to the smart meter simulator's WebSocket endpoints")
    print("and display real-time updates from all 25 UTCC University meters.")
    print()
    print("Make sure the simulator is running on localhost:4040")
    print("Press Ctrl+C to stop")
    print()

    client = SmartMeterWebSocketClient()

    try:
        await client.run()
    except KeyboardInterrupt:
        logger.info("Client stopped by user")
    except Exception as e:
        logger.error(f"Client error: {e}")

if __name__ == "__main__":
    asyncio.run(main())