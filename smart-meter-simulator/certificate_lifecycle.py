#!/usr/bin/env python3
"""
Certificate Lifecycle Management System for GridTokenX IEEE 2030.5

Implements automated certificate lifecycle management including:
- Automated renewal workflows
- Certificate health monitoring
- Expiration tracking and alerting
- Revocation management
- Certificate distribution
- Compliance reporting

This system ensures continuous operation of the smart meter network
with proactive certificate management.
"""

import asyncio
import json
import logging
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import sqlite3
import requests
from pki_infrastructure import PKIInfrastructure, CertificateRecord

logger = logging.getLogger(__name__)


@dataclass
class RenewalJob:
    """Certificate renewal job"""
    device_id: str
    serial_number: str
    expiry_date: datetime
    priority: str  # 'critical', 'high', 'medium', 'low'
    renewal_attempts: int = 0
    max_attempts: int = 3
    last_attempt: Optional[datetime] = None
    status: str = 'pending'  # 'pending', 'in_progress', 'completed', 'failed'


@dataclass
class CertificateAlert:
    """Certificate alert"""
    alert_type: str
    device_id: str
    serial_number: str
    message: str
    severity: str  # 'critical', 'warning', 'info'
    timestamp: datetime
    acknowledged: bool = False


class NotificationService:
    """Certificate notification service"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.webhook_url = config.get('notification_webhook')
        self.email_config = config.get('email', {})
    
    async def send_alert(self, alert: CertificateAlert):
        """Send certificate alert"""
        try:
            # Send webhook notification
            if self.webhook_url:
                await self.send_webhook_alert(alert)
            
            # Send email notification if configured
            if self.email_config.get('enabled'):
                await self.send_email_alert(alert)
            
            logger.info(f"Alert sent for {alert.device_id}: {alert.message}")
            
        except Exception as e:
            logger.error(f"Failed to send alert for {alert.device_id}: {e}")
    
    async def send_webhook_alert(self, alert: CertificateAlert):
        """Send webhook alert"""
        payload = {
            'alert_type': alert.alert_type,
            'device_id': alert.device_id,
            'serial_number': alert.serial_number,
            'message': alert.message,
            'severity': alert.severity,
            'timestamp': alert.timestamp.isoformat(),
            'campus_network': 'UTCC University GridTokenX'
        }
        
        response = requests.post(
            self.webhook_url,
            json=payload,
            timeout=10,
            headers={'Content-Type': 'application/json'}
        )
        
        response.raise_for_status()
        logger.debug(f"Webhook alert sent: {response.status_code}")
    
    async def send_email_alert(self, alert: CertificateAlert):
        """Send email alert"""
        if not self.email_config.get('enabled'):
            return
        
        msg = EmailMessage()
        msg['Subject'] = f"GridTokenX Certificate Alert: {alert.alert_type.title()}"
        msg['From'] = self.email_config['from_address']
        msg['To'] = self.email_config['to_addresses']
        
        body = f"""
GridTokenX Certificate Alert

Alert Type: {alert.alert_type}
Severity: {alert.severity.upper()}
Device ID: {alert.device_id}
Serial Number: {alert.serial_number}
Timestamp: {alert.timestamp.isoformat()}

Message: {alert.message}

Campus Network: UTCC University GridTokenX
IEEE 2030.5 Smart Grid Infrastructure

