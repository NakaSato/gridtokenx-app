#!/usr/bin/env python3
"""
API Gateway Configuration for GridTokenX Campus Network

Configures the API Gateway service to handle data ingestion from 25 IEEE 2030.5
smart meters and forward processed data to the Oracle Service.
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Any


class APIGatewayConfig:
    """Configuration manager for GridTokenX API Gateway"""
    
    def __init__(self):
        self.config_dir = Path(__file__).parent.parent / "api-gateway"
        self.config_file = self.config_dir / "config" / "campus_network.toml"
        
        # Ensure config directory exists
        (self.config_dir / "config").mkdir(parents=True, exist_ok=True)
    
    def generate_campus_config(self) -> Dict[str, Any]:
        """Generate API Gateway configuration for 25-meter campus network"""
        
        # Campus meter endpoints
        meter_endpoints = self._get_meter_endpoints()
        
        config = {
            # Server configuration
            "server": {
                "host": "0.0.0.0",
                "port": 8080,
                "workers": 4,
                "max_connections": 1000,
                "request_timeout": 30,
                "enable_tls": True,
                "cert_path": "/certs/api-gateway.pem",
                "key_path": "/certs/api-gateway-key.pem"
            },
            
            # Authentication configuration
            "auth": {
                "jwt_secret": "GridTokenX_JWT_Secret_2025",
                "token_expiry": 3600,  # 1 hour
                "api_key_header": "X-GridTokenX-API-Key",
                "require_client_certs": False,  # Meters use IEEE 2030.5 certs
                "trusted_sources": meter_endpoints
            },
            
            # Rate limiting configuration
            "rate_limiting": {
                "enabled": True,
                "requests_per_minute": 1000,
                "burst_limit": 100,
                "rate_limit_by_ip": True,
                "rate_limit_by_api_key": True,
                "redis_url": "redis://redis:6379/0"
            },
            
            # Database configuration
            "database": {
                "primary_db": {
                    "type": "postgresql",
                    "host": "postgres",
                    "port": 5432,
                    "database": "gridtokenx",
                    "username": "gridtokenx_user",
                    "password": "gridtokenx_pass",
                    "max_connections": 20
                },
                "timeseries_db": {
                    "type": "timescaledb",
                    "host": "timescaledb",
                    "port": 5432,
                    "database": "gridtokenx_timeseries",
                    "username": "gridtokenx_user",
                    "password": "gridtokenx_pass",
                    "max_connections": 10
                }
            },
            
            # Message queue configuration
            "messaging": {
                "kafka": {
                    "brokers": ["kafka:9092"],
                    "topics": {
                        "energy_readings": "energy-readings",
                        "p2p_trades": "p2p-trades",
                        "demand_response": "demand-response",
                        "alerts": "system-alerts"
                    },
                    "producer_config": {
                        "acks": "all",
                        "retries": 3,
                        "batch_size": 16384
                    }
                },
                "redis": {
                    "url": "redis://redis:6379/1",
                    "max_connections": 20
                }
            },
            
            # IEEE 2030.5 meter integration
            "ieee2030_5_integration": {
                "server_port": 8443,
                "polling_interval": 15,  # seconds
                "batch_size": 25,
                "timeout": 30,
                "retry_attempts": 3,
                "campus_meters": meter_endpoints
            },
            
            # Data processing configuration
            "data_processing": {
                "validation": {
                    "enabled": True,
                    "reject_invalid_data": True,
                    "data_quality_threshold": 0.95
                },
                "transformation": {
                    "enabled": True,
                    "normalize_units": True,
                    "calculate_aggregates": True,
                    "enrich_metadata": True
                },
                "aggregation": {
                    "enabled": True,
                    "intervals": [60, 300, 900, 3600],  # 1min, 5min, 15min, 1hour
                    "building_level": True,
                    "campus_level": True
                }
            },
            
            # Oracle Service integration
            "oracle_service": {
                "url": "https://oracle:8081",
                "api_key": "GridTokenX_Oracle_API_2025",
                "batch_submit_interval": 300,  # 5 minutes
                "max_batch_size": 100,
                "retry_attempts": 3,
                "timeout": 60
            },
            
            # Monitoring and logging
            "monitoring": {
                "metrics": {
                    "enabled": True,
                    "prometheus_endpoint": "/metrics",
                    "custom_metrics": [
                        "http_requests_total",
                        "meter_data_points_processed",
                        "p2p_trades_processed",
                        "data_validation_errors",
                        "oracle_submission_latency"
                    ]
                },
                "logging": {
                    "level": "INFO",
                    "format": "json",
                    "file": "/var/log/api-gateway/app.log",
                    "rotation": "daily",
                    "retention": "30d"
                },
                "health_check": {
                    "endpoint": "/health",
                    "timeout": 5,
                    "checks": [
                        "database_connection",
                        "redis_connection",
                        "kafka_connection",
                        "oracle_service_connection"
                    ]
                }
            }
        }
        
        return config
    
    def _get_meter_endpoints(self) -> List[Dict[str, Any]]:
        """Get IEEE 2030.5 endpoints for all 25 campus meters"""
        
        # Campus meter definitions
        campus_buildings = {
            "academic": [
                {"id": "AMI_METER_STANFORD_ENG_001", "building": "Engineering", "port": 8443},
                {"id": "AMI_METER_STANFORD_PHYS_001", "building": "Physics", "port": 8444},
                {"id": "AMI_METER_STANFORD_CHEM_001", "building": "Chemistry", "port": 8445},
                {"id": "AMI_METER_STANFORD_BIO_001", "building": "Biology", "port": 8446},
                {"id": "AMI_METER_STANFORD_MATH_001", "building": "Mathematics", "port": 8447},
                {"id": "AMI_METER_STANFORD_CS_001", "building": "Computer Science", "port": 8448},
                {"id": "AMI_METER_STANFORD_HIST_001", "building": "History", "port": 8449},
                {"id": "AMI_METER_STANFORD_ART_001", "building": "Art", "port": 8450},
            ],
            "residential": [
                {"id": "AMI_METER_STANFORD_DORM_001", "building": "Dormitory West", "port": 8451},
                {"id": "AMI_METER_STANFORD_DORM_002", "building": "Dormitory East", "port": 8452},
                {"id": "AMI_METER_STANFORD_DORM_003", "building": "Dormitory North", "port": 8453},
                {"id": "AMI_METER_STANFORD_GRAD_001", "building": "Graduate Housing", "port": 8454},
                {"id": "AMI_METER_STANFORD_FRAT_001", "building": "Fraternity Row", "port": 8455},
                {"id": "AMI_METER_STANFORD_APART_001", "building": "Faculty Apartments", "port": 8456},
            ],
            "administrative": [
                {"id": "AMI_METER_STANFORD_ADMIN_001", "building": "Administration", "port": 8457},
                {"id": "AMI_METER_STANFORD_REGIST_001", "building": "Registrar", "port": 8458},
                {"id": "AMI_METER_STANFORD_FINANCE_001", "building": "Financial Aid", "port": 8459},
                {"id": "AMI_METER_STANFORD_PRES_001", "building": "President Office", "port": 8460},
            ],
            "athletic": [
                {"id": "AMI_METER_STANFORD_GYM_001", "building": "Main Gymnasium", "port": 8461},
                {"id": "AMI_METER_STANFORD_POOL_001", "building": "Aquatic Center", "port": 8462},
                {"id": "AMI_METER_STANFORD_FIELD_001", "building": "Athletic Fields", "port": 8463},
            ],
            "research": [
                {"id": "AMI_METER_STANFORD_LAB_001", "building": "Research Laboratory", "port": 8464},
                {"id": "AMI_METER_STANFORD_MED_001", "building": "Medical Research", "port": 8465},
            ],
            "support": [
                {"id": "AMI_METER_STANFORD_MAINT_001", "building": "Maintenance", "port": 8466},
                {"id": "AMI_METER_STANFORD_DINING_001", "building": "Dining Hall", "port": 8467},
            ]
        }
        
        endpoints = []
        for building_type, meters in campus_buildings.items():
            for meter in meters:
                endpoint = {
                    "meter_id": meter["id"],
                    "building_name": meter["building"],
                    "building_type": building_type,
                    "ieee2030_5_url": f"https://localhost:{meter['port']}",
                    "dcap_endpoint": f"https://localhost:{meter['port']}/dcap",
                    "polling_enabled": True,
                    "polling_interval": 15,
                    "authentication": {
                        "type": "client_certificate",
                        "cert_path": f"/certs/meters/{meter['id']}/{meter['id']}.pem",
                        "key_path": f"/certs/meters/{meter['id']}/{meter['id']}-key.pem"
                    }
                }
                endpoints.append(endpoint)
        
        return endpoints
    
    def save_config(self):
        """Save configuration to TOML file"""
        config = self.generate_campus_config()
        
        # Convert to TOML format (simplified for demo)
        toml_content = self._dict_to_toml(config)
        
        with open(self.config_file, 'w') as f:
            f.write(toml_content)
        
        print(f"✅ API Gateway configuration saved to: {self.config_file}")
        
        # Also save as JSON for easier parsing
        json_file = self.config_file.with_suffix('.json')
        with open(json_file, 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"✅ API Gateway JSON configuration saved to: {json_file}")
        
        return config
    
    def _dict_to_toml(self, data: Dict, indent: int = 0) -> str:
        """Convert dict to TOML format (simplified)"""
        lines = []
        indent_str = "  " * indent
        
        for key, value in data.items():
            if isinstance(value, dict):
                if indent == 0:
                    lines.append(f"\n[{key}]")
                else:
                    lines.append(f"\n{indent_str}[{key}]")
                lines.append(self._dict_to_toml(value, indent + 1))
            elif isinstance(value, list):
                if all(isinstance(item, str) for item in value):
                    items = ', '.join(f'"{item}"' for item in value)
                    lines.append(f"{indent_str}{key} = [{items}]")
                elif all(isinstance(item, int) for item in value):
                    items = ', '.join(str(item) for item in value)
                    lines.append(f"{indent_str}{key} = [{items}]")
                else:
                    # Complex list - convert to JSON for now
                    lines.append(f"{indent_str}# {key} = {json.dumps(value)}")
            elif isinstance(value, str):
                lines.append(f'{indent_str}{key} = "{value}"')
            elif isinstance(value, bool):
                lines.append(f'{indent_str}{key} = {str(value).lower()}')
            elif isinstance(value, (int, float)):
                lines.append(f'{indent_str}{key} = {value}')
        
        return '\n'.join(lines)


def main():
    """Generate API Gateway configuration for campus network"""
    print("⚙️  GridTokenX API Gateway Configuration Generator")
    print("🏫 25-Meter Stanford University Campus Network")
    print("=" * 55)
    
    config_generator = APIGatewayConfig()
    
    # Generate and save configuration
    config = config_generator.save_config()
    
    # Display summary
    print(f"\n📊 Configuration Summary:")
    print(f"    • Total Meters: 25")
    print(f"    • IEEE 2030.5 Endpoints: {len(config['ieee2030_5_integration']['campus_meters'])}")
    print(f"    • API Gateway Port: {config['server']['port']}")
    print(f"    • Polling Interval: {config['ieee2030_5_integration']['polling_interval']}s")
    print(f"    • Batch Size: {config['ieee2030_5_integration']['batch_size']}")
    print(f"    • Oracle Submission Interval: {config['oracle_service']['batch_submit_interval']}s")
    
    print(f"\n🔧 Next Steps:")
    print(f"    1. Review generated configuration files")
    print(f"    2. Deploy API Gateway service with Rust backend")
    print(f"    3. Configure Oracle Service integration")
    print(f"    4. Start campus meter polling")
    
    print(f"\n✅ API Gateway configuration ready for deployment!")


if __name__ == "__main__":
    main()