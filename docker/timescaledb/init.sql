-- Initialize TimescaleDB for time-series energy data
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Energy readings table (hypertable)
CREATE TABLE energy_readings (
    time TIMESTAMPTZ NOT NULL,
    meter_id VARCHAR(64) NOT NULL,
    energy_generated DECIMAL(18, 8) DEFAULT 0,
    energy_consumed DECIMAL(18, 8) DEFAULT 0,
    voltage DECIMAL(10, 2),
    current DECIMAL(10, 2),
    power_factor DECIMAL(4, 2),
    frequency DECIMAL(6, 2),
    temperature DECIMAL(6, 2),
    irradiance DECIMAL(10, 2), -- Solar irradiance for solar meters
    weather_condition VARCHAR(50),
    grid_connection_status VARCHAR(20) DEFAULT 'Connected'
);

-- Create hypertable for time-series optimization
SELECT create_hypertable('energy_readings', 'time');

-- Market price history table (hypertable)
CREATE TABLE market_price_history (
    time TIMESTAMPTZ NOT NULL,
    price_per_kwh DECIMAL(18, 8) NOT NULL,
    trading_volume DECIMAL(18, 8) DEFAULT 0,
    active_buy_orders INTEGER DEFAULT 0,
    active_sell_orders INTEGER DEFAULT 0,
    epoch_number BIGINT,
    market_depth_buy DECIMAL(18, 8) DEFAULT 0,
    market_depth_sell DECIMAL(18, 8) DEFAULT 0
);

SELECT create_hypertable('market_price_history', 'time');

-- System metrics table (hypertable)
CREATE TABLE system_metrics (
    time TIMESTAMPTZ NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(18, 8) NOT NULL,
    metric_unit VARCHAR(20),
    component VARCHAR(50), -- blockchain, database, api, oracle
    severity VARCHAR(20) DEFAULT 'info' -- info, warning, error, critical
);

SELECT create_hypertable('system_metrics', 'time');

-- Create indexes for common queries
CREATE INDEX idx_energy_readings_meter_id_time ON energy_readings (meter_id, time DESC);
CREATE INDEX idx_market_price_history_time ON market_price_history (time DESC);
CREATE INDEX idx_system_metrics_component_time ON system_metrics (component, time DESC);
CREATE INDEX idx_system_metrics_severity_time ON system_metrics (severity, time DESC);

-- Create continuous aggregates for analytics
CREATE MATERIALIZED VIEW energy_readings_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS hour,
    meter_id,
    AVG(energy_generated) as avg_energy_generated,
    AVG(energy_consumed) as avg_energy_consumed,
    MAX(energy_generated) as max_energy_generated,
    MAX(energy_consumed) as max_energy_consumed,
    AVG(voltage) as avg_voltage,
    AVG(current) as avg_current,
    AVG(power_factor) as avg_power_factor,
    AVG(temperature) as avg_temperature,
    AVG(irradiance) as avg_irradiance
FROM energy_readings
GROUP BY hour, meter_id;

CREATE MATERIALIZED VIEW energy_readings_daily
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 day', time) AS day,
    meter_id,
    SUM(energy_generated) as total_energy_generated,
    SUM(energy_consumed) as total_energy_consumed,
    AVG(energy_generated) as avg_energy_generated,
    AVG(energy_consumed) as avg_energy_consumed,
    AVG(voltage) as avg_voltage,
    AVG(temperature) as avg_temperature,
    AVG(irradiance) as avg_irradiance
FROM energy_readings
GROUP BY day, meter_id;

CREATE MATERIALIZED VIEW market_price_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS hour,
    AVG(price_per_kwh) as avg_price,
    MIN(price_per_kwh) as min_price,
    MAX(price_per_kwh) as max_price,
    SUM(trading_volume) as total_volume,
    AVG(active_buy_orders) as avg_buy_orders,
    AVG(active_sell_orders) as avg_sell_orders
FROM market_price_history
GROUP BY hour;

-- Enable compression for older data
SELECT add_compression_policy('energy_readings', INTERVAL '7 days');
SELECT add_compression_policy('market_price_history', INTERVAL '7 days');
SELECT add_compression_policy('system_metrics', INTERVAL '3 days');

-- Data retention policies
SELECT add_retention_policy('energy_readings', INTERVAL '2 years');
SELECT add_retention_policy('market_price_history', INTERVAL '5 years');
SELECT add_retention_policy('system_metrics', INTERVAL '1 year');

-- Refresh policies for continuous aggregates
SELECT add_continuous_aggregate_policy('energy_readings_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

SELECT add_continuous_aggregate_policy('energy_readings_daily',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day');

SELECT add_continuous_aggregate_policy('market_price_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- Insert sample time-series data for development
INSERT INTO energy_readings (time, meter_id, energy_generated, energy_consumed, voltage, current, power_factor, temperature, irradiance) VALUES
(NOW() - INTERVAL '1 hour', 'METER_001', 5.2, 0.1, 240.5, 21.7, 0.95, 25.3, 850.0),
(NOW() - INTERVAL '50 minutes', 'METER_001', 5.8, 0.1, 239.8, 24.2, 0.96, 26.1, 920.0),
(NOW() - INTERVAL '40 minutes', 'METER_001', 6.1, 0.1, 241.2, 25.3, 0.94, 27.2, 980.0),
(NOW() - INTERVAL '30 minutes', 'METER_002', 0.0, 3.2, 238.9, 13.4, 0.92, 23.1, NULL),
(NOW() - INTERVAL '20 minutes', 'METER_002', 0.0, 2.9, 239.5, 12.1, 0.93, 22.8, NULL),
(NOW() - INTERVAL '10 minutes', 'METER_003', 4.8, 0.2, 240.1, 20.0, 0.95, 24.5, 780.0);

INSERT INTO market_price_history (time, price_per_kwh, trading_volume, active_buy_orders, active_sell_orders, epoch_number) VALUES
(NOW() - INTERVAL '1 hour', 0.15, 125.5, 8, 12, 1001),
(NOW() - INTERVAL '45 minutes', 0.16, 98.2, 6, 10, 1002),
(NOW() - INTERVAL '30 minutes', 0.14, 156.8, 11, 9, 1003),
(NOW() - INTERVAL '15 minutes', 0.15, 89.3, 7, 8, 1004);

INSERT INTO system_metrics (time, metric_name, metric_value, metric_unit, component, severity) VALUES
(NOW() - INTERVAL '5 minutes', 'block_time', 6.2, 'seconds', 'blockchain', 'info'),
(NOW() - INTERVAL '5 minutes', 'api_response_time', 45.8, 'milliseconds', 'api', 'info'),
(NOW() - INTERVAL '5 minutes', 'db_connections', 12, 'count', 'database', 'info'),
(NOW() - INTERVAL '5 minutes', 'oracle_requests_pending', 3, 'count', 'oracle', 'info');
