#!/usr/bin/env python3
"""
IEEE 2030.5 Resource Models

This module defines the core resource models for IEEE 2030.5 Smart Energy Profile 2.0
including data structures, enumerations, and validation logic.

These resources represent the fundamental building blocks of the IEEE 2030.5 protocol,
enabling standardized communication between smart grid devices and systems.
"""

from dataclasses import dataclass, field
from typing import Optional, Union, Dict, Any
from datetime import datetime, timezone
from enum import Enum, IntEnum
import uuid
import xml.etree.ElementTree as ET
from urllib.parse import urljoin


class ServiceKind(IntEnum):
    """IEEE 2030.5 Service Kinds"""
    ELECTRICITY_SERVICE = 0
    GAS_SERVICE = 1
    WATER_SERVICE = 2
    TIME_SERVICE = 3
    PRESSURE_SERVICE = 4
    HEAT_SERVICE = 5
    COOLING_SERVICE = 6


class RoleFlagsType(IntEnum):
    """IEEE 2030.5 Role Flags for device capabilities"""
    IS_MIRROR = 1
    IS_AGGREGATOR = 2
    IS_SUBMETER = 4
    IS_PEV = 8
    IS_DER = 16
    IS_REVENUE_QUALITY = 32
    IS_DC_MEASUREMENT_UNIT = 64
    IS_PREMISES_AGGREGATION_POINT = 128


class PowerOfTenMultiplierType(IntEnum):
    """Power of ten multiplier for measurements"""
    YOCTO = -24
    ZEPTO = -21
    ATTO = -18
    FEMTO = -15
    PICO = -12
    NANO = -9
    MICRO = -6
    MILLI = -3
    CENTI = -2
    DECI = -1
    NONE = 0
    DEKA = 1
    HECTO = 2
    KILO = 3
    MEGA = 6
    GIGA = 9
    TERA = 12
    PETA = 15
    EXA = 18
    ZETTA = 21
    YOTTA = 24


class UomType(IntEnum):
    """Unit of Measure Types"""
    NOT_APPLICABLE = 0
    AMPERE = 5
    DEGREE_CELSIUS = 23
    CURRENCY = 31
    DEGREE = 9
    WATT_HOUR = 72
    VOLT = 29
    VOLT_AMPERE = 61
    VOLT_AMPERE_REACTIVE = 63
    WATT = 38
    FREQUENCY = 33
    COULOMB = 25
    VOLT_SQUARED_HOUR = 67
    AMPERE_SQUARED_HOUR = 68
    VAR_HOUR = 71
    WATT_HOUR_Q1 = 74
    WATT_HOUR_Q2 = 75
    WATT_HOUR_Q3 = 76
    WATT_HOUR_Q4 = 77


class QualityFlagsType(IntEnum):
    """Data quality flags"""
    VALID = 0x00
    INVALID = 0x01
    QUESTIONABLE = 0x02
    DERIVED = 0x04
    ESTIMATED = 0x08
    USER_DEFINED = 0x10


@dataclass
class Resource:
    """Base IEEE 2030.5 Resource"""
    href: Optional[str] = None
    
    def to_xml(self) -> ET.Element:
        """Convert resource to XML representation"""
        raise NotImplementedError("Subclasses must implement to_xml method")
    
    @classmethod
    def from_xml(cls, element: ET.Element) -> 'Resource':
        """Create resource from XML element"""
        raise NotImplementedError("Subclasses must implement from_xml method")


@dataclass
class IdentifiedObject(Resource):
    """Base class for identified objects with mRID"""
    mRID: Optional[str] = field(default_factory=lambda: str(uuid.uuid4()))
    description: Optional[str] = None
    version: Optional[int] = None


@dataclass
class List(Resource):
    """Base list resource"""
    all: int = 0
    results: int = 0
    
    def __post_init__(self):
        if self.results == 0:
            self.results = self.all


@dataclass
class DeviceCapability(IdentifiedObject):
    """IEEE 2030.5 Device Capability Resource"""
    
    # Service endpoints
    customer_account_list_link: Optional[str] = None
    demand_response_program_list_link: Optional[str] = None
    der_program_list_link: Optional[str] = None
    file_list_link: Optional[str] = None
    messaging_program_list_link: Optional[str] = None
    prepayment_list_link: Optional[str] = None
    response_set_list_link: Optional[str] = None
    tariff_profile_list_link: Optional[str] = None
    time_link: Optional[str] = None
    usage_point_list_link: Optional[str] = None
    mirror_usage_point_list_link: Optional[str] = None
    self_device_link: Optional[str] = None
    
    # Polling rates (seconds)
    end_device_list_link_polling_rate: Optional[int] = 900  # 15 minutes default
    file_status_polling_rate: Optional[int] = 300  # 5 minutes default
    ip_interface_list_link_polling_rate: Optional[int] = 900
    load_shed_availability_link_polling_rate: Optional[int] = 300
    log_event_list_link_polling_rate: Optional[int] = 300
    
    def to_xml(self) -> ET.Element:
        """Convert to XML representation"""
        dc = ET.Element("DeviceCapability")
        if self.href:
            dc.set("href", self.href)
        
        # Add service links
        for attr, value in self.__dict__.items():
            if value is not None and attr.endswith('_link'):
                link_elem = ET.SubElement(dc, attr.replace('_', ''))
                link_elem.set("href", value)
        
        return dc


