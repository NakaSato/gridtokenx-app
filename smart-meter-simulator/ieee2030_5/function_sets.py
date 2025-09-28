#!/usr/bin/env python3
"""
IEEE 2030.5 Function Sets

This module implements the IEEE 2030.5 Function Sets that define standardized
capabilities and behaviors for smart grid devices.

Function Sets implemented:
- Common Smart Inverter Profile (CSIP)
- Demand Response and Load Control (DRLC) 
- Pricing and Billing
- Metering and Usage
- Time Synchronization
- Device Information and Control
- Flow Reservation for P2P Trading
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, Any, Union
from datetime import datetime, timezone, timedelta
from enum import IntEnum
import logging

from .resources import (
    IdentifiedObject, Resource, UInt48, Reading,
    PowerOfTenMultiplierType, UomType, QualityFlagsType
)

logger = logging.getLogger(__name__)


class EventStatusType(IntEnum):
    """IEEE 2030.5 Event Status Types"""
    SCHEDULED = 0
    ACTIVE = 1
    CANCELLED = 2
    CANCELLED_WITH_RANDOMIZATION = 3
    SUPERSEDED = 4


class DRLCResponseType(IntEnum):
    """Demand Response Load Control Response Types"""
    EVENT_RECEIVED = 0
    EVENT_STARTED = 1
    EVENT_COMPLETED = 2
    EVENT_OPTED_OUT = 3
    EVENT_OPTED_IN = 4
    EVENT_CANCELLED = 5
    EVENT_SUPERSEDED = 6
    EVENT_PARTIAL_OPT_OUT = 7


class PowerSourceType(IntEnum):
    """Power Source Types for DER"""
    UNKNOWN = 0
    MAIN = 1
    BACKUP = 2
    EMERGENCY = 3
    SOLAR = 4
    WIND = 5
    HYDRO = 6
    THERMAL = 7
    BATTERY = 8


@dataclass
class DateTimeInterval:
    """IEEE 2030.5 Date Time Interval"""
    duration: int  # seconds
    start: int  # IEEE 2030.5 time format
    
    @classmethod
    def from_datetime_range(cls, start_dt: datetime, end_dt: datetime) -> 'DateTimeInterval':
        """Create from datetime range"""
        duration = int((end_dt - start_dt).total_seconds())
        start_time = int(start_dt.timestamp())
        return cls(duration=duration, start=start_time)


@dataclass
class Event(IdentifiedObject):
    """Base IEEE 2030.5 Event"""
    creation_time: int = field(default_factory=lambda: int(datetime.now(timezone.utc).timestamp()))
    event_status: int = EventStatusType.SCHEDULED
    interval: Optional[DateTimeInterval] = None
    
    def is_active(self) -> bool:
        """Check if event is currently active"""
        if not self.interval:
            return False
        now = int(datetime.now(timezone.utc).timestamp())
        return (self.interval.start <= now <= 
                (self.interval.start + self.interval.duration))


@dataclass
class DemandResponseProgram(IdentifiedObject):
    """IEEE 2030.5 Demand Response Program"""
    primacy: int = 0  # 0 = highest priority
    available_demand_response: Optional[int] = None  # Watts available
    current_demand_response: Optional[int] = None   # Watts currently shed
    
    # P2P Trading extensions
    p2p_enabled: bool = True
    surplus_sharing_enabled: bool = True
    dynamic_pricing_enabled: bool = True
    load_shifting_capability: Optional[int] = None  # Watts


@dataclass
class EndDeviceControl(IdentifiedObject):
    """IEEE 2030.5 End Device Control"""
    app_software: Optional[str] = None
    demand_response_program_link: Optional[str] = None
    der_program_link: Optional[str] = None
    device_category: Optional[int] = None
    enabled: bool = True
    flow_reservation_response_link: Optional[str] = None
    
    # GridTokenX specific controls
    p2p_trading_enabled: bool = True
    battery_management_enabled: bool = True
    surplus_export_enabled: bool = True


@dataclass
class LoadShedAvailability(Resource):
    """IEEE 2030.5 Load Shed Availability"""
    available_demand_response: Optional[int] = None  # Watts
    request_status: Optional[int] = None
    shed_available_duration: Optional[int] = None  # seconds
    shed_contingency_capacity: Optional[int] = None  # Watts
    shed_hour_capacity: Optional[int] = None  # Watts


@dataclass
class DemandResponseControl(Event):
    """IEEE 2030.5 Demand Response Control Event"""
    DR_program_mandatory: bool = False  # True = mandatory, False = voluntary
    override_duration: Optional[int] = None  # seconds
    
    # Load control parameters
    duty_cycle: Optional[int] = None  # percentage 0-100
    offset: Optional[int] = None  # seconds
    set_point: Optional[int] = None  # depends on device type
    target_reduction: Optional[int] = None  # Watts
    
    # P2P specific parameters
    peer_energy_request: Optional[int] = None  # Wh requested from peers
    max_peer_price: Optional[int] = None  # milli-cents per kWh
    preferred_peer_list: list[str] = field(default_factory=list)  # meter IDs


@dataclass
class DERControlBase(IdentifiedObject):
    """Base DER Control"""
    der_control_base: Optional[int] = None
    der_control_limit_base: Optional[int] = None
    op_mod_connect: Optional[bool] = None
    op_mod_energize: Optional[bool] = None
    op_mod_max_lim_w: Optional[int] = None  # Watts
    op_mod_target_w: Optional[int] = None  # Watts
    ramp_tms: Optional[int] = None  # seconds


@dataclass
class DERControl(Event):
    """IEEE 2030.5 DER Control Event for GridTokenX"""
    der_control_base: DERControlBase = field(default_factory=DERControlBase)
    
    # P2P Trading specific DER controls
    export_to_grid_enabled: bool = True
    export_to_peers_enabled: bool = True
    import_from_peers_enabled: bool = True
    battery_charge_from_peers: bool = True
    battery_discharge_to_peers: bool = True
    
    # Pricing controls
    min_export_price: Optional[int] = None  # milli-cents per kWh
    max_import_price: Optional[int] = None  # milli-cents per kWh
    
    # Energy management
    reserve_energy_percentage: int = 20  # % of battery to reserve for self-use


@dataclass
class TariffProfile(IdentifiedObject):
    """IEEE 2030.5 Tariff Profile for P2P pricing"""
    currency: int = 840  # USD
    price_power_of_ten_multiplier: int = PowerOfTenMultiplierType.MILLI
    primacy: int = 0
    rate_component_list_link: Optional[str] = None
    service_kind: int = 0  # Electricity
    
    # P2P dynamic pricing
    base_peer_rate: Optional[int] = None  # milli-cents per kWh
    peak_peer_rate: Optional[int] = None  # milli-cents per kWh
    off_peak_peer_rate: Optional[int] = None  # milli-cents per kWh
    
    # Time-of-use periods
    peak_hours_start: int = 16  # 4 PM
    peak_hours_end: int = 21   # 9 PM  
    off_peak_hours_start: int = 22  # 10 PM
    off_peak_hours_end: int = 6     # 6 AM


@dataclass
class BillingReading(Reading):
    """IEEE 2030.5 Billing Reading with P2P extensions"""
    billing_period: Optional[DateTimeInterval] = None
    
    # P2P specific billing
    peer_energy_sold: Optional[int] = None      # Wh sold to peers
    peer_energy_purchased: Optional[int] = None # Wh purchased from peers
    peer_revenue: Optional[int] = None          # milli-cents earned
    peer_cost: Optional[int] = None             # milli-cents spent
    grid_feed_in_revenue: Optional[int] = None  # milli-cents from grid
    grid_purchase_cost: Optional[int] = None    # milli-cents to grid
    net_billing_amount: Optional[int] = None    # milli-cents (positive = credit)


@dataclass
class UsagePoint(IdentifiedObject):
    """IEEE 2030.5 Usage Point"""
    role_flags: Optional[int] = None
    service_category_kind: int = 0  # Electricity
    status: int = 1  # Active
    device_lFDI: Optional[int] = None
    
    # P2P trading capabilities
    p2p_trading_enabled: bool = True
    can_export_energy: bool = True
    can_import_energy: bool = True
    has_battery_storage: bool = False
    battery_capacity_wh: Optional[int] = None
    solar_capacity_w: Optional[int] = None
    
    # Connection to blockchain
    wallet_address: Optional[str] = None
    oracle_account: Optional[str] = None


@dataclass
class FlowReservationRequest(IdentifiedObject):
    """IEEE 2030.5 Flow Reservation for P2P energy transfers"""
    creation_time: int = field(default_factory=lambda: int(datetime.now(timezone.utc).timestamp()))
    duration_requested: int = 3600  # seconds - default 1 hour
    energy_requested: int = 1000    # Wh - default 1 kWh
    interval_requested: Optional[DateTimeInterval] = None
    power_requested: int = 1000     # Watts - default 1 kW
    request_status: int = 0  # Pending
    
    # P2P specific fields
    source_usage_point_link: Optional[str] = None  # Seller
    dest_usage_point_link: Optional[str] = None    # Buyer
    agreed_price_per_kwh: Optional[int] = None     # milli-cents
    trading_session_id: Optional[str] = None
    blockchain_tx_hash: Optional[str] = None
    
    # Risk management
    collateral_required: Optional[int] = None      # milli-cents
    penalty_for_non_delivery: Optional[int] = None # milli-cents


@dataclass
class FlowReservationResponse(IdentifiedObject):
    """IEEE 2030.5 Flow Reservation Response"""
    creation_time: int = field(default_factory=lambda: int(datetime.now(timezone.utc).timestamp()))
    energy_available: int = 0    # Wh available
    power_available: int = 0     # Watts available  
    subject: str = ""            # Reference to original request
    
    # Response details
    response_status: int = 0  # 0=accepted, 1=rejected, 2=partial
    available_interval: Optional[DateTimeInterval] = None
    price_per_kwh: Optional[int] = None  # milli-cents
    
    # P2P trading response
    counterpart_meter_id: Optional[str] = None
    trading_conditions: Optional[Dict[str, Any]] = None


@dataclass
class TimeConfiguration(Resource):
    """IEEE 2030.5 Time Configuration"""
    dst_end_rule: Optional[bytes] = None
    dst_offset: Optional[int] = None
    dst_start_rule: Optional[bytes] = None
    tz_offset: Optional[int] = None  # seconds from UTC
    
    # Current time (IEEE 2030.5 format)
    current_time: Optional[int] = None
    
    def get_current_time(self) -> int:
        """Get current time in IEEE 2030.5 format"""
        return int(datetime.now(timezone.utc).timestamp())


@dataclass 
class PowerStatus(Resource):
    """IEEE 2030.5 Power Status"""
    current_power_source: int = PowerSourceType.MAIN
    estimate_of_energy_remaining: Optional[int] = None  # Wh
    estimate_of_time_remaining: Optional[int] = None    # seconds
    
    # Battery status for P2P
    battery_level_percent: Optional[int] = None
    is_charging: Optional[bool] = None
    is_discharging: Optional[bool] = None
    charge_rate_w: Optional[int] = None
    discharge_rate_w: Optional[int] = None
    
    # Generation status
    solar_generation_w: Optional[int] = None
    total_generation_w: Optional[int] = None
    current_consumption_w: Optional[int] = None
    net_power_w: Optional[int] = None  # positive = surplus, negative = deficit


class FunctionSetManager:
    """Manages IEEE 2030.5 Function Set implementations"""
    
    def __init__(self):
        self.active_dr_events: Dict[str, DemandResponseControl] = {}
        self.active_der_controls: Dict[str, DERControl] = {}
        self.flow_reservations: Dict[str, FlowReservationRequest] = {}
        self.tariff_profiles: Dict[str, TariffProfile] = {}
    
    def process_demand_response_event(self, event: DemandResponseControl) -> bool:
        """Process incoming demand response event"""
        try:
            if not event.mRID:
                return False
                
            if event.is_active():
                self.active_dr_events[event.mRID] = event
                logger.info(f"Activated DR event {event.mRID}")
                
                # If this is a P2P energy request, handle specially
                if event.peer_energy_request:
                    return self._handle_p2p_energy_request(event)
                
                return True
            else:
                # Remove expired events
                if event.mRID in self.active_dr_events:
                    del self.active_dr_events[event.mRID]
                return False
                
        except Exception as e:
            logger.error(f"Failed to process DR event {event.mRID}: {e}")
            return False
    
    def _handle_p2p_energy_request(self, event: DemandResponseControl) -> bool:
        """Handle P2P energy request from DR event"""
        try:
            if not event.mRID or not event.interval or not event.peer_energy_request:
                return False
                
            # Create flow reservation for P2P energy transfer
            flow_request = FlowReservationRequest(
                mRID=f"flow_{event.mRID}",
                creation_time=int(datetime.now(timezone.utc).timestamp()),
                duration_requested=event.interval.duration,
                energy_requested=event.peer_energy_request,
                interval_requested=event.interval,
                power_requested=int(event.peer_energy_request / (event.interval.duration / 3600)),
                trading_session_id=event.mRID
            )
            
            if flow_request.mRID:
                self.flow_reservations[flow_request.mRID] = flow_request
                logger.info(f"Created P2P flow reservation {flow_request.mRID}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to handle P2P energy request: {e}")
            return False
    
    def process_der_control(self, control: DERControl) -> bool:
        """Process DER control event"""
        try:
            if not control.mRID:
                return False
                
            if control.is_active():
                self.active_der_controls[control.mRID] = control
                logger.info(f"Activated DER control {control.mRID}")
                return True
            else:
                if control.mRID in self.active_der_controls:
                    del self.active_der_controls[control.mRID]
                return False
                
        except Exception as e:
            logger.error(f"Failed to process DER control {control.mRID}: {e}")
            return False
    
    def get_current_power_limits(self) -> Dict[str, Optional[int]]:
        """Get current power limits from active DER controls"""
        limits: Dict[str, Optional[int]] = {
            'max_export_w': None,
            'max_import_w': None,
            'target_w': None
        }
        
        for control in self.active_der_controls.values():
            if control.der_control_base.op_mod_max_lim_w is not None:
                if limits['max_export_w'] is None:
                    limits['max_export_w'] = control.der_control_base.op_mod_max_lim_w
                else:
                    current_limit = limits['max_export_w']
                    if current_limit is not None:
                        limits['max_export_w'] = min(current_limit, 
                                                   control.der_control_base.op_mod_max_lim_w)
            
            if control.der_control_base.op_mod_target_w is not None:
                limits['target_w'] = control.der_control_base.op_mod_target_w
        
        return limits
    
    def calculate_p2p_pricing(self, current_hour: int) -> Dict[str, int]:
        """Calculate current P2P pricing based on time-of-use"""
        if not self.tariff_profiles:
            return {'current_rate': 250}  # 25.0 cents per kWh default
        
        # Use first tariff profile (in production, select by priority)
        tariff = next(iter(self.tariff_profiles.values()))
        
        if tariff.peak_hours_start <= current_hour <= tariff.peak_hours_end:
            rate = tariff.peak_peer_rate or 300  # 30 cents
        elif (tariff.off_peak_hours_start <= current_hour or 
              current_hour <= tariff.off_peak_hours_end):
            rate = tariff.off_peak_peer_rate or 150  # 15 cents
        else:
            rate = tariff.base_peer_rate or 200  # 20 cents
        
        return {
            'current_rate': rate,
            'peak_rate': tariff.peak_peer_rate or 300,
            'off_peak_rate': tariff.off_peak_peer_rate or 150,
            'base_rate': tariff.base_peer_rate or 200
        }