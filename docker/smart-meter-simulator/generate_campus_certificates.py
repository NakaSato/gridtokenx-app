#!/usr/bin/env python3
"""
Campus Certificate Generation for IEEE 2030.5 Multi-Meter Deployment

Generates individual TLS certificates for each of the 25 campus smart meters
following the Stanford University building distribution plan.
"""

import os
import subprocess
from pathlib import Path
from typing import List, Dict


class CampusCertificateGenerator:
    """Generates TLS certificates for all 25 campus smart meters"""
    
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.certs_dir = self.base_dir / "certs"
        self.meters_dir = self.certs_dir / "meters"
        
        # Ensure directories exist
        self.meters_dir.mkdir(parents=True, exist_ok=True)
        
        # Campus building configuration (25 meters total)
        self.campus_buildings = {
            # Academic Buildings (8 meters)
            "academic": [
                {"id": "AMI_METER_STANFORD_ENG_001", "building": "Engineering", "capacity": "50kW/30kWh"},
                {"id": "AMI_METER_STANFORD_PHYS_001", "building": "Physics", "capacity": "45kW/25kWh"},
                {"id": "AMI_METER_STANFORD_CHEM_001", "building": "Chemistry", "capacity": "40kW/20kWh"},
                {"id": "AMI_METER_STANFORD_BIO_001", "building": "Biology", "capacity": "35kW/18kWh"},
                {"id": "AMI_METER_STANFORD_MATH_001", "building": "Mathematics", "capacity": "30kW/15kWh"},
                {"id": "AMI_METER_STANFORD_CS_001", "building": "Computer Science", "capacity": "55kW/35kWh"},
                {"id": "AMI_METER_STANFORD_HIST_001", "building": "History", "capacity": "25kW/12kWh"},
                {"id": "AMI_METER_STANFORD_ART_001", "building": "Art", "capacity": "20kW/10kWh"},
            ],
            # Residential Buildings (6 meters)
            "residential": [
                {"id": "AMI_METER_STANFORD_DORM_001", "building": "Dormitory West", "capacity": "60kW/40kWh"},
                {"id": "AMI_METER_STANFORD_DORM_002", "building": "Dormitory East", "capacity": "55kW/35kWh"},
                {"id": "AMI_METER_STANFORD_DORM_003", "building": "Dormitory North", "capacity": "50kW/30kWh"},
                {"id": "AMI_METER_STANFORD_GRAD_001", "building": "Graduate Housing", "capacity": "45kW/25kWh"},
                {"id": "AMI_METER_STANFORD_FRAT_001", "building": "Fraternity Row", "capacity": "35kW/20kWh"},
                {"id": "AMI_METER_STANFORD_APART_001", "building": "Faculty Apartments", "capacity": "40kW/22kWh"},
            ],
            # Administrative Buildings (4 meters)
            "administrative": [
                {"id": "AMI_METER_STANFORD_ADMIN_001", "building": "Administration", "capacity": "30kW/15kWh"},
                {"id": "AMI_METER_STANFORD_REGIST_001", "building": "Registrar", "capacity": "25kW/12kWh"},
                {"id": "AMI_METER_STANFORD_FINANCE_001", "building": "Financial Aid", "capacity": "28kW/14kWh"},
                {"id": "AMI_METER_STANFORD_PRES_001", "building": "President Office", "capacity": "32kW/16kWh"},
            ],
            # Athletic & Recreation (3 meters)
            "athletic": [
                {"id": "AMI_METER_STANFORD_GYM_001", "building": "Main Gymnasium", "capacity": "80kW/60kWh"},
                {"id": "AMI_METER_STANFORD_POOL_001", "building": "Aquatic Center", "capacity": "70kW/50kWh"},
                {"id": "AMI_METER_STANFORD_FIELD_001", "building": "Athletic Fields", "capacity": "45kW/30kWh"},
            ],
            # Research Facilities (2 meters)
            "research": [
                {"id": "AMI_METER_STANFORD_LAB_001", "building": "Research Laboratory", "capacity": "65kW/45kWh"},
                {"id": "AMI_METER_STANFORD_MED_001", "building": "Medical Research", "capacity": "75kW/55kWh"},
            ],
            # Support Services (2 meters)
            "support": [
                {"id": "AMI_METER_STANFORD_MAINT_001", "building": "Maintenance", "capacity": "35kW/20kWh"},
                {"id": "AMI_METER_STANFORD_DINING_001", "building": "Dining Hall", "capacity": "50kW/30kWh"},
            ]
        }
    
    def get_all_meters(self) -> List[Dict]:
        """Get list of all 25 meters across all building types"""
        all_meters = []
        for building_type, meters in self.campus_buildings.items():
            for meter in meters:
                meter["type"] = building_type
                all_meters.append(meter)
        return all_meters
    
    def generate_meter_certificate(self, meter_id: str, building_name: str) -> bool:
        """Generate TLS certificate for a specific smart meter"""
        try:
            meter_cert_dir = self.meters_dir / meter_id
            meter_cert_dir.mkdir(exist_ok=True)
            
            # Generate private key
            key_file = meter_cert_dir / f"{meter_id}-key.pem"
            csr_file = meter_cert_dir / f"{meter_id}.csr"
            cert_file = meter_cert_dir / f"{meter_id}.pem"
            
            # 1. Generate private key
            subprocess.run([
                "openssl", "genrsa", "-out", str(key_file), "2048"
            ], check=True, capture_output=True)
            
            # 2. Create certificate signing request
            subject = f"/C=US/ST=California/L=Stanford/O=Stanford University/OU=GridTokenX/CN={meter_id}/emailAddress=gridtokenx@stanford.edu"
            subprocess.run([
                "openssl", "req", "-new", "-key", str(key_file), 
                "-out", str(csr_file), "-subj", subject
            ], check=True, capture_output=True)
            
            # 3. Sign certificate with CA
            ca_cert = self.certs_dir / "ca.pem"
            ca_key = self.certs_dir / "ca-key.pem"
            
            subprocess.run([
                "openssl", "x509", "-req", "-in", str(csr_file),
                "-CA", str(ca_cert), "-CAkey", str(ca_key),
                "-CAcreateserial", "-out", str(cert_file),
                "-days", "365", "-sha256"
            ], check=True, capture_output=True)
            
            # Clean up CSR file
            csr_file.unlink()
            
            print(f"✅ Generated certificate for {meter_id} ({building_name})")
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to generate certificate for {meter_id}: {e}")
            return False
    
    def generate_all_certificates(self) -> Dict[str, bool]:
        """Generate certificates for all 25 campus meters"""
        print("🏫 Generating TLS certificates for 25-meter campus network...")
        print(f"📁 Certificate directory: {self.meters_dir}")
        
        results = {}
        all_meters = self.get_all_meters()
        
        for i, meter in enumerate(all_meters, 1):
            meter_id = meter["id"]
            building_name = meter["building"]
            building_type = meter["type"]
            
            print(f"\n[{i:2d}/25] {building_type.upper()}: {meter_id}")
            print(f"        Building: {building_name}")
            print(f"        Capacity: {meter['capacity']}")
            
            success = self.generate_meter_certificate(meter_id, building_name)
            results[meter_id] = success
        
        # Summary
        successful = sum(1 for success in results.values() if success)
        print(f"\n📊 Certificate Generation Summary:")
        print(f"    ✅ Successful: {successful}/25")
        print(f"    ❌ Failed: {25 - successful}/25")
        
        if successful == 25:
            print("\n🎉 All 25 campus meter certificates generated successfully!")
            print("🔐 TLS infrastructure ready for multi-meter deployment")
        
        return results
    
    def verify_certificates(self) -> Dict[str, bool]:
        """Verify all generated certificates"""
        print("\n🔍 Verifying generated certificates...")
        
        results = {}
        all_meters = self.get_all_meters()
        
        for meter in all_meters:
            meter_id = meter["id"]
            cert_file = self.meters_dir / meter_id / f"{meter_id}.pem"
            
            if cert_file.exists():
                try:
                    # Verify certificate with CA
                    ca_cert = self.certs_dir / "ca.pem"
                    subprocess.run([
                        "openssl", "verify", "-CAfile", str(ca_cert), str(cert_file)
                    ], check=True, capture_output=True)
                    results[meter_id] = True
                    print(f"✅ {meter_id}: Valid")
                except subprocess.CalledProcessError:
                    results[meter_id] = False
                    print(f"❌ {meter_id}: Invalid")
            else:
                results[meter_id] = False
                print(f"❌ {meter_id}: Certificate not found")
        
        verified = sum(1 for valid in results.values() if valid)
        print(f"\n📊 Verification Summary: {verified}/25 certificates valid")
        
        return results


def main():
    """Generate certificates for all 25 campus smart meters"""
    generator = CampusCertificateGenerator()
    
    print("🏫 Stanford University GridTokenX Campus Smart Meter Network")
    print("🔐 IEEE 2030.5 TLS Certificate Generation")
    print("=" * 60)
    
    # Generate all certificates
    generation_results = generator.generate_all_certificates()
    
    # Verify certificates
    verification_results = generator.verify_certificates()
    
    # Final status
    if all(generation_results.values()) and all(verification_results.values()):
        print("\n🎉 Campus certificate infrastructure deployment complete!")
        print("✅ Ready for 25-meter IEEE 2030.5 network deployment")
    else:
        print("\n⚠️  Some certificates failed to generate or verify")
        print("🔧 Please check the output above for issues")


if __name__ == "__main__":
    main()