@dataclass
class EndDevice(IdentifiedObject):
    """IEEE 2030.5 End Device Resource"""
    
    device_category: Optional[int] = None
    device_information_link: Optional[str] = None
    device_status_link: Optional[str] = None
    file_status_link: Optional[str] = None
    ip_interface_list_link: Optional[str] = None
    load_shed_availability_link: Optional[str] = None
    log_event_list_link: Optional[str] = None
    power_status_link: Optional[str] = None
    sfdi: Optional[int] = None  # Short Form Device Identifier
    
    # GridTokenX extensions
    wallet_address: Optional[str] = None
    meter_type: Optional[str] = None
    installation_code: Optional[str] = None
    
    def to_xml(self) -> ET.Element:
        """Convert to XML representation"""
        ed = ET.Element("EndDevice")
        if self.href:
            ed.set("href", self.href)
        
        if self.mRID:
            mrid_elem = ET.SubElement(ed, "mRID")
            mrid_elem.text = self.mRID
        
        if self.sfdi:
            sfdi_elem = ET.SubElement(ed, "sFDI")
            sfdi_elem.text = str(self.sfdi)
        
        return ed


@dataclass
class UInt48:
    """48-bit unsigned integer for timestamps"""
    value: int
    
    @classmethod
    def from_datetime(cls, dt: datetime) -> 'UInt48':
        """Create from datetime (seconds since epoch)"""
        return cls(int(dt.timestamp()))
    
    def to_datetime(self) -> datetime:
        """Convert to datetime"""
        return datetime.fromtimestamp(self.value, tz=timezone.utc)


@dataclass
class Reading:
    """IEEE 2030.5 Reading"""
    consumption_block: Optional[int] = None
    quality_flags: Optional[int] = None
    time_period_start: Optional[int] = None
    time_period_duration: Optional[int] = None
    touTier: Optional[int] = None
    value: Optional[int] = None
    
    def __post_init__(self):
        if self.quality_flags is None:
            self.quality_flags = QualityFlagsType.VALID


@dataclass
class MeterReading(IdentifiedObject):
    """IEEE 2030.5 Meter Reading"""
    reading_set_list_link: Optional[str] = None
    reading_type_link: Optional[str] = None
    
    # GridTokenX specific readings
    energy_generated: Optional[Reading] = None
    energy_consumed: Optional[Reading] = None
    instantaneous_power: Optional[Reading] = None
    voltage: Optional[Reading] = None
    current: Optional[Reading] = None
    power_factor: Optional[Reading] = None
    frequency: Optional[Reading] = None


@dataclass
class MirrorUsagePoint(IdentifiedObject):
    """IEEE 2030.5 Mirror Usage Point for P2P trading"""
    
    device_lFDI: Optional[int] = None  # Long Form Device Identifier
    mirror_meter_reading_list_link: Optional[str] = None
    post_rate: Optional[int] = None
    role_flags: Optional[int] = None
    service_kind: Optional[int] = ServiceKind.ELECTRICITY_SERVICE
    status: Optional[int] = None
    
    # P2P Trading specific
    trading_enabled: bool = True
    surplus_energy_available: Optional[int] = None  # Wh
    energy_price_sell: Optional[int] = None  # cents per kWh
    energy_price_buy: Optional[int] = None  # cents per kWh
    battery_capacity: Optional[int] = None  # Wh
    battery_level: Optional[int] = None  # Percentage
    
    def to_xml(self) -> ET.Element:
        """Convert to XML representation"""
        mup = ET.Element("MirrorUsagePoint")
        if self.href:
            mup.set("href", self.href)
        
        if self.mRID:
            mrid_elem = ET.SubElement(mup, "mRID")
            mrid_elem.text = self.mRID
        
        if self.service_kind is not None:
            sk_elem = ET.SubElement(mup, "serviceKind")
            sk_elem.text = str(self.service_kind)
        
        return mup


@dataclass
class DemandResponseProgram(IdentifiedObject):
    """IEEE 2030.5 Demand Response Program"""
    available_demand_response: Optional[int] = None
    current_demand_response: Optional[int] = None
    
    # P2P specific demand response
    p2p_trading_enabled: bool = True
    dynamic_pricing_enabled: bool = True
    load_shifting_capability: Optional[int] = None  # kW


