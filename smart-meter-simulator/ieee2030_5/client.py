#!/usr/bin/env python3
"""
IEEE 2030.5 Client Implementation

This module implements an IEEE 2030.5 Smart Energy Profile 2.0 client that
communicates with IEEE 2030.5 compliant servers using RESTful HTTP/HTTPS
with TLS client certificate authentication.

Features:
- RESTful HTTP/HTTPS communication with TLS 1.2+
- X.509 client certificate authentication  
- Device capability discovery
- Resource polling and subscription
- Event handling for DR, DER, and P2P trading
- Automatic certificate validation
- Error handling and retry logic
"""

import ssl
import json
import time
import asyncio
import aiohttp
import logging
from typing import Optional, Dict, Any, Union, Callable
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse
import xml.etree.ElementTree as ET

from .resources import (
    DeviceCapability, EndDevice, MirrorUsagePoint, 
    MeterReading, PowerStatus, TariffProfile
)
from .function_sets import (
    DemandResponseControl, DERControl, FlowReservationRequest,
    FunctionSetManager
)
from .security import SecurityManager

logger = logging.getLogger(__name__)


class IEEE2030_5_Client:
    """IEEE 2030.5 Smart Energy Profile Client"""
    
    def __init__(self, 
                 server_url: str,
                 client_cert_path: str,
                 client_key_path: str,
                 ca_cert_path: Optional[str] = None,
                 device_id: Optional[str] = None):
        """
        Initialize IEEE 2030.5 client
        
        Args:
            server_url: Base URL of IEEE 2030.5 server
            client_cert_path: Path to client certificate
            client_key_path: Path to client private key
            ca_cert_path: Path to CA certificate for server verification
            device_id: Device identifier
        """
        self.server_url = server_url.rstrip('/')
        self.client_cert_path = client_cert_path
        self.client_key_path = client_key_path
        self.ca_cert_path = ca_cert_path
        self.device_id = device_id
        
        # Initialize security manager
        self.security_manager = SecurityManager(ca_cert_path)
        
        # Initialize function set manager
        self.function_manager = FunctionSetManager()
        
        # Device capabilities and configuration
        self.device_capability: Optional[DeviceCapability] = None
        self.end_device: Optional[EndDevice] = None
        self.polling_intervals: Dict[str, int] = {}
        
        # Event handlers
        self.event_handlers: Dict[str, Callable] = {}
        
        # HTTP session
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Polling tasks
        self.polling_tasks: Dict[str, asyncio.Task] = {}
        self.running = False
    
    async def start(self):
        """Start the IEEE 2030.5 client"""
        try:
            # Create TLS context
            ssl_context = self._create_ssl_context()
            
            # Create HTTP session with client certificate
            connector = aiohttp.TCPConnector(ssl=ssl_context)
            self.session = aiohttp.ClientSession(
                connector=connector,
                timeout=aiohttp.ClientTimeout(total=30)
            )
            
            # Discover device capabilities
            await self.discover_device_capabilities()
            
            # Register device if needed
            if self.device_id:
                await self.register_device()
            
            # Start polling tasks
            await self.start_polling()
            
            self.running = True
            logger.info("IEEE 2030.5 client started successfully")
            
        except Exception as e:
            logger.error(f"Failed to start IEEE 2030.5 client: {e}")
            await self.stop()
            raise
    
    async def stop(self):
        """Stop the IEEE 2030.5 client"""
        self.running = False
        
        # Cancel polling tasks
        for task in self.polling_tasks.values():
            task.cancel()
        
        # Wait for tasks to complete
        if self.polling_tasks:
            await asyncio.gather(*self.polling_tasks.values(), return_exceptions=True)
        
        # Close HTTP session
        if self.session:
            await self.session.close()
        
        logger.info("IEEE 2030.5 client stopped")
    
    def _create_ssl_context(self) -> ssl.SSLContext:
        """Create SSL context for IEEE 2030.5 communication"""
        context = ssl.create_default_context()
        
        # Configure for IEEE 2030.5 requirements
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        context.maximum_version = ssl.TLSVersion.TLSv1_3
        
        # Load client certificate
        context.load_cert_chain(self.client_cert_path, self.client_key_path)
        
        # Load CA certificate if provided
        if self.ca_cert_path:
            context.load_verify_locations(self.ca_cert_path)
        
        # Configure cipher suites (IEEE 2030.5 recommended)
        context.set_ciphers('ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS')
        
        return context
    
    async def discover_device_capabilities(self) -> DeviceCapability:
        """Discover device capabilities from server"""
        try:
            url = urljoin(self.server_url, '/dcap')
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    # Parse XML response
                    xml_data = await response.text()
                    root = ET.fromstring(xml_data)
                    
                    # Extract device capability information
                    self.device_capability = self._parse_device_capability(root)
                    
                    # Extract polling intervals
                    self._extract_polling_intervals()
                    
                    logger.info("Device capabilities discovered successfully")
                    return self.device_capability
                else:
                    raise Exception(f"Failed to get device capabilities: {response.status}")
                    
        except Exception as e:
            logger.error(f"Device capability discovery failed: {e}")
            raise
    
    def _parse_device_capability(self, xml_root: ET.Element) -> DeviceCapability:
        """Parse device capability from XML"""
        dc = DeviceCapability()
        
        # Extract service links
        for child in xml_root:
            if child.tag.endswith('Link'):
                href = child.get('href')
                if href:
                    setattr(dc, child.tag.lower().replace('link', '_link'), href)
        
        return dc
    
    def _extract_polling_intervals(self):
        """Extract polling intervals from device capability"""
        if not self.device_capability:
            return
        
        # Default polling intervals (seconds)
        default_intervals = {
            'end_device_list': 900,     # 15 minutes
            'file_status': 300,         # 5 minutes
            'ip_interface_list': 900,   # 15 minutes
            'load_shed_availability': 300,  # 5 minutes
            'log_event_list': 300,      # 5 minutes
        }
        
        # Use server-provided intervals if available
        for resource, default_interval in default_intervals.items():
            polling_attr = f"{resource}_polling_rate"
            server_interval = getattr(self.device_capability, polling_attr, None)
            self.polling_intervals[resource] = server_interval or default_interval
    
    async def register_device(self) -> bool:
        """Register device with server"""
        try:
            if not self.device_id:
                logger.warning("No device ID provided for registration")
                return False
            
            # Get device information
            device_info = {
                'device_id': self.device_id,
                'device_category': 1,  # Smart meter
                'manufacturer': 'GridTokenX',
                'model': 'AMI-P2P-1000',
                'version': '1.0.0'
            }
            
            # Create registration payload
            registration_data = {
                'EndDevice': {
                    'mRID': self.device_id,
                    'deviceCategory': device_info['device_category'],
                    'sFDI': hash(self.device_id) & 0xFFFFFFFF,
                    'deviceInformation': device_info
                }
            }
            
            url = urljoin(self.server_url, '/edev')
            
            async with self.session.post(url, json=registration_data) as response:
                if response.status in [200, 201]:
                    response_data = await response.json()
                    logger.info(f"Device {self.device_id} registered successfully")
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"Device registration failed: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Device registration error: {e}")
            return False
    
    async def start_polling(self):
        """Start polling tasks for various resources"""
        if not self.device_capability:
            logger.warning("No device capabilities available for polling")
            return
        
        # Start polling tasks for available resources
        polling_resources = [
            ('mirror_usage_point_list', self._poll_mirror_usage_points),
            ('demand_response_program_list', self._poll_demand_response),
            ('der_program_list', self._poll_der_programs),
            ('tariff_profile_list', self._poll_tariff_profiles),
            ('time', self._poll_time)
        ]
        
        for resource_name, poll_func in polling_resources:
            link_attr = f"{resource_name}_link"
            resource_link = getattr(self.device_capability, link_attr, None)
            
            if resource_link:
                interval = self.polling_intervals.get(resource_name, 300)
                task = asyncio.create_task(
                    self._polling_loop(resource_name, resource_link, poll_func, interval)
                )
                self.polling_tasks[resource_name] = task
                logger.info(f"Started polling {resource_name} every {interval} seconds")
    
    async def _polling_loop(self, resource_name: str, resource_url: str, 
                           poll_func: Callable, interval: int):
        """Generic polling loop for resources"""
        while self.running:
            try:
                await poll_func(resource_url)
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Polling error for {resource_name}: {e}")
                await asyncio.sleep(min(interval, 60))  # Retry with backoff
    
    async def _poll_mirror_usage_points(self, url: str):
        """Poll mirror usage points for P2P trading data"""
        try:
            full_url = urljoin(self.server_url, url)
            
            async with self.session.get(full_url) as response:
                if response.status == 200:
                    xml_data = await response.text()
                    # Parse and process mirror usage points
                    await self._process_mirror_usage_points(xml_data)
                    
        except Exception as e:
            logger.error(f"Mirror usage point polling failed: {e}")
    
    async def _poll_demand_response(self, url: str):
        """Poll demand response programs and events"""
        try:
            full_url = urljoin(self.server_url, url)
            
            async with self.session.get(full_url) as response:
                if response.status == 200:
                    xml_data = await response.text()
                    # Parse and process DR events
                    await self._process_demand_response_events(xml_data)
                    
        except Exception as e:
            logger.error(f"Demand response polling failed: {e}")
    
    async def _poll_der_programs(self, url: str):
        """Poll DER programs and controls"""
        try:
            full_url = urljoin(self.server_url, url)
            
            async with self.session.get(full_url) as response:
                if response.status == 200:
                    xml_data = await response.text()
                    # Parse and process DER controls
                    await self._process_der_controls(xml_data)
                    
        except Exception as e:
            logger.error(f"DER program polling failed: {e}")
    
    async def _poll_tariff_profiles(self, url: str):
        """Poll tariff profiles for P2P pricing"""
        try:
            full_url = urljoin(self.server_url, url)
            
            async with self.session.get(full_url) as response:
                if response.status == 200:
                    xml_data = await response.text()
                    # Parse and process tariff profiles
                    await self._process_tariff_profiles(xml_data)
                    
        except Exception as e:
            logger.error(f"Tariff profile polling failed: {e}")
    
    async def _poll_time(self, url: str):
        """Poll time synchronization"""
        try:
            full_url = urljoin(self.server_url, url)
            
            async with self.session.get(full_url) as response:
                if response.status == 200:
                    xml_data = await response.text()
                    # Process time synchronization
                    await self._process_time_sync(xml_data)
                    
        except Exception as e:
            logger.error(f"Time synchronization polling failed: {e}")
    
    async def _process_mirror_usage_points(self, xml_data: str):
        """Process mirror usage point data for P2P trading"""
        try:
            root = ET.fromstring(xml_data)
            
            # Extract P2P trading opportunities
            for mup_elem in root.findall('.//MirrorUsagePoint'):
                # Process P2P trading data
                trading_data = self._extract_trading_data(mup_elem)
                
                if trading_data and 'on_trading_opportunity' in self.event_handlers:
                    await self.event_handlers['on_trading_opportunity'](trading_data)
                    
        except Exception as e:
            logger.error(f"Failed to process mirror usage points: {e}")
    
    async def _process_demand_response_events(self, xml_data: str):
        """Process demand response events"""
        try:
            root = ET.fromstring(xml_data)
            
            for dr_elem in root.findall('.//DemandResponseControl'):
                # Parse DR event
                dr_event = self._parse_dr_event(dr_elem)
                
                if dr_event:
                    # Process with function set manager
                    success = self.function_manager.process_demand_response_event(dr_event)
                    
                    if success and 'on_demand_response' in self.event_handlers:
                        await self.event_handlers['on_demand_response'](dr_event)
                        
        except Exception as e:
            logger.error(f"Failed to process demand response events: {e}")
    
    async def _process_der_controls(self, xml_data: str):
        """Process DER control events"""
        try:
            root = ET.fromstring(xml_data)
            
            for der_elem in root.findall('.//DERControl'):
                # Parse DER control
                der_control = self._parse_der_control(der_elem)
                
                if der_control:
                    # Process with function set manager
                    success = self.function_manager.process_der_control(der_control)
                    
                    if success and 'on_der_control' in self.event_handlers:
                        await self.event_handlers['on_der_control'](der_control)
                        
        except Exception as e:
            logger.error(f"Failed to process DER controls: {e}")
    
    async def _process_tariff_profiles(self, xml_data: str):
        """Process tariff profiles for dynamic pricing"""
        try:
            root = ET.fromstring(xml_data)
            
            for tariff_elem in root.findall('.//TariffProfile'):
                # Parse tariff profile
                tariff = self._parse_tariff_profile(tariff_elem)
                
                if tariff and tariff.mRID:
                    self.function_manager.tariff_profiles[tariff.mRID] = tariff
                    
                    if 'on_tariff_update' in self.event_handlers:
                        await self.event_handlers['on_tariff_update'](tariff)
                        
        except Exception as e:
            logger.error(f"Failed to process tariff profiles: {e}")
    
    async def _process_time_sync(self, xml_data: str):
        """Process time synchronization"""
        try:
            root = ET.fromstring(xml_data)
            
            current_time_elem = root.find('.//currentTime')
            if current_time_elem is not None:
                server_time = int(current_time_elem.text)
                local_time = int(datetime.now(timezone.utc).timestamp())
                
                time_diff = abs(server_time - local_time)
                
                if time_diff > 5:  # 5 second tolerance
                    logger.warning(f"Time drift detected: {time_diff} seconds")
                    
                    if 'on_time_sync' in self.event_handlers:
                        await self.event_handlers['on_time_sync']({
                            'server_time': server_time,
                            'local_time': local_time,
                            'drift': time_diff
                        })
                        
        except Exception as e:
            logger.error(f"Failed to process time sync: {e}")
    
    def _extract_trading_data(self, mup_element: ET.Element) -> Optional[Dict[str, Any]]:
        """Extract P2P trading data from mirror usage point"""
        try:
            trading_data = {}
            
            # Extract basic usage point data
            mrid_elem = mup_element.find('mRID')
            if mrid_elem is not None:
                trading_data['meter_id'] = mrid_elem.text
            
            # Extract P2P specific data (would be in extensions)
            # This is a simplified example - actual implementation would
            # parse GridTokenX-specific extensions
            
            return trading_data if trading_data else None
            
        except Exception as e:
            logger.error(f"Failed to extract trading data: {e}")
            return None
    
    def _parse_dr_event(self, dr_element: ET.Element) -> Optional[DemandResponseControl]:
        """Parse demand response event from XML"""
        # Simplified parsing - full implementation would parse all fields
        try:
            mrid_elem = dr_element.find('mRID')
            if mrid_elem is None:
                return None
                
            return DemandResponseControl(
                mRID=mrid_elem.text,
                creation_time=int(datetime.now(timezone.utc).timestamp()),
                event_status=0
            )
            
        except Exception as e:
            logger.error(f"Failed to parse DR event: {e}")
            return None
    
    def _parse_der_control(self, der_element: ET.Element) -> Optional[DERControl]:
        """Parse DER control from XML"""
        # Simplified parsing - full implementation would parse all fields
        try:
            mrid_elem = der_element.find('mRID')
            if mrid_elem is None:
                return None
                
            return DERControl(
                mRID=mrid_elem.text,
                creation_time=int(datetime.now(timezone.utc).timestamp()),
                event_status=0
            )
            
        except Exception as e:
            logger.error(f"Failed to parse DER control: {e}")
            return None
    
    def _parse_tariff_profile(self, tariff_element: ET.Element) -> Optional[TariffProfile]:
        """Parse tariff profile from XML"""
        # Simplified parsing - full implementation would parse all fields
        try:
            mrid_elem = tariff_element.find('mRID')
            if mrid_elem is None:
                return None
                
            return TariffProfile(mRID=mrid_elem.text)
            
        except Exception as e:
            logger.error(f"Failed to parse tariff profile: {e}")
            return None
    
    async def post_meter_reading(self, meter_reading: MeterReading) -> bool:
        """Post meter reading to server"""
        try:
            if not self.device_capability or not self.device_capability.mirror_usage_point_list_link:
                logger.error("No mirror usage point link available")
                return False
            
            url = urljoin(self.server_url, self.device_capability.mirror_usage_point_list_link)
            
            # Convert meter reading to XML/JSON format
            reading_data = self._serialize_meter_reading(meter_reading)
            
            async with self.session.post(url, json=reading_data) as response:
                if response.status in [200, 201]:
                    logger.debug("Meter reading posted successfully")
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"Failed to post meter reading: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Failed to post meter reading: {e}")
            return False
    
    def _serialize_meter_reading(self, meter_reading: MeterReading) -> Dict[str, Any]:
        """Serialize meter reading for transmission"""
        return {
            'MeterReading': {
                'mRID': meter_reading.mRID or f"reading_{int(datetime.now(timezone.utc).timestamp())}",
                'readings': {
                    'energy_generated': meter_reading.energy_generated,
                    'energy_consumed': meter_reading.energy_consumed,
                    'instantaneous_power': meter_reading.instantaneous_power,
                    'voltage': meter_reading.voltage,
                    'current': meter_reading.current,
                    'power_factor': meter_reading.power_factor,
                    'frequency': meter_reading.frequency
                }
            }
        }
    
    def register_event_handler(self, event_type: str, handler: Callable):
        """Register event handler for specific event types"""
        self.event_handlers[event_type] = handler
        logger.info(f"Registered handler for {event_type}")
    
    def get_current_pricing(self) -> Dict[str, int]:
        """Get current P2P pricing information"""
        current_hour = datetime.now().hour
        return self.function_manager.calculate_p2p_pricing(current_hour)
    
    def get_power_limits(self) -> Dict[str, Optional[int]]:
        """Get current power limits from DER controls"""
        return self.function_manager.get_current_power_limits()