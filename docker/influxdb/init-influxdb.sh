#!/bin/sh
# InfluxDB 2.x Initialization Script for GridTokenX AMI
# This script initializes the InfluxDB database with proper configuration for meter data storage

set -e

# Configuration
INFLUX_URL="http://localhost:8086"
INFLUX_TOKEN="gridtokenx-admin-token-2025"
INFLUX_ORG="gridtokenx"
INFLUX_USER="admin"
INFLUX_PASS="gridtokenx2025"

# Wait for InfluxDB to be ready
echo "Waiting for InfluxDB to be ready..."
until curl -s "${INFLUX_URL}/health" > /dev/null; do
  echo "InfluxDB is not ready, waiting..."
  sleep 2
done

echo "InfluxDB is ready. Starting initialization..."

# Setup initial user and organization
echo "Setting up initial user and organization..."
influx setup \
  --username "${INFLUX_USER}" \
  --password "${INFLUX_PASS}" \
  --org "${INFLUX_ORG}" \
  --bucket "gridtokenx" \
  --token "${INFLUX_TOKEN}" \
  --force

# Create additional buckets with retention policies
echo "Creating additional buckets with retention policies..."

# High-frequency meter readings bucket (15-second intervals) - keep for 2 years
influx bucket create \
  --name "meter_readings_2y" \
  --org "${INFLUX_ORG}" \
  --token "${INFLUX_TOKEN}" \
  --retention 175200h

# Market data bucket (hourly) - keep for 5 years
influx bucket create \
  --name "market_data_5y" \
  --org "${INFLUX_ORG}" \
  --token "${INFLUX_TOKEN}" \
  --retention 438000h

# System metrics bucket (daily) - keep for 1 year
influx bucket create \
  --name "system_metrics_1y" \
  --org "${INFLUX_ORG}" \
  --token "${INFLUX_TOKEN}" \
  --retention 8760h

echo "InfluxDB initialization completed successfully!"
echo "Organization: ${INFLUX_ORG}"
echo "Buckets:"
echo "  - gridtokenx: Default bucket"
echo "  - meter_readings_2y: 2 years retention"
echo "  - market_data_5y: 5 years retention"
echo "  - system_metrics_1y: 1 year retention"
echo "Admin Token: ${INFLUX_TOKEN}"