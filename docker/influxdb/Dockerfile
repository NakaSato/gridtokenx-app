# InfluxDB Dockerfile for GridTokenX AMI Smart Meter Data
# Optimized for high-frequency time-series storage

FROM influxdb:2.7-alpine

# Set InfluxDB 2.x configuration path
ENV INFLUXD_CONFIG_PATH=/etc/influxdb/influxdb.conf

# Copy configuration file
COPY influxdb.conf /etc/influxdb/influxdb.conf

# Copy initialization script
COPY init-influxdb.sh /init-influxdb.sh

# Create data directories with proper permissions
RUN mkdir -p /var/lib/influxdb/data /var/lib/influxdb/wal /var/lib/influxdb/meta && \
    chown -R influxdb:influxdb /var/lib/influxdb && \
    chmod +x /init-influxdb.sh

# Expose ports
EXPOSE 8086

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8086/health || exit 1

CMD ["influxd"]