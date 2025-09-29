"""
IEEE 2030.5 Client
Client implementation for communicating with IEEE 2030.5 servers
"""

import requests
import json
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin
from .resources import (
    DeviceCapability, EndDevice, MirrorUsagePoint,
    MeterReading, DemandResponseEvent, PricingInfo,
    ResourceType
)
from .security import SecurityManager


class IEEE20305Client:
    """IEEE 2030.5 Client for device-to-server communication"""

    def __init__(self, server_url: str, security_manager: SecurityManager, device_lfdi: str):
        self.server_url = server_url.rstrip('/')
        self.security = security_manager
        self.device_lfdi = device_lfdi
        self.session = requests.Session()
        self.device_href: Optional[str] = None
        self.mirror_usage_point_href: Optional[str] = None

        # Configure session for IEEE 2030.5
        self.session.headers.update({
            'Content-Type': 'application/sep+xml',
            'Accept': 'application/sep+xml',
            'User-Agent': 'GridTokenX-SmartMeter/1.0'
        })

    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """Make an HTTP request to the IEEE 2030.5 server"""
        url = urljoin(self.server_url, endpoint.lstrip('/'))

        try:
            if data:
                response = self.session.request(method, url, json=data, timeout=30)
            else:
                response = self.session.request(method, url, timeout=30)

            response.raise_for_status()

            if response.content:
                return response.json()
            else:
                return {}

        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return {"error": str(e)}

    def register_device(self, device_info: Dict) -> bool:
        """Register this device with the IEEE 2030.5 server"""
        # Create device capability resource
        device_cap = DeviceCapability(href=f"/dcap_{self.device_lfdi}", resource_type=ResourceType.DCAP)

        # Register device capability
        result = self._make_request("POST", "/dcap", device_cap.to_dict())
        if "error" in result:
            print(f"Failed to register device capability: {result['error']}")
            return False

        # Create end device resource
        end_device = EndDevice(href=f"/edev_{self.device_lfdi}", resource_type=ResourceType.EDEV)
        end_device.lfdi = self.device_lfdi
        end_device.sfdi = self.device_lfdi[-8:] if len(self.device_lfdi) >= 8 else self.device_lfdi
        end_device.device_category = device_info.get("device_category", "smart_meter")

        # Register end device
        result = self._make_request("POST", "/edev", end_device.to_dict())
        if "error" in result:
            print(f"Failed to register end device: {result['error']}")
            return False

        self.device_href = end_device.href
        print(f"Device registered successfully: {self.device_href}")
        return True

    def register_mirror_usage_point(self, meter_config: Dict) -> bool:
        """Register mirror usage point for meter readings"""
        if not self.device_href:
            print("Device not registered yet")
            return False

        mirror = MirrorUsagePoint(href=f"/mup_{self.device_lfdi}", resource_type=ResourceType.MUP)
        mirror.device_lfdi = self.device_lfdi

        result = self._make_request("POST", "/mup", mirror.to_dict())
        if "error" in result:
            print(f"Failed to register mirror usage point: {result['error']}")
            return False

        self.mirror_usage_point_href = mirror.href
        print(f"Mirror usage point registered: {self.mirror_usage_point_href}")
        return True

    def send_meter_reading(self, reading: MeterReading) -> bool:
        """Send a meter reading to the server"""
        if not self.mirror_usage_point_href:
            print("Mirror usage point not registered")
            return False

        endpoint = f"{self.mirror_usage_point_href}/mr"
        result = self._make_request("POST", endpoint, reading.to_dict())

        if "error" in result:
            print(f"Failed to send meter reading: {result['error']}")
            return False

        return True

    def get_demand_response_events(self) -> List[DemandResponseEvent]:
        """Get active demand response events"""
        result = self._make_request("GET", "/drlc/events")

        if "error" in result:
            print(f"Failed to get DR events: {result['error']}")
            return []

        events = []
        for event_data in result.get("events", []):
            try:
                event = DemandResponseEvent(
                    event_id=event_data["eventId"],
                    start_time=datetime.fromisoformat(event_data["startTime"]),
                    end_time=datetime.fromisoformat(event_data["endTime"]),
                    duration=event_data.get("duration", 3600),
                    duty_cycle=event_data.get("dutyCycle", 1.0),
                    load_adjustment_percentage=event_data.get("loadAdjustmentPercentage", 0.0),
                    cooling_offset=event_data.get("coolingOffset", 0.0),
                    heating_offset=event_data.get("heatingOffset", 0.0),
                    critical_peak_pricing=event_data.get("criticalPeakPricing", False),
                    override_duration=event_data.get("overrideDuration", 0)
                )
                events.append(event)
            except Exception as e:
                print(f"Failed to parse DR event: {e}")

        return events

    def get_pricing_info(self) -> Optional[PricingInfo]:
        """Get current pricing information"""
        result = self._make_request("GET", "/csip/pricing/energy")

        if "error" in result:
            print(f"Failed to get pricing info: {result['error']}")
            return None

        try:
            pricing = PricingInfo(
                price=result.get("price", 0.0),
                currency=result.get("currency", "USD"),
                price_type=result.get("priceType", "energy"),
                tier=result.get("tier")
            )
            if result.get("timestamp"):
                pricing.timestamp = datetime.fromisoformat(result["timestamp"])
            return pricing
        except Exception as e:
            print(f"Failed to parse pricing info: {e}")
            return None

    def send_p2p_trading_offer(self, trading_data: Dict) -> bool:
        """Send a P2P trading offer"""
        result = self._make_request("POST", "/p2p/trades", trading_data)

        if "error" in result:
            print(f"Failed to send P2P trading offer: {result['error']}")
            return False

        return True

    def get_p2p_trading_offers(self) -> List[Dict]:
        """Get available P2P trading offers"""
        result = self._make_request("GET", "/p2p/trades")

        if "error" in result:
            print(f"Failed to get P2P trading offers: {result['error']}")
            return []

        return result.get("trades", [])

    def poll_server(self, interval_seconds: int = 60):
        """Poll the server for updates periodically"""
        while True:
            try:
                # Check for demand response events
                dr_events = self.get_demand_response_events()
                if dr_events:
                    print(f"Active DR events: {len(dr_events)}")
                    for event in dr_events:
                        print(f"  Event {event.event_id}: {event.load_adjustment_percentage}% load adjustment")

                # Check for pricing updates
                pricing = self.get_pricing_info()
                if pricing:
                    print(f"Current price: {pricing.price} {pricing.currency} per {pricing.price_type}")

                # Check for P2P trading opportunities
                offers = self.get_p2p_trading_offers()
                if offers:
                    print(f"Available P2P offers: {len(offers)}")

            except Exception as e:
                print(f"Error polling server: {e}")

            time.sleep(interval_seconds)

    def disconnect(self):
        """Disconnect from the server"""
        if self.device_href:
            # Unregister device
            self._make_request("DELETE", self.device_href)

        self.session.close()
        print("Disconnected from IEEE 2030.5 server")


