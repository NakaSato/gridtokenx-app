#!/usr/bin/env python3
"""
IEEE 2030.5 Server Implementation (Minimal for Testing)

This module provides a minimal IEEE 2030.5 Smart Energy Profile 2.0 server
implementation for testing and development purposes. In production, this would
typically be replaced by a full utility-grade IEEE 2030.5 server.

Features:
- RESTful HTTP/HTTPS endpoints
- Device capability advertisement
- Basic resource serving
- Event publishing for DR/DER
- P2P trading coordination
"""

import ssl
import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from aiohttp import web, ClientSession
from aiohttp.web import Application, Request, Response
import xml.etree.ElementTree as ET

from .resources import DeviceCapability, EndDevice, MirrorUsagePoint
from .function_sets import DemandResponseProgram, TariffProfile
from .security import SecurityManager

logger = logging.getLogger(__name__)


class IEEE2030_5_Server:
    """Minimal IEEE 2030.5 Server for GridTokenX"""
    
    def __init__(self, host: str = '0.0.0.0', port: int = 8443,
                 cert_path: Optional[str] = None, key_path: Optional[str] = None,
                 ca_cert_path: Optional[str] = None):
        """
        Initialize IEEE 2030.5 server
        
        Args:
            host: Server bind address
            port: Server port (default 8443 for IEEE 2030.5)
            cert_path: Server certificate path
            key_path: Server private key path
            ca_cert_path: CA certificate for client verification
        """
        self.host = host
        self.port = port
        self.cert_path = cert_path
        self.key_path = key_path
        self.ca_cert_path = ca_cert_path
        
        # Initialize security manager
        self.security_manager = SecurityManager(ca_cert_path)
        
        # Server state
        self.device_capability = self._create_device_capability()
        self.registered_devices: Dict[str, EndDevice] = {}
        self.mirror_usage_points: Dict[str, MirrorUsagePoint] = {}
        self.tariff_profiles: Dict[str, TariffProfile] = {}
        
        # Create web application
        self.app = self._create_app()
        
        # SSL context
        self.ssl_context = None
        if cert_path and key_path:
            self.ssl_context = self._create_ssl_context()
    
    def _create_device_capability(self) -> DeviceCapability:
        """Create device capability resource"""
        base_url = f"https://{self.host}:{self.port}"
        
        return DeviceCapability(
            href="/dcap",
            # Core service links
            time_link="/tm",
            mirror_usage_point_list_link="/mup",
            
            # P2P Trading specific links
            demand_response_program_list_link="/dr",
            der_program_list_link="/derp",
            tariff_profile_list_link="/tp",
            
            # Polling rates (seconds)
            end_device_list_link_polling_rate=900,
            file_status_polling_rate=300,
            load_shed_availability_link_polling_rate=300,
            log_event_list_link_polling_rate=300
        )
    
    def _create_ssl_context(self) -> ssl.SSLContext:
        """Create SSL context for server"""
        context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        
        # Configure for IEEE 2030.5
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        context.maximum_version = ssl.TLSVersion.TLSv1_3
        
        # Load server certificate
        context.load_cert_chain(self.cert_path, self.key_path)
        
        # Require client certificates
        if self.ca_cert_path:
            context.verify_mode = ssl.CERT_REQUIRED
            context.load_verify_locations(self.ca_cert_path)
        else:
            context.verify_mode = ssl.CERT_OPTIONAL
        
        return context
    
    def _create_app(self) -> Application:
        """Create aiohttp web application"""
        app = web.Application()
        
        # IEEE 2030.5 standard endpoints
        app.router.add_get('/dcap', self.get_device_capability)
        app.router.add_get('/tm', self.get_time)
        app.router.add_get('/edev', self.list_end_devices)
        app.router.add_post('/edev', self.register_end_device)
        app.router.add_get('/edev/{device_id}', self.get_end_device)
        app.router.add_get('/mup', self.list_mirror_usage_points)
        app.router.add_post('/mup', self.post_meter_reading)
        app.router.add_get('/dr', self.list_demand_response_programs)
        app.router.add_get('/derp', self.list_der_programs)
        app.router.add_get('/tp', self.list_tariff_profiles)
        
        # P2P Trading extensions
        app.router.add_post('/p2p/trade', self.handle_p2p_trade_request)
        app.router.add_get('/p2p/opportunities', self.get_trading_opportunities)
        
        # Add middleware for authentication
        app.middlewares.append(self.auth_middleware)
        
        return app
    
    async def auth_middleware(self, request: Request, handler):
        """Authentication middleware"""
        # Skip auth for device capability endpoint (discovery)
        if request.path == '/dcap':
            return await handler(request)
        
        # Extract client certificate information
        peercert = request.transport.get_extra_info('peercert')
        if not peercert and self.ssl_context and self.ssl_context.verify_mode == ssl.CERT_REQUIRED:
            return web.Response(status=401, text="Client certificate required")
        
        # Add certificate info to request for handlers
        request['client_cert'] = peercert
        
        return await handler(request)
    
    async def get_device_capability(self, request: Request) -> Response:
        """GET /dcap - Device Capability"""
        xml_response = self._serialize_to_xml(self.device_capability, 'DeviceCapability')
        return web.Response(
            text=xml_response,
            content_type='application/xml',
            headers={'Cache-Control': 'max-age=3600'}  # Cache for 1 hour
        )
    
    async def get_time(self, request: Request) -> Response:
        """GET /tm - Time synchronization"""
        current_time = int(datetime.now(timezone.utc).timestamp())
        
        time_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
        <time xmlns="http://zigbee.org/sep">
            <currentTime>{current_time}</currentTime>
            <dstOffset>0</dstOffset>
            <quality>0</quality>
            <tzOffset>0</tzOffset>
        </time>"""
        
        return web.Response(text=time_xml, content_type='application/xml')
    
    async def list_end_devices(self, request: Request) -> Response:
        """GET /edev - List registered end devices"""
        devices_list = {
            'EndDeviceList': {
                'all': len(self.registered_devices),
                'results': len(self.registered_devices),
                'endDevice': [
                    {
                        'mRID': device.mRID,
                        'sFDI': device.sfdi,
                        'deviceCategory': device.device_category,
                        'href': f"/edev/{device.mRID}"
                    }
                    for device in self.registered_devices.values()
                ]
            }
        }
        
        xml_response = self._serialize_to_xml(devices_list, 'EndDeviceList')
        return web.Response(text=xml_response, content_type='application/xml')
    
    async def register_end_device(self, request: Request) -> Response:
        """POST /edev - Register new end device"""
        try:
            data = await request.json()
            
            device_data = data.get('EndDevice', {})
            device_id = device_data.get('mRID')
            
            if not device_id:
                return web.Response(status=400, text="Missing device mRID")
            
            # Create end device
            end_device = EndDevice(
                mRID=device_id,
                device_category=device_data.get('deviceCategory', 1),
                sfdi=device_data.get('sFDI', hash(device_id) & 0xFFFFFFFF),
                wallet_address=device_data.get('walletAddress'),
                meter_type=device_data.get('meterType', 'Smart_Meter')
            )
            
            self.registered_devices[device_id] = end_device
            
            logger.info(f"Registered device {device_id}")
            
            response_data = {
                'EndDevice': {
                    'mRID': end_device.mRID,
                    'sFDI': end_device.sfdi,
                    'href': f"/edev/{device_id}",
                    'status': 'registered'
                }
            }
            
            return web.json_response(response_data, status=201)
            
        except Exception as e:
            logger.error(f"Device registration failed: {e}")
            return web.Response(status=500, text=f"Registration failed: {e}")
    
    async def get_end_device(self, request: Request) -> Response:
        """GET /edev/{device_id} - Get specific end device"""
        device_id = request.match_info['device_id']
        
        if device_id not in self.registered_devices:
            return web.Response(status=404, text="Device not found")
        
        device = self.registered_devices[device_id]
        xml_response = self._serialize_to_xml(device, 'EndDevice')
        
        return web.Response(text=xml_response, content_type='application/xml')
    
    async def list_mirror_usage_points(self, request: Request) -> Response:
        """GET /mup - List mirror usage points"""
        mup_list = {
            'MirrorUsagePointList': {
                'all': len(self.mirror_usage_points),
                'results': len(self.mirror_usage_points),
                'mirrorUsagePoint': [
                    {
                        'mRID': mup.mRID,
                        'deviceLFDI': mup.device_lFDI,
                        'serviceKind': mup.service_kind,
                        'href': f"/mup/{mup.mRID}"
                    }
                    for mup in self.mirror_usage_points.values()
                ]
            }
        }
        
        xml_response = self._serialize_to_xml(mup_list, 'MirrorUsagePointList')
        return web.Response(text=xml_response, content_type='application/xml')
    
    async def post_meter_reading(self, request: Request) -> Response:
        """POST /mup - Post meter reading"""
        try:
            data = await request.json()
            
            meter_reading = data.get('MeterReading', {})
            meter_id = meter_reading.get('mRID')
            
            if not meter_id:
                return web.Response(status=400, text="Missing meter reading mRID")
            
            # Process meter reading
            logger.info(f"Received meter reading from {meter_id}")
            
            # In a full implementation, this would:
            # 1. Validate the reading
            # 2. Store in database
            # 3. Trigger P2P trading algorithms
            # 4. Update blockchain oracles
            
            return web.json_response({
                'status': 'success',
                'mRID': meter_id,
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
            
        except Exception as e:
            logger.error(f"Failed to process meter reading: {e}")
            return web.Response(status=500, text=f"Processing failed: {e}")
    
    async def list_demand_response_programs(self, request: Request) -> Response:
        """GET /dr - List demand response programs"""
        # Mock DR program for P2P trading
        dr_program = {
            'DemandResponseProgramList': {
                'all': 1,
                'results': 1,
                'demandResponseProgram': [{
                    'mRID': 'p2p_dr_program_001',
                    'description': 'P2P Energy Trading Demand Response',
                    'availableDemandResponse': 10000,  # 10 kW available
                    'href': '/dr/p2p_dr_program_001'
                }]
            }
        }
        
        xml_response = self._serialize_to_xml(dr_program, 'DemandResponseProgramList')
        return web.Response(text=xml_response, content_type='application/xml')
    
    async def list_der_programs(self, request: Request) -> Response:
        """GET /derp - List DER programs"""
        # Mock DER program for P2P trading
        der_program = {
            'DERProgramList': {
                'all': 1,
                'results': 1,
                'dERProgram': [{
                    'mRID': 'p2p_der_program_001',
                    'description': 'P2P Distributed Energy Resources',
                    'renewableGenerationEnabled': True,
                    'maxExportPower': 15000,  # 15 kW max export
                    'href': '/derp/p2p_der_program_001'
                }]
            }
        }
        
        xml_response = self._serialize_to_xml(der_program, 'DERProgramList')
        return web.Response(text=xml_response, content_type='application/xml')
    
    async def list_tariff_profiles(self, request: Request) -> Response:
        """GET /tp - List tariff profiles"""
        # Mock tariff profile for P2P pricing
        tariff_profile = {
            'TariffProfileList': {
                'all': 1,
                'results': 1,
                'tariffProfile': [{
                    'mRID': 'p2p_tariff_001',
                    'description': 'P2P Dynamic Pricing',
                    'currency': 840,  # USD
                    'serviceCategoryKind': 0,  # Electricity
                    'basePeerRate': 200,  # 20.0 cents per kWh
                    'peakPeerRate': 300,  # 30.0 cents per kWh
                    'offPeakPeerRate': 150,  # 15.0 cents per kWh
                    'href': '/tp/p2p_tariff_001'
                }]
            }
        }
        
        xml_response = self._serialize_to_xml(tariff_profile, 'TariffProfileList')
        return web.Response(text=xml_response, content_type='application/xml')
    
    async def handle_p2p_trade_request(self, request: Request) -> Response:
        """POST /p2p/trade - Handle P2P trade request"""
        try:
            trade_data = await request.json()
            
            source_meter = trade_data.get('source_meter_id')
            dest_meter = trade_data.get('dest_meter_id')
            energy_amount = trade_data.get('energy_wh', 0)
            price_per_kwh = trade_data.get('price_per_kwh', 0)
            
            # Validate trade request
            if not source_meter or not dest_meter:
                return web.Response(status=400, text="Missing meter IDs")
            
            if energy_amount <= 0 or price_per_kwh <= 0:
                return web.Response(status=400, text="Invalid energy amount or price")
            
            # Process P2P trade (simplified)
            trade_id = f"trade_{int(datetime.now(timezone.utc).timestamp())}"
            
            logger.info(f"P2P Trade: {source_meter} -> {dest_meter}, "
                       f"{energy_amount} Wh @ ${price_per_kwh/100:.3f}/kWh")
            
            return web.json_response({
                'trade_id': trade_id,
                'status': 'accepted',
                'source_meter': source_meter,
                'dest_meter': dest_meter,
                'energy_wh': energy_amount,
                'price_per_kwh': price_per_kwh,
                'total_cost_cents': int(energy_amount * price_per_kwh / 1000),
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
            
        except Exception as e:
            logger.error(f"P2P trade processing failed: {e}")
            return web.Response(status=500, text=f"Trade processing failed: {e}")
    
    async def get_trading_opportunities(self, request: Request) -> Response:
        """GET /p2p/opportunities - Get current trading opportunities"""
        # Mock trading opportunities
        opportunities = {
            'trading_opportunities': [
                {
                    'seller_meter_id': 'AMI_METER_001',
                    'energy_available_wh': 5000,
                    'price_per_kwh_cents': 180,
                    'valid_until': (datetime.now(timezone.utc)).isoformat(),
                    'location': 'Building_A_Floor_1'
                },
                {
                    'buyer_meter_id': 'AMI_METER_002', 
                    'energy_needed_wh': 3000,
                    'max_price_per_kwh_cents': 220,
                    'needed_by': (datetime.now(timezone.utc)).isoformat(),
                    'location': 'Building_A_Floor_2'
                }
            ],
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'total_opportunities': 2
        }
        
        return web.json_response(opportunities)
    
    def _serialize_to_xml(self, data: Any, root_element: str) -> str:
        """Serialize data to IEEE 2030.5 XML format"""
        # Simplified XML serialization
        # In production, this would use proper IEEE 2030.5 XML schema
        
        root = ET.Element(root_element)
        root.set('xmlns', 'http://zigbee.org/sep')
        
        if hasattr(data, '__dict__'):
            # Serialize dataclass or object
            for key, value in data.__dict__.items():
                if value is not None and not key.startswith('_'):
                    elem = ET.SubElement(root, key)
                    elem.text = str(value)
        elif isinstance(data, dict):
            # Serialize dictionary
            self._dict_to_xml(data, root)
        
        return ET.tostring(root, encoding='unicode')
    
    def _dict_to_xml(self, data: dict, parent: ET.Element):
        """Convert dictionary to XML elements"""
        for key, value in data.items():
            if isinstance(value, dict):
                child = ET.SubElement(parent, key)
                self._dict_to_xml(value, child)
            elif isinstance(value, list):
                for item in value:
                    child = ET.SubElement(parent, key)
                    if isinstance(item, dict):
                        self._dict_to_xml(item, child)
                    else:
                        child.text = str(item)
            else:
                child = ET.SubElement(parent, key)
                child.text = str(value)
    
    async def start(self):
        """Start the IEEE 2030.5 server"""
        try:
            runner = web.AppRunner(self.app)
            await runner.setup()
            
            site = web.TCPSite(
                runner, 
                self.host, 
                self.port,
                ssl_context=self.ssl_context
            )
            
            await site.start()
            
            protocol = 'https' if self.ssl_context else 'http'
            logger.info(f"IEEE 2030.5 server started on {protocol}://{self.host}:{self.port}")
            
            # Keep server running
            while True:
                await asyncio.sleep(1)
                
        except Exception as e:
            logger.error(f"Failed to start IEEE 2030.5 server: {e}")
            raise
    
    async def stop(self):
        """Stop the IEEE 2030.5 server"""
        # In a full implementation, this would gracefully shutdown the server
        logger.info("IEEE 2030.5 server stopped")