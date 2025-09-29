"""
IEEE 2030.5 Security Manager
Handles X.509 certificates, TLS authentication, and security protocols
"""

import os
import ssl
import json
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class CertificateAuthority:
    """Simplified Certificate Authority for managing device certificates"""

    def __init__(self, ca_cert_path: str = "certs/ca.crt", ca_key_path: str = "certs/ca.key"):
        self.ca_cert_path = Path(ca_cert_path)
        self.ca_key_path = Path(ca_key_path)
        self.certificates: Dict[str, Dict] = {}

        # Ensure certs directory exists
        self.ca_cert_path.parent.mkdir(exist_ok=True)

        # Load or create CA
        if self.ca_cert_path.exists() and self.ca_key_path.exists():
            self.load_ca()
        else:
            self.create_ca()

    def create_ca(self):
        """Create a new Certificate Authority (simplified)"""
        ca_data = {
            "subject": "GridTokenX UTCC Root CA",
            "issuer": "GridTokenX UTCC Root CA",
            "serial_number": str(uuid.uuid4()),
            "not_before": datetime.utcnow().isoformat(),
            "not_after": (datetime.utcnow() + timedelta(days=3650)).isoformat(),
            "public_key": "simulated_rsa_key_4096",
            "signature": "simulated_signature_sha256"
        }

        # Save CA certificate
        with open(self.ca_cert_path, "w") as f:
            json.dump(ca_data, f, indent=2)

        # Save CA private key (simplified)
        key_data = {
            "key_type": "rsa",
            "key_size": 4096,
            "private_key": "simulated_private_key_data"
        }

        with open(self.ca_key_path, "w") as f:
            json.dump(key_data, f, indent=2)

        self.ca_certificate = ca_data
        self.ca_private_key = key_data

    def load_ca(self):
        """Load existing CA certificate and private key"""
        with open(self.ca_cert_path, "r") as f:
            self.ca_certificate = json.load(f)

        with open(self.ca_key_path, "r") as f:
            self.ca_private_key = json.load(f)

    def generate_device_certificate(self, meter_id: str, device_info: Dict) -> Tuple[str, str]:
        """Generate a device certificate for a smart meter (simplified)"""
        # Create device certificate data
        device_cert = {
            "version": "3",
            "serial_number": str(uuid.uuid4()),
            "subject": {
                "common_name": meter_id,
                "organization": device_info.get("organization", "UTCC University"),
                "organizational_unit": "Smart Meters",
                "country": device_info.get("country", "TH"),
                "state": device_info.get("state", "Bangkok"),
                "locality": device_info.get("locality", "Bangkok")
            },
            "issuer": self.ca_certificate["subject"],
            "not_before": datetime.utcnow().isoformat(),
            "not_after": (datetime.utcnow() + timedelta(days=365)).isoformat(),
            "public_key": f"simulated_rsa_key_2048_{meter_id}",
            "signature": f"simulated_signature_sha256_{uuid.uuid4()}",
            "extensions": {
                "key_usage": ["digital_signature", "key_encipherment"],
                "extended_key_usage": ["client_auth"],
                "subject_key_identifier": f"ski_{uuid.uuid4()}",
                "authority_key_identifier": f"aki_{uuid.uuid4()}"
            }
        }

        # Create device private key data
        device_key = {
            "key_type": "rsa",
            "key_size": 2048,
            "private_key": f"simulated_private_key_data_{meter_id}_{uuid.uuid4()}"
        }

        # Save device certificate and private key
        certs_dir = Path("certs/devices")
        certs_dir.mkdir(exist_ok=True)

        cert_path = certs_dir / f"{meter_id}.json"
        key_path = certs_dir / f"{meter_id}_key.json"

        with open(cert_path, "w") as f:
            json.dump(device_cert, f, indent=2)

        with open(key_path, "w") as f:
            json.dump(device_key, f, indent=2)

        self.certificates[meter_id] = device_cert

        return str(cert_path), str(key_path)

    def get_ca_certificate_pem(self) -> str:
        """Get CA certificate in PEM format (simplified)"""
        return f"""-----BEGIN CERTIFICATE-----
{json.dumps(self.ca_certificate, indent=2)}
-----END CERTIFICATE-----"""

    def verify_certificate(self, cert_data: str) -> bool:
        """Verify a certificate against the CA (simplified)"""
        try:
            # In a real implementation, this would verify the certificate signature
            # For simulation, we just check if it's a valid JSON structure
            cert = json.loads(cert_data)
            return cert.get("issuer") == self.ca_certificate.get("subject")
        except Exception:
            return False

