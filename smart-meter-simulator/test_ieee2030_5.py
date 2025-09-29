#!/usr/bin/env python3
"""
IEEE 2030.5 Test Script
Tests the IEEE 2030.5 implementation components
"""

import asyncio
import json
import sys
import os
from pathlib import Path

# Add the current directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ieee2030_5.resources import DeviceCapability, EndDevice, MirrorUsagePoint, MeterReading, ResourceType
from ieee2030_5.security import SecurityManager
from ieee2030_5.function_sets import FunctionSetManager
from ieee2030_5.server import IEEE20305Server
from ieee2030_5.client import IEEE20305Client


def test_resources():
    """Test IEEE 2030.5 resource models"""
    print("🧪 Testing IEEE 2030.5 Resource Models...")

    # Test DeviceCapability
    dcap = DeviceCapability(href="/dcap", resource_type=ResourceType.DCAP)
    dcap_dict = dcap.to_dict()
    assert dcap_dict["href"] == "/dcap"
    assert dcap_dict["deviceCategory"] == "smart_meter"
    print("✅ DeviceCapability resource test passed")

    # Test EndDevice
    edev = EndDevice(href="/edev/test", resource_type=ResourceType.EDEV)
    edev.lfdi = "TEST_LFDI_123"
    edev.sfdi = "TEST_SFDI"
    edev_dict = edev.to_dict()
    assert edev_dict["lfdi"] == "TEST_LFDI_123"
    assert edev_dict["enabled"] == True
    print("✅ EndDevice resource test passed")

    # Test MirrorUsagePoint
    mup = MirrorUsagePoint(href="/mup/test", resource_type=ResourceType.MUP)
    mup.device_lfdi = "TEST_LFDI_123"
    mup_dict = mup.to_dict()
    assert mup_dict["deviceLFDI"] == "TEST_LFDI_123"
    print("✅ MirrorUsagePoint resource test passed")

    # Test MeterReading
    reading = MeterReading(
        reading_type="energy",
        value=150.5,
        uom="kWh",
        quality="valid"
    )
    reading_dict = reading.to_dict()
    assert reading_dict["value"] == 150.5
    assert reading_dict["uom"] == "kWh"
    print("✅ MeterReading resource test passed")


def test_security():
    """Test security manager"""
    print("🧪 Testing Security Manager...")

    security = SecurityManager()

    # Test device registration
    device_info = {
        "organization": "UTCC University",
        "device_category": "smart_meter"
    }

    cert_info = security.register_device("TEST_METER_001", device_info)
    assert cert_info is not None
    assert "certificate" in cert_info
    print("✅ Device certificate registration test passed")

    # Test certificate verification using CA method
    ca_cert_json = json.dumps(security.ca.ca_certificate)
    is_valid = security.ca.verify_certificate(ca_cert_json)
    assert is_valid == True
    print("✅ Certificate verification test passed")


def test_function_sets():
    """Test function set manager"""
    print("🧪 Testing Function Set Manager...")

    # Create a mock server object
    class MockServer:
        pass

    server = MockServer()
    fs_manager = FunctionSetManager(server)

    # Test function set listing
    function_sets = fs_manager.list_function_sets()
    expected_sets = ["drlc", "csip", "pricing", "p2p_extensions"]
    assert set(function_sets) == set(expected_sets)
    print("✅ Function set listing test passed")

    # Test function set retrieval
    drlc_fs = fs_manager.get_function_set("drlc")
    assert drlc_fs is not None
    assert hasattr(drlc_fs, "create_demand_response_event")
    print("✅ Function set retrieval test passed")


async def test_server():
    """Test IEEE 2030.5 server (basic startup)"""
    print("🧪 Testing IEEE 2030.5 Server...")

    # Create server instance (without SSL for testing)
    server = IEEE20305Server(host="127.0.0.1", port=8444)

    # Test server initialization
    assert server.host == "127.0.0.1"
    assert server.port == 8444
    assert len(server.resources) > 0  # Should have default resources
    print("✅ Server initialization test passed")

    # Test resource access
    dcap_resource = server.resources.get("/dcap")
    assert dcap_resource is not None
    assert hasattr(dcap_resource, "to_dict")
    print("✅ Server resource access test passed")


async def test_client():
    """Test IEEE 2030.5 client"""
    print("🧪 Testing IEEE 2030.5 Client...")

    # Create security manager
    security = SecurityManager()

    # Create client
    client = IEEE20305Client(
        server_url="http://127.0.0.1:8444",
        security_manager=security,
        device_lfdi="TEST_CLIENT_LFDI"
    )

    # Test client initialization
    assert client.device_lfdi == "TEST_CLIENT_LFDI"
    assert client.server_url == "http://127.0.0.1:8444"
    print("✅ Client initialization test passed")


async def run_async_tests():
    """Run all async tests"""
    await test_server()
    await test_client()


def main():
    """Run all tests"""
    print("🚀 Starting IEEE 2030.5 Implementation Tests")
    print("=" * 50)

    try:
        # Run synchronous tests
        test_resources()
        test_security()
        test_function_sets()

        # Run asynchronous tests
        asyncio.run(run_async_tests())

        print("=" * 50)
        print("🎉 All IEEE 2030.5 tests passed successfully!")
        print("✅ Resource models working")
        print("✅ Security manager operational")
        print("✅ Function sets functional")
        print("✅ Server and client components ready")
        return 0

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit(main())