@dataclass
class TariffProfile(IdentifiedObject):
    """IEEE 2030.5 Tariff Profile for P2P pricing"""
    currency: Optional[int] = 840  # USD currency code
    price_power_of_ten_multiplier: Optional[int] = PowerOfTenMultiplierType.MILLI
    primary_meter_reading_link: Optional[str] = None
    rate_component_list_link: Optional[str] = None
    service_kind: Optional[int] = ServiceKind.ELECTRICITY_SERVICE
    
    # P2P dynamic pricing
    peer_to_peer_rate: Optional[int] = None  # milli-cents per kWh
    grid_feed_in_rate: Optional[int] = None
    grid_purchase_rate: Optional[int] = None


@dataclass
class PowerStatus(Resource):
    """IEEE 2030.5 Power Status"""
    current_power_source: Optional[int] = None
    estimate_of_energy_remaining: Optional[int] = None
    estimate_of_time_remaining: Optional[int] = None
    is_charging: Optional[bool] = None
    is_discharging: Optional[bool] = None
    is_grid_connected: Optional[bool] = None
    
    # Battery management for P2P
    battery_status: Optional[str] = None
    charge_rate_max: Optional[int] = None  # Watts
    discharge_rate_max: Optional[int] = None  # Watts


@dataclass
class DERProgram(IdentifiedObject):
    """IEEE 2030.5 Distributed Energy Resource Program"""
    default_der_control_link: Optional[str] = None
    der_control_list_link: Optional[str] = None
    der_curve_list_link: Optional[str] = None
    primary_meter_reading_link: Optional[str] = None
    
    # GridTokenX DER management
    renewable_generation_enabled: bool = True
    max_export_power: Optional[int] = None  # Watts
    max_import_power: Optional[int] = None  # Watts
    storage_capability: Optional[int] = None  # Wh


@dataclass
class FlowReservationRequest(IdentifiedObject):
    """IEEE 2030.5 Flow Reservation for P2P energy transfers"""
    creation_time: Optional[int] = None
    duration_requested: Optional[int] = None
    energy_requested: Optional[int] = None  # Wh
    interval_requested: Optional[int] = None
    power_requested: Optional[int] = None  # Watts
    request_status: Optional[int] = None
    
    # P2P specific
    source_meter_id: Optional[str] = None
    destination_meter_id: Optional[str] = None
    agreed_price: Optional[int] = None  # milli-cents per kWh
    blockchain_tx_hash: Optional[str] = None


@dataclass
class DeviceInformation(IdentifiedObject):
    """IEEE 2030.5 Device Information"""
    device_category: Optional[int] = None
    gps_location: Optional[str] = None
    lFDI: Optional[int] = None  # Long Form Device Identifier
    mfDate: Optional[int] = None  # Manufacturing date
    mfHwVer: Optional[str] = None  # Hardware version
    mfID: Optional[int] = None  # Manufacturer ID
    mfInfo: Optional[str] = None  # Manufacturer info
    mfModel: Optional[str] = None  # Model
    mfSerNum: Optional[str] = None  # Serial number
    primaryPower: Optional[int] = None
    secondaryPower: Optional[int] = None
    swActTime: Optional[int] = None  # Software activation time
    swVer: Optional[str] = None  # Software version
    
    # GridTokenX extensions
    installation_location: Optional[str] = None
    university_building: Optional[str] = None
    room_number: Optional[str] = None


@dataclass
class DeviceCapabilityList(List):
    """List of Device Capabilities"""
    device_capability: list[DeviceCapability] = field(default_factory=list)


@dataclass
class EndDeviceList(List):
    """List of End Devices"""
    end_device: list[EndDevice] = field(default_factory=list)


@dataclass
class MirrorUsagePointList(List):
    """List of Mirror Usage Points"""
    mirror_usage_point: list[MirrorUsagePoint] = field(default_factory=list)


# Utility functions for IEEE 2030.5 protocol
def generate_sfdi(long_form_id: int) -> int:
    """Generate Short Form Device Identifier from Long Form"""
    return long_form_id & 0xFFFFFFFF


def time_to_uint48(dt: datetime) -> int:
    """Convert datetime to IEEE 2030.5 UInt48 format (seconds since epoch)"""
    return int(dt.timestamp())


def uint48_to_time(value: int) -> datetime:
    """Convert IEEE 2030.5 UInt48 to datetime"""
    return datetime.fromtimestamp(value, tz=timezone.utc)


def create_href(base_url: str, resource_type: str, resource_id: Optional[str] = None) -> str:
    """Create IEEE 2030.5 compliant href"""
    if resource_id:
        return urljoin(base_url, f"{resource_type}/{resource_id}")
    return urljoin(base_url, resource_type)