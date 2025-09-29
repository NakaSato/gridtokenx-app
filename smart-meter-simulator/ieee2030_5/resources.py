"""
IEEE 2030.5 Resource Models
Smart Energy Profile 2.0 - Resource Definitions
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from enum import Enum


class ResourceType(Enum):
    """IEEE 2030.5 Resource Types"""
    DCAP = "dcap"  # Device Capability
    EDEV = "edev"  # End Device
    MUP = "mup"   # Mirror Usage Point
    DRLC = "drlc" # Demand Response Load Control
    CSIP = "csip" # Customer Side Information Provider
    PRICING = "pricing" # Pricing


class FunctionSet(Enum):
    """IEEE 2030.5 Function Sets"""
    DRLC = "drlc"
    CSIP = "csip"
    PRICING = "pricing"
    P2P_EXTENSIONS = "p2p_extensions"


@dataclass
class IEEE2030Resource:
    """Base class for all IEEE 2030.5 resources"""
    href: str
    resource_type: ResourceType
    created_date_time: Optional[datetime] = None
    modification_date_time: Optional[datetime] = None
    version: int = 0

    def __post_init__(self):
        if self.created_date_time is None:
            self.created_date_time = datetime.now(timezone.utc)
        if self.modification_date_time is None:
            self.modification_date_time = datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        """Convert resource to dictionary for XML/JSON serialization"""
        data = {
            "href": self.href,
            "version": self.version,
        }
        if self.created_date_time:
            data["createdDateTime"] = self.created_date_time.isoformat()
        if self.modification_date_time:
            data["modificationDateTime"] = self.modification_date_time.isoformat()
        return data


@dataclass
class DeviceCapability(IEEE2030Resource):
    """Device Capability (dcap) Resource"""
    poll_rate: int = 900  # seconds
    device_category: str = "smart_meter"
    supported_function_sets: List[FunctionSet] = field(default_factory=lambda: [
        FunctionSet.DRLC, FunctionSet.CSIP, FunctionSet.PRICING
    ])

    def __post_init__(self):
        super().__post_init__()
        self.resource_type = ResourceType.DCAP

    def to_dict(self) -> Dict[str, Any]:
        data = super().to_dict()
        data.update({
            "pollRate": self.poll_rate,
            "deviceCategory": self.device_category,
            "supportedFunctionSets": [fs.value for fs in self.supported_function_sets]
        })
        return data


@dataclass
class EndDevice(IEEE2030Resource):
    """End Device (edev) Resource"""
    device_category: str = "smart_meter"
    lfdi: str = ""  # Long Form Device Identifier
    sfdi: str = ""  # Short Form Device Identifier
    enabled: bool = True
    configuration_link: Optional[str] = None
    der_link: Optional[str] = None  # Distributed Energy Resource link
    device_information_link: Optional[str] = None
    device_status_link: Optional[str] = None
    file_status_link: Optional[str] = None
    ip_interface_list_link: Optional[str] = None
    load_shed_device_category: Optional[str] = None
    log_event_list_link: Optional[str] = None
    power_status_link: Optional[str] = None
    registration_link: Optional[str] = None

    def __post_init__(self):
        super().__post_init__()
        self.resource_type = ResourceType.EDEV
        if not self.sfdi and self.lfdi:
            # Generate SFDI from LFDI (simplified)
            self.sfdi = self.lfdi[-8:] if len(self.lfdi) >= 8 else self.lfdi

    def to_dict(self) -> Dict[str, Any]:
        data = super().to_dict()
        data.update({
            "deviceCategory": self.device_category,
            "lfdi": self.lfdi,
            "sfdi": self.sfdi,
            "enabled": self.enabled,
        })

        # Add optional links
        optional_links = {
            "configurationLink": self.configuration_link,
            "derLink": self.der_link,
            "deviceInformationLink": self.device_information_link,
            "deviceStatusLink": self.device_status_link,
            "fileStatusLink": self.file_status_link,
            "ipInterfaceListLink": self.ip_interface_list_link,
            "loadShedDeviceCategory": self.load_shed_device_category,
            "logEventListLink": self.log_event_list_link,
            "powerStatusLink": self.power_status_link,
            "registrationLink": self.registration_link,
        }

        for key, value in optional_links.items():
            if value is not None:
                data[key] = value

        return data


@dataclass
class MirrorUsagePoint(IEEE2030Resource):
    """Mirror Usage Point (mup) Resource"""
    device_lfdi: str = ""
    mirror_meter_reading: Optional[Dict[str, Any]] = None
    role_flags: int = 0  # Bit flags for device roles

    def __post_init__(self):
        super().__post_init__()
        self.resource_type = ResourceType.MUP

    def to_dict(self) -> Dict[str, Any]:
        data = super().to_dict()
        data.update({
            "deviceLFDI": self.device_lfdi,
            "roleFlags": self.role_flags,
        })
        if self.mirror_meter_reading:
            data["MirrorMeterReading"] = self.mirror_meter_reading
        return data


@dataclass
class MeterReading:
    """Meter Reading data structure"""
    reading_type: str = "energy"
    value: float = 0.0
    uom: str = "Wh"  # Unit of Measure
    quality: str = "valid"
    timestamp: Optional[datetime] = None
    phase: Optional[str] = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "readingType": self.reading_type,
            "value": self.value,
            "uom": self.uom,
            "quality": self.quality,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "phase": self.phase,
        }


@dataclass
class DemandResponseEvent:
    """Demand Response Load Control Event"""
    event_id: str
    start_time: datetime
    end_time: datetime
    duration: int  # seconds
    duty_cycle: float = 1.0  # 0.0 to 1.0
    load_adjustment_percentage: float = 0.0  # -100.0 to 100.0
    cooling_offset: float = 0.0
    heating_offset: float = 0.0
    critical_peak_pricing: bool = False
    override_duration: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "eventId": self.event_id,
            "startTime": self.start_time.isoformat(),
            "endTime": self.end_time.isoformat(),
            "duration": self.duration,
            "dutyCycle": self.duty_cycle,
            "loadAdjustmentPercentage": self.load_adjustment_percentage,
            "coolingOffset": self.cooling_offset,
            "heatingOffset": self.heating_offset,
            "criticalPeakPricing": self.critical_peak_pricing,
            "overrideDuration": self.override_duration,
        }


@dataclass
class PricingInfo:
    """Pricing Information"""
    price: float = 0.0
    currency: str = "USD"
    price_type: str = "energy"
    tier: Optional[str] = None
    timestamp: Optional[datetime] = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        data = {
            "price": self.price,
            "currency": self.currency,
            "priceType": self.price_type,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
        if self.tier:
            data["tier"] = self.tier
        return data


@dataclass
class P2PTradingInfo:
    """P2P Energy Trading Extension"""
    trading_pair_id: str
    buyer_meter_id: str
    seller_meter_id: str
    energy_amount: float  # kWh
    price_per_kwh: float
    trade_timestamp: Optional[datetime] = None
    status: str = "pending"  # pending, completed, failed

    def __post_init__(self):
        if self.trade_timestamp is None:
            self.trade_timestamp = datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tradingPairId": self.trading_pair_id,
            "buyerMeterId": self.buyer_meter_id,
            "sellerMeterId": self.seller_meter_id,
            "energyAmount": self.energy_amount,
            "pricePerKwh": self.price_per_kwh,
            "tradeTimestamp": self.trade_timestamp.isoformat() if self.trade_timestamp else None,
            "status": self.status,
        }