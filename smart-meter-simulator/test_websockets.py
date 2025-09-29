#!/usr/bin/env python3
"""
WebSocket Test Script for GridTokenX Smart Meter Simulator

This script tests the WebSocket endpoints to ensure real-time data streaming is working.

Usage:
    python test_websockets.py

Requirements:
    - Smart meter simulator running on localhost:4040
    - websockets library installed
"""

import asyncio
import json
import websockets
import logging
import time
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class WebSocketTester:
    def __init__(self, host='localhost', port=4040):
        self.host = host
        self.port = port
        self.test_results = {
            'readings_connection': False,
            'summary_connection': False,
            'readings_data': False,
            'summary_data': False,
            'data_consistency': False
        }

    async def test_readings_websocket(self):
        """Test the readings WebSocket endpoint"""
        uri = f"ws://{self.host}:{self.port}/ws/readings"
        logger.info("Testing readings WebSocket...")

        try:
            async with websockets.connect(uri) as websocket:
                logger.info("✓ Connected to readings WebSocket")

                # Send subscription
                await websocket.send(json.dumps({"type": "subscribe"}))
                logger.info("✓ Sent subscription message")

                # Wait for first message
                message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                data = json.loads(message)

                if data.get('type') == 'readings_update' and 'data' in data:
                    readings = data['data']
                    logger.info(f"✓ Received readings update with {len(readings)} meters")

                    # Validate data structure
                    if len(readings) > 0:
                        sample_meter = readings[0]
                        required_fields = ['meter_id', 'energy_consumed', 'energy_generated', 'building', 'floor']
                        if all(field in sample_meter for field in required_fields):
                            logger.info("✓ Meter data structure is valid")
                            self.test_results['readings_data'] = True
                        else:
                            logger.error("✗ Meter data structure is missing required fields")
                    else:
                        logger.warning("⚠ No meter readings received")

                    self.test_results['readings_connection'] = True
                    return True
                else:
                    logger.error("✗ Unexpected message format")
                    return False

        except asyncio.TimeoutError:
            logger.error("✗ Timeout waiting for readings data")
            return False
        except Exception as e:
            logger.error(f"✗ Readings WebSocket error: {e}")
            return False

    async def test_summary_websocket(self):
        """Test the summary WebSocket endpoint"""
        uri = f"ws://{self.host}:{self.port}/ws/summary"
        logger.info("Testing summary WebSocket...")

        try:
            async with websockets.connect(uri) as websocket:
                logger.info("✓ Connected to summary WebSocket")

                # Send subscription
                await websocket.send(json.dumps({"type": "subscribe"}))
                logger.info("✓ Sent subscription message")

                # Wait for first message
                message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                data = json.loads(message)

                if data.get('type') == 'summary_update' and 'data' in data:
                    summary = data['data']
                    logger.info("✓ Received summary update")

                    # Validate summary structure
                    expected_fields = ['total_consumption', 'total_generation', 'total_grid_feed_in', 'total_meters']
                    if all(field in summary for field in expected_fields):
                        logger.info("✓ Summary data structure is valid")
                        self.test_results['summary_data'] = True
                    else:
                        logger.warning("⚠ Summary data structure is missing some fields")
                        logger.warning(f"Expected fields: {expected_fields}")
                        logger.warning(f"Received fields: {list(summary.keys())}")

                    self.test_results['summary_connection'] = True
                    return True
                else:
                    logger.error("✗ Unexpected message format")
                    return False

        except asyncio.TimeoutError:
            logger.error("✗ Timeout waiting for summary data")
            return False
        except Exception as e:
            logger.error(f"✗ Summary WebSocket error: {e}")
            return False

    async def test_data_consistency(self):
        """Test that readings and summary data are consistent"""
        logger.info("Testing data consistency between readings and summary...")

        # Connect to both WebSockets simultaneously
        readings_uri = f"ws://{self.host}:{self.port}/ws/readings"
        summary_uri = f"ws://{self.host}:{self.port}/ws/summary"

        try:
            async with websockets.connect(readings_uri) as readings_ws, \
                       websockets.connect(summary_uri) as summary_ws:

                # Subscribe to both
                await readings_ws.send(json.dumps({"type": "subscribe"}))
                await summary_ws.send(json.dumps({"type": "subscribe"}))

                # Get data from both
                readings_msg = await asyncio.wait_for(readings_ws.recv(), timeout=5.0)
                summary_msg = await asyncio.wait_for(summary_ws.recv(), timeout=5.0)

                readings_data = json.loads(readings_msg)
                summary_data = json.loads(summary_msg)

                if (readings_data.get('type') == 'readings_update' and
                    summary_data.get('type') == 'summary_update'):

                    readings = readings_data['data']
                    summary = summary_data['data']

                    # Calculate totals from readings
                    calc_consumption = sum(m.get('energy_consumed', 0) for m in readings)
                    calc_generation = sum(m.get('energy_generated', 0) for m in readings)
                    calc_feed_in = sum(m.get('grid_feed_in', 0) for m in readings)

                    # Compare with summary
                    sum_consumption = summary.get('total_consumption', 0)
                    sum_generation = summary.get('total_generation', 0)
                    sum_feed_in = summary.get('total_grid_feed_in', 0)

                    # Allow for small floating point differences
                    tolerance = 0.01

                    if (abs(calc_consumption - sum_consumption) < tolerance and
                        abs(calc_generation - sum_generation) < tolerance and
                        abs(calc_feed_in - sum_feed_in) < tolerance):

                        logger.info("✓ Data consistency check passed")
                        self.test_results['data_consistency'] = True
                        return True
                    else:
                        logger.warning("⚠ Data consistency check failed - calculations don't match")
                        logger.warning(f"  Calculated: C={calc_consumption:.2f}, G={calc_generation:.2f}, F={calc_feed_in:.2f}")
                        logger.warning(f"  Summary: C={sum_consumption:.2f}, G={sum_generation:.2f}, F={sum_feed_in:.2f}")
                        return False
                else:
                    logger.error("✗ Failed to get both data types")
                    return False

        except Exception as e:
            logger.error(f"✗ Data consistency test error: {e}")
            return False

    async def run_tests(self):
        """Run all WebSocket tests"""
        print("🧪 GridTokenX WebSocket Test Suite")
        print("=" * 50)
        print(f"Testing simulator at {self.host}:{self.port}")
        print()

        # Test individual connections
        await self.test_readings_websocket()
        print()
        await self.test_summary_websocket()
        print()

        # Test data consistency
        await self.test_data_consistency()
        print()

        # Print results
        print("📊 Test Results:")
        print("-" * 30)
        for test, passed in self.test_results.items():
            status = "✓ PASS" if passed else "✗ FAIL"
            print(f"  {test.replace('_', ' ').title()}: {status}")

        total_tests = len(self.test_results)
        passed_tests = sum(self.test_results.values())

        print()
        print(f"Overall: {passed_tests}/{total_tests} tests passed")

        if passed_tests == total_tests:
            print("🎉 All WebSocket tests passed! Real-time data streaming is working correctly.")
            return True
        else:
            print("⚠️  Some tests failed. Check the simulator logs for issues.")
            return False

async def main():
    """Main entry point"""
    tester = WebSocketTester()

    try:
        success = await tester.run_tests()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.info("Tests interrupted by user")
        exit(1)
    except Exception as e:
        logger.error(f"Test suite error: {e}")
        exit(1)

if __name__ == "__main__":
    asyncio.run(main())