class IEEE20305ServerSimulator:
    """Simplified IEEE 2030.5 Server Simulator for testing"""

    def __init__(self, host: str = "localhost", port: int = 8443):
        self.host = host
        self.port = port
        self.resources: Dict[str, Any] = {}
        self.clients: Dict[str, IEEE20305Client] = {}

        # Initialize some default resources
        self._init_default_resources()

    def _init_default_resources(self):
        """Initialize default server resources"""
        # Device capability
        dcap = DeviceCapability(href="/dcap", resource_type=ResourceType.DCAP)
        self.resources["/dcap"] = dcap

        # Function sets
        self.resources["/drlc"] = {"function_set": "drlc", "events": []}
        self.resources["/csip"] = {"function_set": "csip", "pricing": {}}
        self.resources["/p2p"] = {"function_set": "p2p_extensions", "trades": []}

    def register_client(self, client: IEEE20305Client):
        """Register a client with the server"""
        self.clients[client.device_lfdi] = client
        print(f"Client registered: {client.device_lfdi}")

    def get_resource(self, href: str) -> Optional[Any]:
        """Get a resource by href"""
        return self.resources.get(href)

    def create_resource(self, href: str, resource: Any) -> bool:
        """Create a new resource"""
        self.resources[href] = resource
        return True

    def update_resource(self, href: str, data: Dict) -> bool:
        """Update an existing resource"""
        if href in self.resources:
            if isinstance(self.resources[href], dict):
                self.resources[href].update(data)
            else:
                # For object resources, update attributes
                resource = self.resources[href]
                for key, value in data.items():
                    if hasattr(resource, key):
                        setattr(resource, key, value)
            return True
        return False

    def start(self):
        """Start the server (simplified - would normally start HTTP server)"""
        print(f"IEEE 2030.5 Server Simulator started on {self.host}:{self.port}")
        print("Available endpoints:")
        for href in self.resources.keys():
            print(f"  {href}")

    def stop(self):
        """Stop the server"""
        print("IEEE 2030.5 Server Simulator stopped")