import os
import ssl
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend


"""
IEEE 2030.5 Security Manager
Handles X.509 certificates, TLS authentication, and security protocols
"""

import os
import ssl
import json
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class MockCertificateAuthority:
    """Simplified Certificate Authority for managing device certificates"""

    def __init__(self, ca_cert_path: str = "certs/ca.crt", ca_key_path: str = "certs/ca.key"):
        self.ca_cert_path = Path(ca_cert_path)
        self.ca_key_path = Path(ca_key_path)
        self.certificates: Dict[str, Dict] = {}

        # Ensure certs directory exists
        self.ca_cert_path.parent.mkdir(exist_ok=True)

        # Load or create CA
        if self.ca_cert_path.exists() and self.ca_key_path.exists():
            self.load_ca()
        else:
            self.create_ca()

    def create_ca(self):
        """Create a new Certificate Authority (simplified)"""
        ca_data = {
            "subject": "GridTokenX UTCC Root CA",
            "issuer": "GridTokenX UTCC Root CA",
            "serial_number": str(uuid.uuid4()),
            "not_before": datetime.utcnow().isoformat(),
            "not_after": (datetime.utcnow() + timedelta(days=3650)).isoformat(),
            "public_key": "simulated_rsa_key_4096",
            "signature": "simulated_signature_sha256"
        }

        # Save CA certificate
        with open(self.ca_cert_path, "w") as f:
            json.dump(ca_data, f, indent=2)

        # Save CA private key (simplified)
        key_data = {
            "key_type": "rsa",
            "key_size": 4096,
            "private_key": "simulated_private_key_data"
        }

        with open(self.ca_key_path, "w") as f:
            json.dump(key_data, f, indent=2)

        self.ca_certificate = ca_data
        self.ca_private_key = key_data

    def load_ca(self):
        """Load existing CA certificate and private key"""
        with open(self.ca_cert_path, "r") as f:
            self.ca_certificate = json.load(f)

        with open(self.ca_key_path, "r") as f:
            self.ca_private_key = json.load(f)

    def generate_device_certificate(self, meter_id: str, device_info: Dict) -> Tuple[str, str]:
        """Generate a device certificate for a smart meter (simplified)"""
        # Create device certificate data
        device_cert = {
            "version": "3",
            "serial_number": str(uuid.uuid4()),
            "subject": {
                "common_name": meter_id,
                "organization": device_info.get("organization", "UTCC University"),
                "organizational_unit": "Smart Meters",
                "country": device_info.get("country", "TH"),
                "state": device_info.get("state", "Bangkok"),
                "locality": device_info.get("locality", "Bangkok")
            },
            "issuer": self.ca_certificate["subject"],
            "not_before": datetime.utcnow().isoformat(),
            "not_after": (datetime.utcnow() + timedelta(days=365)).isoformat(),
            "public_key": f"simulated_rsa_key_2048_{meter_id}",
            "signature": f"simulated_signature_sha256_{uuid.uuid4()}",
            "extensions": {
                "key_usage": ["digital_signature", "key_encipherment"],
                "extended_key_usage": ["client_auth"],
                "subject_key_identifier": f"ski_{uuid.uuid4()}",
                "authority_key_identifier": f"aki_{uuid.uuid4()}"
            }
        }

        # Create device private key data
        device_key = {
            "key_type": "rsa",
            "key_size": 2048,
            "private_key": f"simulated_private_key_data_{meter_id}_{uuid.uuid4()}"
        }

        # Save device certificate and private key
        certs_dir = Path("certs/devices")
        certs_dir.mkdir(exist_ok=True)

        cert_path = certs_dir / f"{meter_id}.json"
        key_path = certs_dir / f"{meter_id}_key.json"

        with open(cert_path, "w") as f:
            json.dump(device_cert, f, indent=2)

        with open(key_path, "w") as f:
            json.dump(device_key, f, indent=2)

        self.certificates[meter_id] = device_cert

        return str(cert_path), str(key_path)

    def get_ca_certificate_pem(self) -> str:
        """Get CA certificate in PEM format (simplified)"""
        return f"""-----BEGIN CERTIFICATE-----
{json.dumps(self.ca_certificate, indent=2)}
-----END CERTIFICATE-----"""

    def verify_certificate(self, cert_data: str) -> bool:
        """Verify a certificate against the CA (simplified)"""
        try:
            # In a real implementation, this would verify the certificate signature
            # For simulation, we just check if it's a valid JSON structure
            cert = json.loads(cert_data)
            return cert.get("issuer") == self.ca_certificate.get("subject")
        except Exception:
            return False