This is an automated alert from the GridTokenX Certificate Management System.
"""
        
        msg.set_content(body)
        
        # Send email
        with smtplib.SMTP(self.email_config['smtp_server'], self.email_config['smtp_port']) as server:
            if self.email_config.get('use_tls'):
                server.starttls()
            if self.email_config.get('username'):
                server.login(self.email_config['username'], self.email_config['password'])
            server.send_message(msg)


class CertificateHealthMonitor:
    """Certificate health monitoring service"""
    
    def __init__(self, pki: PKIInfrastructure, notification_service: NotificationService):
        self.pki = pki
        self.notification_service = notification_service
        self.monitoring_config = pki.config.get('monitoring', {})
        self.alerts_db_path = pki.base_dir / "alerts.db"
        self.init_alerts_database()
    
    def init_alerts_database(self):
        """Initialize alerts database"""
        conn = sqlite3.connect(self.alerts_db_path)
        conn.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_type TEXT NOT NULL,
                device_id TEXT NOT NULL,
                serial_number TEXT NOT NULL,
                message TEXT NOT NULL,
                severity TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                acknowledged INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            )
        ''')
        conn.commit()
        conn.close()
    
    def store_alert(self, alert: CertificateAlert):
        """Store alert in database"""
        conn = sqlite3.connect(self.alerts_db_path)
        conn.execute('''
            INSERT INTO alerts 
            (alert_type, device_id, serial_number, message, severity, timestamp, acknowledged, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            alert.alert_type,
            alert.device_id,
            alert.serial_number,
            alert.message,
            alert.severity,
            alert.timestamp.isoformat(),
            1 if alert.acknowledged else 0,
            datetime.now(timezone.utc).isoformat()
        ))
        conn.commit()
        conn.close()
    
    async def check_certificate_health(self):
        """Check health of all certificates"""
        health_report = {
            'total_certificates': 0,
            'active_certificates': 0,
            'revoked_certificates': 0,
            'expired_certificates': 0,
            'expiring_soon': 0,
            'alerts_generated': 0,
            'timestamp': datetime.now(timezone.utc)
        }
        
        # Get all certificates
        conn = sqlite3.connect(self.pki.cert_db.db_path)
        conn.row_factory = sqlite3.Row
        
        all_certs = conn.execute('SELECT * FROM certificates').fetchall()
        health_report['total_certificates'] = len(all_certs)
        
        now = datetime.now(timezone.utc)
        expiry_threshold = now + timedelta(days=30)
        
        for cert_row in all_certs:
            cert_record = CertificateRecord(
                serial_number=cert_row['serial_number'],
                subject_dn=cert_row['subject_dn'],
                issuer_dn=cert_row['issuer_dn'],
                not_before=datetime.fromisoformat(cert_row['not_before']),
                not_after=datetime.fromisoformat(cert_row['not_after']),
                status=cert_row['status'],
                fingerprint_sha256=cert_row['fingerprint_sha256'],
                certificate_pem=cert_row['certificate_pem'],
                device_id=cert_row['device_id'],
                template_name=cert_row['template_name'],
                revocation_date=datetime.fromisoformat(cert_row['revocation_date']) if cert_row['revocation_date'] else None,
                revocation_reason=cert_row['revocation_reason'],
                renewal_count=cert_row['renewal_count']
            )
            
            # Count certificate statuses
            if cert_record.status == 'active':
                health_report['active_certificates'] += 1
            elif cert_record.status == 'revoked':
                health_report['revoked_certificates'] += 1
            
            # Check for expired certificates
            if cert_record.not_after < now:
                health_report['expired_certificates'] += 1
                
                if cert_record.status == 'active':  # Should not be active if expired
                    alert = CertificateAlert(
                        alert_type='certificate_expired',
                        device_id=cert_record.device_id or 'unknown',
                        serial_number=cert_record.serial_number,
                        message=f'Certificate expired on {cert_record.not_after.isoformat()}',
                        severity='critical',
                        timestamp=now
                    )
                    
                    await self.notification_service.send_alert(alert)
                    self.store_alert(alert)
                    health_report['alerts_generated'] += 1
            
            # Check for certificates expiring soon
            elif cert_record.not_after < expiry_threshold and cert_record.status == 'active':
                health_report['expiring_soon'] += 1
                
                days_until_expiry = (cert_record.not_after - now).days
                
                # Determine severity based on days until expiry
                if days_until_expiry <= 7:
                    severity = 'critical'
                elif days_until_expiry <= 14:
                    severity = 'warning'
                else:
                    severity = 'info'
                
                alert = CertificateAlert(
                    alert_type='certificate_expiring',
                    device_id=cert_record.device_id or 'unknown',
                    serial_number=cert_record.serial_number,
                    message=f'Certificate expires in {days_until_expiry} days',
                    severity=severity,
                    timestamp=now
                )
                
                await self.notification_service.send_alert(alert)
                self.store_alert(alert)
                health_report['alerts_generated'] += 1
        
        conn.close()
        
        # Log health report
        logger.info(f"Certificate health check complete: {health_report}")
        return health_report


class CertificateRenewalManager:
    """Automated certificate renewal manager"""
    
    def __init__(self, pki: PKIInfrastructure, notification_service: NotificationService):
        self.pki = pki
        self.notification_service = notification_service
        self.renewal_config = pki.config.get('auto_renewal', {})
        self.renewal_jobs: List[RenewalJob] = []
        self.jobs_db_path = pki.base_dir / "renewal_jobs.db"
        self.init_jobs_database()
    
    def init_jobs_database(self):
        """Initialize renewal jobs database"""
        conn = sqlite3.connect(self.jobs_db_path)
        conn.execute('''
            CREATE TABLE IF NOT EXISTS renewal_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                serial_number TEXT NOT NULL,
                expiry_date TEXT NOT NULL,
                priority TEXT NOT NULL,
                renewal_attempts INTEGER DEFAULT 0,
                max_attempts INTEGER DEFAULT 3,
                last_attempt TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        ''')
        conn.commit()
        conn.close()
    
    def schedule_renewal(self, device_id: str, serial_number: str, 
                        expiry_date: datetime, priority: str = 'medium'):
        """Schedule certificate renewal"""
        job = RenewalJob(
            device_id=device_id,
            serial_number=serial_number,
            expiry_date=expiry_date,
            priority=priority
        )
        
        # Store in database
        conn = sqlite3.connect(self.jobs_db_path)
        now = datetime.now(timezone.utc).isoformat()
        
        conn.execute('''
            INSERT INTO renewal_jobs 
            (device_id, serial_number, expiry_date, priority, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            job.device_id,
            job.serial_number,
            job.expiry_date.isoformat(),
            job.priority,
            job.status,
            now, now
        ))
        
        conn.commit()
        conn.close()
        
        self.renewal_jobs.append(job)
        logger.info(f"Renewal job scheduled for device {device_id}, priority: {priority}")
    
    async def process_renewal_jobs(self):
        """Process pending renewal jobs"""
        # Load pending jobs from database
        self.load_pending_jobs()
        
        # Sort jobs by priority and expiry date
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        self.renewal_jobs.sort(key=lambda x: (priority_order.get(x.priority, 3), x.expiry_date))
        
        processed_count = 0
        
        for job in self.renewal_jobs:
            if job.status != 'pending':
                continue
            
            if job.renewal_attempts >= job.max_attempts:
                job.status = 'failed'
                self.update_job(job)
                
                # Send failure alert
                alert = CertificateAlert(
                    alert_type='renewal_failed',
                    device_id=job.device_id,
                    serial_number=job.serial_number,
                    message=f'Certificate renewal failed after {job.max_attempts} attempts',
                    severity='critical',
                    timestamp=datetime.now(timezone.utc)
                )
                
                await self.notification_service.send_alert(alert)
                continue
            
            # Process renewal job
            success = await self.process_single_renewal(job)
            
            if success:
                job.status = 'completed'
                processed_count += 1
                
                # Send success notification
                alert = CertificateAlert(
                    alert_type='renewal_completed',
                    device_id=job.device_id,
                    serial_number=job.serial_number,
                    message=f'Certificate renewed successfully',
                    severity='info',
                    timestamp=datetime.now(timezone.utc)
                )
                
                await self.notification_service.send_alert(alert)
            else:
                job.renewal_attempts += 1
                job.last_attempt = datetime.now(timezone.utc)
            
            self.update_job(job)
        
        logger.info(f"Processed {processed_count} renewal jobs")
    
    async def process_single_renewal(self, job: RenewalJob) -> bool:
        """Process single renewal job"""
        try:
            logger.info(f"Renewing certificate for device {job.device_id}")
            
            # Get device information
            certs = self.pki.cert_db.get_certificates_by_device(job.device_id)
            if not certs:
                logger.error(f"No certificates found for device {job.device_id}")
                return False
            
            current_cert = certs[0]
            
            # Issue new certificate
            device_info = {
                'country': 'TH',
                'state': 'Bangkok',
                'locality': 'Bangkok',
                'organization': 'UTCC University',
                'ou': 'GridTokenX Smart Meters'
            }
            
            cert_path, key_path = self.pki.issue_device_certificate(
                job.device_id,
                device_info,
                current_cert.template_name or 'smart_meter'
            )
            
            # Update renewal count
            new_certs = self.pki.cert_db.get_certificates_by_device(job.device_id)
            new_cert = new_certs[0]  # Most recent
            new_cert.renewal_count = current_cert.renewal_count + 1
            self.pki.cert_db.store_certificate(new_cert)
            
            # Revoke old certificate if configured
            if self.renewal_config.get('revoke_old', True):
                self.pki.revoke_certificate(current_cert.serial_number, 'superseded')
            
            logger.info(f"Certificate renewal completed for device {job.device_id}")
            return True
            
        except Exception as e:
            logger.error(f"Certificate renewal failed for device {job.device_id}: {e}")
            return False
    
    def load_pending_jobs(self):
        """Load pending renewal jobs from database"""
        conn = sqlite3.connect(self.jobs_db_path)
        conn.row_factory = sqlite3.Row
        
        pending_jobs = conn.execute(
            'SELECT * FROM renewal_jobs WHERE status = ?',
            ('pending',)
        ).fetchall()
        
        conn.close()
        
        self.renewal_jobs = []
        for job_row in pending_jobs:
            job = RenewalJob(
                device_id=job_row['device_id'],
                serial_number=job_row['serial_number'],
                expiry_date=datetime.fromisoformat(job_row['expiry_date']),
                priority=job_row['priority'],
                renewal_attempts=job_row['renewal_attempts'],
                max_attempts=job_row['max_attempts'],
                last_attempt=datetime.fromisoformat(job_row['last_attempt']) if job_row['last_attempt'] else None,
                status=job_row['status']
            )
            self.renewal_jobs.append(job)
    
    def update_job(self, job: RenewalJob):
        """Update renewal job in database"""
        conn = sqlite3.connect(self.jobs_db_path)
        
        conn.execute('''
            UPDATE renewal_jobs 
            SET renewal_attempts = ?, last_attempt = ?, status = ?, updated_at = ?
            WHERE device_id = ? AND serial_number = ?
        ''', (
            job.renewal_attempts,
            job.last_attempt.isoformat() if job.last_attempt else None,
            job.status,
            datetime.now(timezone.utc).isoformat(),
            job.device_id,
            job.serial_number
        ))
        
        conn.commit()
        conn.close()


class CertificateLifecycleManager:
    """Main certificate lifecycle management system"""
    
    def __init__(self, config_path: str):
        self.pki = PKIInfrastructure(config_path)
        self.notification_service = NotificationService(
            self.pki.config.get('auto_renewal', {})
        )
        self.health_monitor = CertificateHealthMonitor(self.pki, self.notification_service)
        self.renewal_manager = CertificateRenewalManager(self.pki, self.notification_service)
        
        # Management configuration
        self.check_interval = self.pki.config.get('auto_renewal', {}).get('check_interval_hours', 24) * 3600
        self.renewal_threshold = self.pki.config.get('auto_renewal', {}).get('renewal_threshold_days', 30)
        
        logger.info("Certificate Lifecycle Manager initialized")
    
    async def start_management(self):
        """Start certificate lifecycle management"""
        logger.info("Starting certificate lifecycle management...")
        
        # Start background tasks
        tasks = [
            asyncio.create_task(self.certificate_monitoring_loop()),
            asyncio.create_task(self.renewal_processing_loop()),
            asyncio.create_task(self.health_check_loop())
        ]
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            logger.info("Certificate lifecycle management stopped")
            for task in tasks:
                task.cancel()
    
    async def certificate_monitoring_loop(self):
        """Main certificate monitoring loop"""
        while True:
            try:
                # Get certificates expiring soon
                expiring_certs = self.pki.cert_db.get_expiring_certificates(self.renewal_threshold)
                
                for cert in expiring_certs:
                    if cert.device_id and cert.status == 'active':
                        # Determine priority based on days until expiry
                        now = datetime.now(timezone.utc)
                        days_until_expiry = (cert.not_after - now).days
                        
                        if days_until_expiry <= 7:
                            priority = 'critical'
                        elif days_until_expiry <= 14:
                            priority = 'high'
                        elif days_until_expiry <= 21:
                            priority = 'medium'
                        else:
                            priority = 'low'
                        
                        # Schedule renewal if auto-renewal is enabled
                        if self.pki.config.get('auto_renewal', {}).get('enabled', False):
                            self.renewal_manager.schedule_renewal(
                                cert.device_id,
                                cert.serial_number,
                                cert.not_after,
                                priority
                            )
                
                # Sleep until next check
                await asyncio.sleep(self.check_interval)
                
            except Exception as e:
                logger.error(f"Certificate monitoring error: {e}")
                await asyncio.sleep(60)  # Retry after 1 minute on error
    
    async def renewal_processing_loop(self):
        """Certificate renewal processing loop"""
        while True:
            try:
                await self.renewal_manager.process_renewal_jobs()
                
                # Process renewals every hour
                await asyncio.sleep(3600)
                
            except Exception as e:
                logger.error(f"Renewal processing error: {e}")
                await asyncio.sleep(60)
    
    async def health_check_loop(self):
        """Certificate health check loop"""
        while True:
            try:
                await self.health_monitor.check_certificate_health()
                
                # Health checks every 4 hours
                await asyncio.sleep(14400)
                
            except Exception as e:
                logger.error(f"Health check error: {e}")
                await asyncio.sleep(300)  # Retry after 5 minutes on error
    
    def issue_campus_certificates(self, campus_config_path: str) -> Dict[str, Any]:
        """Issue certificates for all campus meters"""
        with open(campus_config_path, 'r') as f:
            campus_config = json.load(f)
        
        devices = []
        for meter in campus_config['meters']:
            devices.append({
                'device_id': meter['id'],
                'device_info': {
                    'country': 'TH',
                    'state': 'Bangkok',
                    'locality': 'Bangkok',
                    'organization': 'UTCC University',
                    'ou': 'GridTokenX Smart Meters',
                    'building': meter['building'],
                    'floor': str(meter['floor']),
                    'type': meter['type']
                },
                'template': 'smart_meter'
            })
        
        return self.pki.bulk_issue_certificates(devices)
    
    def get_campus_certificate_status(self) -> Dict[str, Any]:
        """Get certificate status for entire campus"""
        # Get all active certificates
        conn = sqlite3.connect(self.pki.cert_db.db_path)
        conn.row_factory = sqlite3.Row
        
        all_certs = conn.execute(
            'SELECT * FROM certificates WHERE device_id IS NOT NULL ORDER BY device_id'
        ).fetchall()
        
        conn.close()
        
        status_report = {
            'campus_name': 'UTCC University',
            'total_meters': len(all_certs),
            'certificate_summary': {
                'active': 0,
                'revoked': 0,
                'expired': 0,
                'expiring_soon': 0
            },
            'meter_status': [],
            'renewal_recommendations': [],
            'generated_at': datetime.now(timezone.utc).isoformat()
        }
        
        now = datetime.now(timezone.utc)
        expiry_threshold = now + timedelta(days=30)
        
        for cert_row in all_certs:
            cert_record = CertificateRecord(
                serial_number=cert_row['serial_number'],
                subject_dn=cert_row['subject_dn'],
                issuer_dn=cert_row['issuer_dn'],
                not_before=datetime.fromisoformat(cert_row['not_before']),
                not_after=datetime.fromisoformat(cert_row['not_after']),
                status=cert_row['status'],
                fingerprint_sha256=cert_row['fingerprint_sha256'],
                certificate_pem=cert_row['certificate_pem'],
                device_id=cert_row['device_id'],
                template_name=cert_row['template_name'],
                revocation_date=datetime.fromisoformat(cert_row['revocation_date']) if cert_row['revocation_date'] else None,
                revocation_reason=cert_row['revocation_reason'],
                renewal_count=cert_row['renewal_count']
            )
            
            # Update summary counts
            if cert_record.status == 'active':
                if cert_record.not_after < now:
                    status_report['certificate_summary']['expired'] += 1
                elif cert_record.not_after < expiry_threshold:
                    status_report['certificate_summary']['expiring_soon'] += 1
                else:
                    status_report['certificate_summary']['active'] += 1
            elif cert_record.status == 'revoked':
                status_report['certificate_summary']['revoked'] += 1
            
            # Add meter status
            days_until_expiry = (cert_record.not_after - now).days
            meter_status = {
                'device_id': cert_record.device_id,
                'status': cert_record.status,
                'expires_in_days': days_until_expiry,
                'renewal_count': cert_record.renewal_count,
                'fingerprint': cert_record.fingerprint_sha256[:16] + '...'
            }
            
            status_report['meter_status'].append(meter_status)
            
            # Add renewal recommendations
            if cert_record.status == 'active' and days_until_expiry <= 30:
                recommendation = {
                    'device_id': cert_record.device_id,
                    'action': 'renew_certificate',
                    'urgency': 'critical' if days_until_expiry <= 7 else 'high' if days_until_expiry <= 14 else 'medium',
                    'days_until_expiry': days_until_expiry,
                    'reason': f'Certificate expires in {days_until_expiry} days'
                }
                status_report['renewal_recommendations'].append(recommendation)
        
        return status_report