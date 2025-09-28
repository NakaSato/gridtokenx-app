#!/usr/bin/env python3
"""
IEEE 2030.5 Security Manager

This module implements the security requirements for IEEE 2030.5 Smart Energy Profile 2.0
including TLS 1.2+ client certificate authentication, device registration, and secure
communication protocols.

Security Features:
- X.509 certificate-based authentication
- TLS 1.2+ mutual authentication
- Device registration and provisioning
- Certificate validation and management
- Security event logging
- Access control and authorization
"""

import ssl
import hashlib
import hmac
import base64
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Union
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption
import logging

logger = logging.getLogger(__name__)


class SecurityException(Exception):
    """IEEE 2030.5 Security Exception"""
    pass


class CertificateValidationError(SecurityException):
    """Certificate validation error"""
    pass


class DeviceAuthenticationError(SecurityException):
    """Device authentication error"""
    pass


class SecurityManager:
    """IEEE 2030.5 Security Manager"""
    
    def __init__(self, ca_cert_path: Optional[str] = None, ca_key_path: Optional[str] = None):
        self.ca_cert_path = ca_cert_path
        self.ca_key_path = ca_key_path
        self.registered_devices: Dict[str, Dict[str, Any]] = {}
        
        # Load CA certificate if provided
        self.ca_cert = None
        self.ca_private_key = None
        
        if ca_cert_path:
            self.load_ca_certificate()
    
    def load_ca_certificate(self):
        """Load Certificate Authority certificate and private key"""
        try:
            if self.ca_cert_path:
                with open(self.ca_cert_path, 'rb') as f:
                    self.ca_cert = x509.load_pem_x509_certificate(f.read())
            
            if self.ca_key_path:
                with open(self.ca_key_path, 'rb') as f:
                    self.ca_private_key = serialization.load_pem_private_key(
                        f.read(), password=None
                    )
            
            logger.info("CA certificate loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load CA certificate: {e}")
            raise SecurityException(f"CA certificate loading failed: {e}")
    
    def generate_device_certificate(self, device_id: str, common_name: str, 
                                  validity_days: int = 365) -> tuple[bytes, bytes]:
        """Generate X.509 certificate for device"""
        if not self.ca_cert or not self.ca_private_key:
            raise SecurityException("CA certificate not loaded")
        
        # Generate device private key
        device_private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        
        # Create certificate subject
        subject = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "California"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, "Stanford"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "GridTokenX"),
            x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "Smart Meters"),
            x509.NameAttribute(NameOID.COMMON_NAME, common_name),
        ])
        
        # Create certificate
        now = datetime.now(timezone.utc)
        cert_builder = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(self.ca_cert.subject)
            .public_key(device_private_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(now)
            .not_valid_after(now + timedelta(days=validity_days))
            .add_extension(
                x509.SubjectAlternativeName([
                    x509.DNSName(f"meter-{device_id}.gridtokenx.local"),
                    x509.RFC822Name(f"{device_id}@gridtokenx.local"),
                ]),
                critical=False,
            )
            .add_extension(
                x509.KeyUsage(
                    digital_signature=True,
                    key_encipherment=True,
                    key_agreement=False,
                    key_cert_sign=False,
                    crl_sign=False,
                    content_commitment=False,
                    data_encipherment=False,
                    encipher_only=False,
                    decipher_only=False,
                ),
                critical=True,
            )
            .add_extension(
                x509.ExtendedKeyUsage([
                    x509.oid.ExtendedKeyUsageOID.CLIENT_AUTH,
                    x509.oid.ExtendedKeyUsageOID.SERVER_AUTH,
                ]),
                critical=True,
            )
        )
        
        # Sign certificate with CA
        device_cert = cert_builder.sign(self.ca_private_key, hashes.SHA256())
        
        # Serialize certificate and private key
        cert_pem = device_cert.public_bytes(Encoding.PEM)
        key_pem = device_private_key.private_bytes(
            encoding=Encoding.PEM,
            format=PrivateFormat.PKCS8,
            encryption_algorithm=NoEncryption()
        )
        
        logger.info(f"Generated certificate for device {device_id}")
        return cert_pem, key_pem
    
    def validate_certificate(self, cert_data: bytes) -> bool:
        """Validate device certificate against CA"""
        try:
            device_cert = x509.load_pem_x509_certificate(cert_data)
            
            # Check if certificate is signed by our CA
            if not self.ca_cert:
                raise CertificateValidationError("CA certificate not loaded")
            
            # Verify signature
            try:
                self.ca_cert.public_key().verify(
                    device_cert.signature,
                    device_cert.tbs_certificate_bytes,
                    padding.PKCS1v15(),
                    device_cert.signature_hash_algorithm
                )
                logger.debug("Certificate signature validation passed")
            except Exception as e:
                raise CertificateValidationError(f"Certificate signature invalid: {e}")
            
            # Check validity period
            now = datetime.now(timezone.utc)
            if device_cert.not_valid_before > now:
                raise CertificateValidationError("Certificate not yet valid")
            if device_cert.not_valid_after < now:
                raise CertificateValidationError("Certificate expired")
            
            # Check critical extensions
            try:
                key_usage = device_cert.extensions.get_extension_for_oid(
                    x509.oid.ExtensionOID.KEY_USAGE
                ).value
                if not key_usage.digital_signature:
                    raise CertificateValidationError("Certificate missing digital signature usage")
            except x509.ExtensionNotFound:
                raise CertificateValidationError("Certificate missing key usage extension")
            
            return True
            
        except Exception as e:
            logger.error(f"Certificate validation failed: {e}")
            raise CertificateValidationError(f"Certificate validation failed: {e}")
    
    def register_device(self, device_id: str, certificate: bytes, 
                       device_info: Dict[str, Any]) -> Dict[str, Any]:
        """Register device with certificate"""
        try:
            # Validate certificate
            self.validate_certificate(certificate)
            
            # Extract device information from certificate
            device_cert = x509.load_pem_x509_certificate(certificate)
            
            # Generate device credentials
            registration_token = self.generate_registration_token(device_id)
            
            # Store device registration
            device_record = {
                'device_id': device_id,
                'certificate': certificate,
                'certificate_fingerprint': hashlib.sha256(certificate).hexdigest(),
                'registration_time': datetime.now(timezone.utc),
                'registration_token': registration_token,
                'status': 'registered',
                'device_info': device_info,
                'cert_subject': device_cert.subject.rfc4514_string(),
                'cert_serial': str(device_cert.serial_number),
                'cert_not_before': device_cert.not_valid_before,
                'cert_not_after': device_cert.not_valid_after,
            }
            
            self.registered_devices[device_id] = device_record
            
            logger.info(f"Device {device_id} registered successfully")
            return device_record
            
        except Exception as e:
            logger.error(f"Device registration failed for {device_id}: {e}")
            raise DeviceAuthenticationError(f"Device registration failed: {e}")
    
    def authenticate_device(self, device_id: str, certificate: bytes, 
                          signature: bytes, message: bytes) -> bool:
        """Authenticate device using certificate and signature"""
        try:
            # Check if device is registered
            if device_id not in self.registered_devices:
                raise DeviceAuthenticationError("Device not registered")
            
            device_record = self.registered_devices[device_id]
            
            # Validate certificate matches registration
            cert_fingerprint = hashlib.sha256(certificate).hexdigest()
            if cert_fingerprint != device_record['certificate_fingerprint']:
                raise DeviceAuthenticationError("Certificate fingerprint mismatch")
            
            # Validate certificate
            self.validate_certificate(certificate)
            
            # Load certificate and verify signature
            device_cert = x509.load_pem_x509_certificate(certificate)
            
            try:
                device_cert.public_key().verify(
                    signature,
                    message,
                    padding.PKCS1v15(),
                    hashes.SHA256()
                )
                logger.debug(f"Device {device_id} authentication successful")
                return True
            except Exception as e:
                raise DeviceAuthenticationError(f"Signature verification failed: {e}")
                
        except Exception as e:
            logger.error(f"Device authentication failed for {device_id}: {e}")
            raise DeviceAuthenticationError(f"Authentication failed: {e}")
    
    def generate_registration_token(self, device_id: str) -> str:
        """Generate secure registration token"""
        token_data = f"{device_id}:{datetime.now(timezone.utc).isoformat()}:{secrets.token_hex(16)}"
        return base64.b64encode(token_data.encode()).decode()
    
    def create_tls_context(self, cert_required: bool = True) -> ssl.SSLContext:
        """Create TLS context for IEEE 2030.5 communication"""
        context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        
        # Configure for IEEE 2030.5 requirements
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        context.maximum_version = ssl.TLSVersion.TLSv1_3
        
        # Require client certificates
        if cert_required:
            context.verify_mode = ssl.CERT_REQUIRED
        else:
            context.verify_mode = ssl.CERT_OPTIONAL
        
        # Load CA certificate for client verification
        if self.ca_cert_path:
            context.load_verify_locations(self.ca_cert_path)
        
        # Configure cipher suites (IEEE 2030.5 recommended)
        context.set_ciphers('ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS')
        
        return context
    
    def validate_device_access(self, device_id: str, resource_path: str, 
                              operation: str) -> bool:
        """Validate device access to specific resources"""
        if device_id not in self.registered_devices:
            return False
        
        device_record = self.registered_devices[device_id]
        
        # Check device status
        if device_record['status'] != 'registered':
            return False
        
        # Check certificate validity
        now = datetime.now(timezone.utc)
        if device_record['cert_not_after'] < now:
            logger.warning(f"Device {device_id} certificate expired")
            return False
        
        # IEEE 2030.5 resource access control
        allowed_resources = {
            'dcap': ['GET'],  # Device Capability
            'edev': ['GET', 'PUT'],  # End Device
            'mup': ['GET', 'POST'],  # Mirror Usage Point
            'mr': ['GET', 'POST'],  # Meter Reading
            'upt': ['GET'],  # Usage Point
            'time': ['GET'],  # Time
            'dr': ['GET', 'POST'],  # Demand Response
            'drlc': ['GET', 'POST'],  # Demand Response Load Control
        }
        
        # Extract resource type from path
        resource_type = resource_path.split('/')[1] if '/' in resource_path else resource_path
        
        if resource_type in allowed_resources:
            return operation in allowed_resources[resource_type]
        
        # Default deny
        return False
    
    def log_security_event(self, device_id: str, event_type: str, 
                          details: Dict[str, Any], severity: str = 'info'):
        """Log security events"""
        event = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'device_id': device_id,
            'event_type': event_type,
            'severity': severity,
            'details': details
        }
        
        # Log to system logger
        log_level = getattr(logging, severity.upper(), logging.INFO)
        logger.log(log_level, f"Security Event: {event}")
        
        # In production, this would also be sent to SIEM/security monitoring
        return event
    
    def revoke_device_certificate(self, device_id: str, reason: str = 'unspecified'):
        """Revoke device certificate"""
        if device_id in self.registered_devices:
            self.registered_devices[device_id]['status'] = 'revoked'
            self.registered_devices[device_id]['revocation_time'] = datetime.now(timezone.utc)
            self.registered_devices[device_id]['revocation_reason'] = reason
            
            self.log_security_event(
                device_id, 
                'certificate_revoked',
                {'reason': reason},
                'warning'
            )
            
            logger.warning(f"Device {device_id} certificate revoked: {reason}")
            return True
        return False
    
    def get_device_status(self, device_id: str) -> Dict[str, Any]:
        """Get device security status"""
        if device_id not in self.registered_devices:
            return {'status': 'not_registered'}
        
        device_record = self.registered_devices[device_id]
        now = datetime.now(timezone.utc)
        
        return {
            'device_id': device_id,
            'status': device_record['status'],
            'registration_time': device_record['registration_time'].isoformat(),
            'certificate_valid': device_record['cert_not_after'] > now,
            'certificate_expires': device_record['cert_not_after'].isoformat(),
            'certificate_fingerprint': device_record['certificate_fingerprint'][:16] + '...',
        }