class CertificateAuthority:
    """Certificate Authority for managing device certificates"""

    def __init__(self, ca_cert_path: str = "certs/ca.crt", ca_key_path: str = "certs/ca.key"):
        self.ca_cert_path = Path(ca_cert_path)
        self.ca_key_path = Path(ca_key_path)
        self.certificates: Dict[str, Dict] = {}

        # Ensure certs directory exists
        self.ca_cert_path.parent.mkdir(exist_ok=True)

        # Load or create CA
        if self.ca_cert_path.exists() and self.ca_key_path.exists():
            self.load_ca()
        else:
            self.create_ca()

    def create_ca(self):
        """Create a new Certificate Authority (simplified)"""
        ca_data = {
            "subject": "GridTokenX UTCC Root CA",
            "issuer": "GridTokenX UTCC Root CA",
            "serial_number": str(uuid.uuid4()),
            "not_before": datetime.utcnow().isoformat(),
            "not_after": (datetime.utcnow() + timedelta(days=3650)).isoformat(),
            "public_key": "simulated_rsa_key_4096",
            "signature": "simulated_signature_sha256"
        }

        # Save CA certificate
        with open(self.ca_cert_path, "w") as f:
            json.dump(ca_data, f, indent=2)

        # Save CA private key (simplified)
        key_data = {
            "key_type": "rsa",
            "key_size": 4096,
            "private_key": "simulated_private_key_data"
        }

        with open(self.ca_key_path, "w") as f:
            json.dump(key_data, f, indent=2)

        self.ca_certificate = ca_data
        self.ca_private_key = key_data

    def load_ca(self):
        """Load existing CA certificate and private key"""
        with open(self.ca_cert_path, "r") as f:
            self.ca_certificate = json.load(f)

        with open(self.ca_key_path, "r") as f:
            self.ca_private_key = json.load(f)

    def generate_device_certificate(self, meter_id: str, device_info: Dict) -> Tuple[str, str]:
        """Generate a device certificate for a smart meter (simplified)"""
        # Create device certificate data
        device_cert = {
            "version": "3",
            "serial_number": str(uuid.uuid4()),
            "subject": {
                "common_name": meter_id,
                "organization": device_info.get("organization", "UTCC University"),
                "organizational_unit": "Smart Meters",
                "country": device_info.get("country", "TH"),
                "state": device_info.get("state", "Bangkok"),
                "locality": device_info.get("locality", "Bangkok")
            },
            "issuer": self.ca_certificate["subject"],
            "not_before": datetime.utcnow().isoformat(),
            "not_after": (datetime.utcnow() + timedelta(days=365)).isoformat(),
            "public_key": f"simulated_rsa_key_2048_{meter_id}",
            "signature": f"simulated_signature_sha256_{uuid.uuid4()}",
            "extensions": {
                "key_usage": ["digital_signature", "key_encipherment"],
                "extended_key_usage": ["client_auth"],
                "subject_key_identifier": f"ski_{uuid.uuid4()}",
                "authority_key_identifier": f"aki_{uuid.uuid4()}"
            }
        }

        # Create device private key data
        device_key = {
            "key_type": "rsa",
            "key_size": 2048,
            "private_key": f"simulated_private_key_data_{meter_id}_{uuid.uuid4()}"
        }

        # Save device certificate and private key
        certs_dir = Path("certs/devices")
        certs_dir.mkdir(exist_ok=True)

        cert_path = certs_dir / f"{meter_id}.json"
        key_path = certs_dir / f"{meter_id}_key.json"

        with open(cert_path, "w") as f:
            json.dump(device_cert, f, indent=2)

        with open(key_path, "w") as f:
            json.dump(device_key, f, indent=2)

        self.certificates[meter_id] = device_cert

        return str(cert_path), str(key_path)

    def get_ca_certificate_pem(self) -> str:
        """Get CA certificate in PEM format (simplified)"""
        return f"""-----BEGIN CERTIFICATE-----
{json.dumps(self.ca_certificate, indent=2)}
-----END CERTIFICATE-----"""

    def verify_certificate(self, cert_data: str) -> bool:
        """Verify a certificate against the CA (simplified)"""
        try:
            # In a real implementation, this would verify the certificate signature
            # For simulation, we just check if it's a valid JSON structure
            cert = json.loads(cert_data)
            return cert.get("issuer") == self.ca_certificate.get("subject")
        except Exception:
            return False


