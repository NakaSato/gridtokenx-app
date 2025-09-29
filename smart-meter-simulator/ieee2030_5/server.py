"""
IEEE 2030.5 Server
Server implementation for IEEE 2030.5 Smart Energy Profile 2.0
"""

import asyncio
import json
import ssl
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from aiohttp import web, WSMsgType
from .resources import (
    DeviceCapability, EndDevice, MirrorUsagePoint,
    MeterReading, ResourceType
)
from .function_sets import FunctionSetManager
from .security import SecurityManager


class IEEE20305Server:
    """IEEE 2030.5 Server implementation"""

    def __init__(self, host: str = "0.0.0.0", port: int = 8443,
                 cert_file: str = "certs/server.crt", key_file: str = "certs/server.key"):
        self.host = host
        self.port = port
        self.cert_file = cert_file
        self.key_file = key_file

        # Core components
        self.security = SecurityManager()
        self.function_sets = FunctionSetManager(self)
        self.resources: Dict[str, Any] = {}

        # Connected clients
        self.clients: Dict[str, Dict] = {}

        # Web application
        self.app = web.Application()
        self.runner = None
        self.site = None

        # Initialize routes
        self._setup_routes()
        self._init_default_resources()

    def _setup_routes(self):
        """Setup HTTP routes for IEEE 2030.5 resources"""
        # Core resources
        self.app.router.add_get("/dcap", self.handle_device_capability)
        self.app.router.add_post("/dcap", self.handle_register_device_capability)

        self.app.router.add_get("/edev", self.handle_list_end_devices)
        self.app.router.add_post("/edev", self.handle_register_end_device)
        self.app.router.add_get("/edev/{device_id}", self.handle_get_end_device)

        self.app.router.add_get("/mup", self.handle_list_mirror_usage_points)
        self.app.router.add_post("/mup", self.handle_register_mirror_usage_point)

        # Function sets
        self.app.router.add_get("/drlc/{path:.*}", self.handle_drlc_request)
        self.app.router.add_post("/drlc/{path:.*}", self.handle_drlc_request)
        self.app.router.add_put("/drlc/{path:.*}", self.handle_drlc_request)

        self.app.router.add_get("/csip/{path:.*}", self.handle_csip_request)
        self.app.router.add_post("/csip/{path:.*}", self.handle_csip_request)
        self.app.router.add_put("/csip/{path:.*}", self.handle_csip_request)

        self.app.router.add_get("/pricing/{path:.*}", self.handle_pricing_request)
        self.app.router.add_post("/pricing/{path:.*}", self.handle_pricing_request)

        self.app.router.add_get("/p2p/{path:.*}", self.handle_p2p_request)
        self.app.router.add_post("/p2p/{path:.*}", self.handle_p2p_request)
        self.app.router.add_put("/p2p/{path:.*}", self.handle_p2p_request)

        # WebSocket for real-time updates
        self.app.router.add_get("/ws", self.handle_websocket)

        # Health check
        self.app.router.add_get("/health", self.handle_health)

    def _init_default_resources(self):
        """Initialize default server resources"""
        # Server device capability
        dcap = DeviceCapability(href="/dcap", resource_type=ResourceType.DCAP)
        self.resources["/dcap"] = dcap

    async def handle_device_capability(self, request):
        """Handle device capability requests"""
        dcap = self.resources.get("/dcap")
        if dcap:
            return web.json_response(dcap.to_dict())
        return web.json_response({"error": "Device capability not found"}, status=404)

    async def handle_register_device_capability(self, request):
        """Handle device capability registration"""
        try:
            data = await request.json()
            dcap = DeviceCapability(
                href=data.get("href", "/dcap"),
                resource_type=ResourceType.DCAP
            )
            self.resources[dcap.href] = dcap
            return web.json_response({"status": "registered", "href": dcap.href})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=400)

    async def handle_list_end_devices(self, request):
        """List all registered end devices"""
        end_devices = []
        for href, resource in self.resources.items():
            if isinstance(resource, EndDevice):
                end_devices.append(resource.to_dict())

        return web.json_response({"endDevices": end_devices})

    async def handle_register_end_device(self, request):
        """Register a new end device"""
        try:
            data = await request.json()
            edev = EndDevice(
                href=data.get("href", f"/edev/{data.get('lfdi', 'unknown')}"),
                resource_type=ResourceType.EDEV
            )
            edev.lfdi = data.get("lfdi", "")
            edev.sfdi = data.get("sfdi", "")
            edev.device_category = data.get("deviceCategory", "smart_meter")
            edev.enabled = data.get("enabled", True)

            self.resources[edev.href] = edev
            self.clients[edev.lfdi] = {"device": edev, "connected_at": datetime.now(timezone.utc)}

            return web.json_response({"status": "registered", "href": edev.href})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=400)

    async def handle_get_end_device(self, request):
        """Get a specific end device"""
        device_id = request.match_info.get("device_id")
        href = f"/edev/{device_id}"

        device = self.resources.get(href)
        if device and isinstance(device, EndDevice):
            return web.json_response(device.to_dict())

        return web.json_response({"error": "End device not found"}, status=404)

    async def handle_list_mirror_usage_points(self, request):
        """List all mirror usage points"""
        mups = []
        for href, resource in self.resources.items():
            if isinstance(resource, MirrorUsagePoint):
                mups.append(resource.to_dict())

        return web.json_response({"mirrorUsagePoints": mups})

    async def handle_register_mirror_usage_point(self, request):
        """Register a new mirror usage point"""
        try:
            data = await request.json()
            mup = MirrorUsagePoint(
                href=data.get("href", f"/mup/{data.get('deviceLFDI', 'unknown')}"),
                resource_type=ResourceType.MUP
            )
            mup.device_lfdi = data.get("deviceLFDI", "")

            self.resources[mup.href] = mup
            return web.json_response({"status": "registered", "href": mup.href})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=400)

    async def handle_drlc_request(self, request):
        """Handle Demand Response Load Control requests"""
        return await self._handle_function_set_request("drlc", request)

    async def handle_csip_request(self, request):
        """Handle Customer Side Information Provider requests"""
        return await self._handle_function_set_request("csip", request)

    async def handle_pricing_request(self, request):
        """Handle Pricing function set requests"""
        return await self._handle_function_set_request("pricing", request)

    async def handle_p2p_request(self, request):
        """Handle P2P Extensions requests"""
        return await self._handle_function_set_request("p2p_extensions", request)

    async def _handle_function_set_request(self, function_set: str, request):
        """Handle function set requests"""
        try:
            path = request.match_info.get("path", "")
            method = request.method

            data = None
            if method in ["POST", "PUT"]:
                data = await request.json()

            result = self.function_sets.handle_request(function_set, method, f"/{path}", data)
            return web.json_response(result)

        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)

    async def handle_websocket(self, request):
        """Handle WebSocket connections for real-time updates"""
        ws = web.WebSocketResponse()
        await ws.prepare(request)

        # Register client
        client_id = f"ws_{id(ws)}"
        self.clients[client_id] = {"ws": ws, "connected_at": datetime.now(timezone.utc)}

        try:
            async for msg in ws:
                if msg.type == WSMsgType.TEXT:
                    try:
                        data = json.loads(msg.data)
                        # Handle WebSocket messages
                        response = {"type": "echo", "data": data}
                        await ws.send_json(response)
                    except json.JSONDecodeError:
                        await ws.send_json({"error": "Invalid JSON"})
                elif msg.type == WSMsgType.ERROR:
                    print(f"WebSocket error: {ws.exception()}")

        except Exception as e:
            print(f"WebSocket connection error: {e}")

        finally:
            # Unregister client
            if client_id in self.clients:
                del self.clients[client_id]

        return ws

    async def handle_health(self, request):
        """Health check endpoint"""
        return web.json_response({
            "status": "healthy",
            "server": "IEEE 2030.5 Server",
            "version": "2.0",
            "clients_connected": len([c for c in self.clients.values() if "ws" in c]),
            "devices_registered": len([r for r in self.resources.values() if isinstance(r, EndDevice)]),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    def broadcast_to_clients(self, message: Dict):
        """Broadcast a message to all connected WebSocket clients"""
        for client_info in self.clients.values():
            if "ws" in client_info:
                try:
                    asyncio.create_task(client_info["ws"].send_json(message))
                except Exception as e:
                    print(f"Failed to send message to client: {e}")

    async def start(self):
        """Start the IEEE 2030.5 server"""
        # Setup SSL context if certificates exist
        ssl_context = None
        try:
            if self.cert_file and self.key_file:
                ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
                ssl_context.load_cert_chain(self.cert_file, self.key_file)
                print(f"SSL enabled with certificate: {self.cert_file}")
        except FileNotFoundError:
            print("SSL certificates not found, running without SSL")
        except Exception as e:
            print(f"SSL setup failed: {e}, running without SSL")

        # Start server
        self.runner = web.AppRunner(self.app)
        await self.runner.setup()

        if ssl_context:
            self.site = web.TCPSite(self.runner, self.host, self.port, ssl_context=ssl_context)
            protocol = "https"
        else:
            self.site = web.TCPSite(self.runner, self.host, self.port)
            protocol = "http"

        await self.site.start()

        print("=" * 60)
        print("🏫 IEEE 2030.5 Smart Energy Profile 2.0 Server")
        print("=" * 60)
        print(f"✅ Server started on {protocol}://{self.host}:{self.port}")
        print(f"📊 Function sets available: {', '.join(self.function_sets.list_function_sets())}")
        print(f"🔐 SSL: {'Enabled' if ssl_context else 'Disabled'}")
        print(f"📱 WebSocket: {protocol}://{self.host}:{self.port}/ws")
        print(f"💚 Health check: {protocol}://{self.host}:{self.port}/health")
        print("\nPress Ctrl+C to stop the server")
        print("=" * 60)

        # Keep server running
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down server...")
            await self.stop()

    async def stop(self):
        """Stop the IEEE 2030.5 server"""
        if self.site:
            await self.site.stop()
        if self.runner:
            await self.runner.cleanup()

        print("IEEE 2030.5 Server stopped")

    def get_connected_devices(self) -> List[str]:
        """Get list of connected device LFDI"""
        return [lfdi for lfdi in self.clients.keys() if not lfdi.startswith("ws_")]

    def get_device_info(self, lfdi: str) -> Optional[Dict]:
        """Get information about a connected device"""
        return self.clients.get(lfdi)