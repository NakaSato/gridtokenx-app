-- Create energy readings table (TimescaleDB hypertable)
CREATE TABLE energy_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id VARCHAR(20) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    energy_generated DECIMAL(10, 4) NOT NULL DEFAULT 0,
    energy_consumed DECIMAL(10, 4) NOT NULL DEFAULT 0,
    solar_irradiance DECIMAL(8, 2),
    temperature DECIMAL(5, 2),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for energy readings
CREATE INDEX idx_energy_readings_meter_id ON energy_readings(meter_id);
CREATE INDEX idx_energy_readings_timestamp ON energy_readings(timestamp);
CREATE INDEX idx_energy_readings_meter_timestamp ON energy_readings(meter_id, timestamp);