class SecurityManager:
    """IEEE 2030.5 Security Manager"""

    def __init__(self, ca_cert_path: str = "certs/ca.crt", ca_key_path: str = "certs/ca.key"):
        self.ca = CertificateAuthority(ca_cert_path, ca_key_path)
        self.device_certificates: Dict[str, Dict] = {}
        self.load_device_certificates()

    def load_device_certificates(self):
        """Load existing device certificates"""
        certs_dir = Path("certs/devices")
        if not certs_dir.exists():
            return

        for cert_file in certs_dir.glob("*.crt"):
            meter_id = cert_file.stem
            key_file = cert_file.with_suffix(".key")

            if key_file.exists():
                with open(cert_file, "rb") as f:
                    cert_pem = f.read()

                with open(key_file, "rb") as f:
                    key_pem = f.read()

                self.device_certificates[meter_id] = {
                    "certificate": cert_pem,
                    "private_key": key_pem,
                    "cert_path": str(cert_file),
                    "key_path": str(key_file),
                }

    def register_device(self, meter_id: str, device_info: Dict) -> Dict:
        """Register a new device and generate certificates"""
        if meter_id in self.device_certificates:
            return self.device_certificates[meter_id]

        cert_path, key_path = self.ca.generate_device_certificate(meter_id, device_info)

        # Load the generated certificate
        with open(cert_path, "rb") as f:
            cert_pem = f.read()

        with open(key_path, "rb") as f:
            key_pem = f.read()

        device_cert = {
            "certificate": cert_pem,
            "private_key": key_pem,
            "cert_path": cert_path,
            "key_path": key_path,
            "meter_id": meter_id,
            "registered_at": datetime.utcnow().isoformat(),
        }

        self.device_certificates[meter_id] = device_cert
        return device_cert

    def get_device_certificate(self, meter_id: str) -> Optional[Dict]:
        """Get device certificate information"""
        return self.device_certificates.get(meter_id)

    def create_ssl_context(self, meter_id: str) -> ssl.SSLContext:
        """Create SSL context for a device"""
        device_cert = self.get_device_certificate(meter_id)
        if not device_cert:
            raise ValueError(f"No certificate found for meter {meter_id}")

        # Create SSL context
        context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE  # For development - use CERT_REQUIRED in production

        # Load device certificate and key
        context.load_cert_chain(
            device_cert["cert_path"],
            device_cert["key_path"]
        )

        # Load CA certificate for verification
        ca_cert_file = f"/tmp/ca_cert_{meter_id}.pem"
        with open(ca_cert_file, "w") as f:
            f.write(self.ca.get_ca_certificate_pem())

        context.load_verify_locations(ca_cert_file)

        return context

    def authenticate_device(self, client_cert: bytes) -> Optional[str]:
        """Authenticate a device based on client certificate"""
        try:
            # In simulation, we just return a mock meter ID
            # In real implementation, this would parse the certificate
            return "simulated_meter_id"
        except Exception:
            return None

    def get_certificate_expiry_info(self, meter_id: str) -> Optional[Dict]:
        """Get certificate expiry information for a device"""
        device_cert = self.get_device_certificate(meter_id)
        if not device_cert:
            return None

        try:
            cert = x509.load_pem_x509_certificate(device_cert["certificate"], default_backend())

            expiry_date = cert.not_valid_after
            days_until_expiry = (expiry_date - datetime.utcnow()).days

            return {
                "meter_id": meter_id,
                "expiry_date": expiry_date.isoformat(),
                "days_until_expiry": days_until_expiry,
                "is_expired": days_until_expiry < 0,
                "needs_renewal": days_until_expiry < 30,  # Renew if less than 30 days
            }

        except Exception:
            return None

    def renew_certificate(self, meter_id: str, device_info: Dict) -> bool:
        """Renew a device certificate"""
        try:
            # Generate new certificate
            self.register_device(meter_id, device_info)
            return True
        except Exception:
            return False