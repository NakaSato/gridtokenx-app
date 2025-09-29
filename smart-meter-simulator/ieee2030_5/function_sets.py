"""
IEEE 2030.5 Function Sets
Implementation of Smart Energy Profile 2.0 function sets
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from .resources import (
    DemandResponseEvent, PricingInfo, P2PTradingInfo,
    MeterReading, EndDevice, MirrorUsagePoint
)


class FunctionSetBase:
    """Base class for IEEE 2030.5 function sets"""

    def __init__(self, server):
        self.server = server
        self.resources: Dict[str, Any] = {}

    def get_resource(self, href: str) -> Optional[Any]:
        """Get a resource by href"""
        return self.resources.get(href)

    def list_resources(self) -> List[str]:
        """List all resource hrefs in this function set"""
        return list(self.resources.keys())

    def update_resource(self, href: str, data: Dict) -> bool:
        """Update a resource"""
        if href in self.resources:
            # Update resource data
            resource = self.resources[href]
            for key, value in data.items():
                if hasattr(resource, key):
                    setattr(resource, key, value)
            resource.modification_date_time = datetime.now(timezone.utc)
            return True
        return False


class DemandResponseLoadControl(FunctionSetBase):
    """DRLC Function Set - Demand Response Load Control"""

    def __init__(self, server):
        super().__init__(server)
        self.function_set_name = "drlc"

    def create_demand_response_event(self, event_data: Dict) -> str:
        """Create a new demand response event"""
        event = DemandResponseEvent(
            event_id=event_data.get("eventId", f"event_{len(self.resources)}"),
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

        href = f"/drlc/events/{event.event_id}"
        self.resources[href] = event
        return href

    def get_active_events(self) -> List[DemandResponseEvent]:
        """Get all currently active demand response events"""
        now = datetime.now(timezone.utc)
        active_events = []

        for resource in self.resources.values():
            if isinstance(resource, DemandResponseEvent):
                if resource.start_time <= now <= resource.end_time:
                    active_events.append(resource)

        return active_events

    def cancel_event(self, event_id: str) -> bool:
        """Cancel a demand response event"""
        href = f"/drlc/events/{event_id}"
        if href in self.resources:
            del self.resources[href]
            return True
        return False


class CustomerSideInformationProvider(FunctionSetBase):
    """CSIP Function Set - Customer Side Information Provider"""

    def __init__(self, server):
        super().__init__(server)
        self.function_set_name = "csip"

    def publish_pricing_info(self, pricing_data: Dict) -> str:
        """Publish pricing information"""
        pricing = PricingInfo(
            price=pricing_data.get("price", 0.0),
            currency=pricing_data.get("currency", "USD"),
            price_type=pricing_data.get("priceType", "energy"),
            tier=pricing_data.get("tier")
        )
        if pricing_data.get("timestamp"):
            pricing.timestamp = datetime.fromisoformat(pricing_data["timestamp"])

        href = f"/csip/pricing/{pricing.price_type}"
        self.resources[href] = pricing
        return href

    def get_current_pricing(self, price_type: str = "energy") -> Optional[PricingInfo]:
        """Get current pricing information"""
        href = f"/csip/pricing/{price_type}"
        return self.resources.get(href)

    def publish_meter_reading(self, meter_id: str, reading_data: Dict) -> str:
        """Publish a meter reading"""
        reading = MeterReading(
            reading_type=reading_data.get("readingType", "energy"),
            value=reading_data.get("value", 0.0),
            uom=reading_data.get("uom", "Wh"),
            quality=reading_data.get("quality", "valid"),
            phase=reading_data.get("phase")
        )
        if reading_data.get("timestamp"):
            reading.timestamp = datetime.fromisoformat(reading_data["timestamp"])

        href = f"/csip/readings/{meter_id}/{reading.reading_type}"
        self.resources[href] = reading
        return href

    def get_meter_reading(self, meter_id: str, reading_type: str = "energy") -> Optional[MeterReading]:
        """Get a meter reading"""
        href = f"/csip/readings/{meter_id}/{reading_type}"
        return self.resources.get(href)


class PricingFunctionSet(FunctionSetBase):
    """Pricing Function Set"""

    def __init__(self, server):
        super().__init__(server)
        self.function_set_name = "pricing"

    def set_tariff_info(self, tariff_data: Dict) -> str:
        """Set tariff information"""
        # Simplified tariff structure
        tariff = {
            "tariff_id": tariff_data.get("tariffId", "default"),
            "rates": tariff_data.get("rates", []),
            "seasons": tariff_data.get("seasons", []),
            "tou_periods": tariff_data.get("touPeriods", []),
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        href = f"/pricing/tariffs/{tariff['tariff_id']}"
        self.resources[href] = tariff
        return href

    def get_tariff_info(self, tariff_id: str = "default") -> Optional[Dict]:
        """Get tariff information"""
        href = f"/pricing/tariffs/{tariff_id}"
        return self.resources.get(href)


class P2PExtensions(FunctionSetBase):
    """P2P Trading Extensions - Custom extensions for peer-to-peer energy trading"""

    def __init__(self, server):
        super().__init__(server)
        self.function_set_name = "p2p_extensions"

    def create_trading_offer(self, offer_data: Dict) -> str:
        """Create a P2P trading offer"""
        trading_info = P2PTradingInfo(
            trading_pair_id=offer_data.get("tradingPairId", f"trade_{len(self.resources)}"),
            buyer_meter_id=offer_data.get("buyerMeterId", ""),
            seller_meter_id=offer_data.get("sellerMeterId", ""),
            energy_amount=offer_data.get("energyAmount", 0.0),
            price_per_kwh=offer_data.get("pricePerKwh", 0.0),
            status=offer_data.get("status", "pending")
        )
        if offer_data.get("tradeTimestamp"):
            trading_info.trade_timestamp = datetime.fromisoformat(offer_data["tradeTimestamp"])

        href = f"/p2p/trades/{trading_info.trading_pair_id}"
        self.resources[href] = trading_info
        return href

    def get_trading_offer(self, trade_id: str) -> Optional[P2PTradingInfo]:
        """Get a trading offer"""
        href = f"/p2p/trades/{trade_id}"
        return self.resources.get(href)

    def update_trade_status(self, trade_id: str, status: str) -> bool:
        """Update the status of a trade"""
        href = f"/p2p/trades/{trade_id}"
        if href in self.resources:
            trade = self.resources[href]
            trade.status = status
            trade.trade_timestamp = datetime.now(timezone.utc)
            return True
        return False

    def get_active_trades(self) -> List[P2PTradingInfo]:
        """Get all active (pending or in-progress) trades"""
        active_trades = []
        for resource in self.resources.values():
            if isinstance(resource, P2PTradingInfo) and resource.status in ["pending", "in_progress"]:
                active_trades.append(resource)
        return active_trades

    def create_flow_reservation(self, reservation_data: Dict) -> str:
        """Create a flow reservation for P2P trading"""
        reservation = {
            "reservation_id": reservation_data.get("reservationId", f"res_{len(self.resources)}"),
            "trading_pair_id": reservation_data.get("tradingPairId", ""),
            "bandwidth_kw": reservation_data.get("bandwidthKw", 0.0),
            "duration_hours": reservation_data.get("durationHours", 1),
            "start_time": reservation_data.get("startTime"),
            "status": reservation_data.get("status", "reserved"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        href = f"/p2p/reservations/{reservation['reservation_id']}"
        self.resources[href] = reservation
        return href

    def get_flow_reservation(self, reservation_id: str) -> Optional[Dict]:
        """Get a flow reservation"""
        href = f"/p2p/reservations/{reservation_id}"
        return self.resources.get(href)


class FunctionSetManager:
    """Manager for all IEEE 2030.5 function sets"""

    def __init__(self, server):
        self.server = server
        self.function_sets = {
            "drlc": DemandResponseLoadControl(server),
            "csip": CustomerSideInformationProvider(server),
            "pricing": PricingFunctionSet(server),
            "p2p_extensions": P2PExtensions(server)
        }

    def get_function_set(self, name: str) -> Optional[FunctionSetBase]:
        """Get a function set by name"""
        return self.function_sets.get(name)

    def list_function_sets(self) -> List[str]:
        """List all available function sets"""
        return list(self.function_sets.keys())

    def handle_request(self, function_set: str, method: str, path: str, data: Optional[Dict] = None) -> Dict:
        """Handle a request to a function set"""
        fs = self.get_function_set(function_set)
        if not fs:
            return {"error": f"Function set '{function_set}' not found"}

        # Simple routing based on path
        if method == "GET":
            if path.startswith("/list"):
                return {"resources": fs.list_resources()}
            else:
                resource = fs.get_resource(path)
                return resource.to_dict() if resource else {"error": "Resource not found"}

        elif method == "POST":
            if isinstance(fs, DemandResponseLoadControl) and "/events" in path:
                href = fs.create_demand_response_event(data or {})
                return {"href": href, "status": "created"}
            elif isinstance(fs, CustomerSideInformationProvider) and "/pricing" in path:
                href = fs.publish_pricing_info(data or {})
                return {"href": href, "status": "published"}
            elif isinstance(fs, P2PExtensions) and "/trades" in path:
                href = fs.create_trading_offer(data or {})
                return {"href": href, "status": "created"}

        elif method == "PUT":
            if fs.update_resource(path, data or {}):
                return {"status": "updated"}
            else:
                return {"error": "Resource not found"}

        return {"error": "Method not supported"}