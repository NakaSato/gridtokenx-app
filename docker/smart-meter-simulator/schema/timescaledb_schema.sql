-- Enhanced TimescaleDB Schema for P2P Energy Trading AMI Data
-- This schema supports the enhanced simulator with trading and REC capabilities

-- Create enhanced energy readings table
CREATE TABLE IF NOT EXISTS energy_readings_enhanced (
    time TIMESTAMPTZ NOT NULL,
    meter_id VARCHAR(50) NOT NULL,
    meter_type VARCHAR(30) NOT NULL,
    location VARCHAR(100),
    user_type VARCHAR(30) NOT NULL,
    
    -- Core Energy Data (kWh)
    energy_generated DECIMAL(10,4) DEFAULT 0,
    energy_consumed DECIMAL(10,4) DEFAULT 0,
    energy_available_for_sale DECIMAL(10,4) DEFAULT 0,
    energy_needed_from_grid DECIMAL(10,4) DEFAULT 0,
    battery_level DECIMAL(5,1) DEFAULT 0,
    
    -- Electrical Parameters
    voltage DECIMAL(6,2),
    current DECIMAL(8,3),
    power_factor DECIMAL(4,3),
    frequency DECIMAL(5,2),
    temperature DECIMAL(5,1),
    
    -- Solar Specific Data
    irradiance DECIMAL(7,1),
    panel_temperature DECIMAL(5,1),
    weather_condition VARCHAR(20),
    
    -- Grid Connection Data
    grid_connection_status VARCHAR(20) DEFAULT 'Connected',
    grid_feed_in_rate DECIMAL(6,3),
    grid_purchase_rate DECIMAL(6,3),
    
    -- Trading Data
    surplus_energy DECIMAL(10,4) DEFAULT 0,
    deficit_energy DECIMAL(10,4) DEFAULT 0,
    trading_preference VARCHAR(20),
    max_sell_price DECIMAL(6,3),
    max_buy_price DECIMAL(6,3),
    
    -- REC Data (Renewable Energy Certificate)
    rec_eligible BOOLEAN DEFAULT false,
    carbon_offset DECIMAL(8,3) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hypertable for time-series optimization
SELECT create_hypertable('energy_readings_enhanced', 'time', if_not_exists => TRUE);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_energy_readings_meter_id_time 
ON energy_readings_enhanced (meter_id, time DESC);

CREATE INDEX IF NOT EXISTS idx_energy_readings_user_type_time 
ON energy_readings_enhanced (user_type, time DESC);

CREATE INDEX IF NOT EXISTS idx_energy_readings_trading_surplus 
ON energy_readings_enhanced (time DESC, surplus_energy) 
WHERE surplus_energy > 0;

CREATE INDEX IF NOT EXISTS idx_energy_readings_trading_deficit 
ON energy_readings_enhanced (time DESC, deficit_energy) 
WHERE deficit_energy > 0;

CREATE INDEX IF NOT EXISTS idx_energy_readings_rec_eligible 
ON energy_readings_enhanced (time DESC, rec_eligible) 
WHERE rec_eligible = true;

-- Create trading opportunities materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS trading_opportunities_summary AS
SELECT 
    date_trunc('hour', time) as hour,
    meter_id,
    user_type,
    location,
    AVG(surplus_energy) as avg_surplus,
    AVG(deficit_energy) as avg_deficit,
    AVG(max_sell_price) as avg_sell_price,
    AVG(max_buy_price) as avg_buy_price,
    COUNT(*) as reading_count
FROM energy_readings_enhanced
WHERE surplus_energy > 0 OR deficit_energy > 0
GROUP BY date_trunc('hour', time), meter_id, user_type, location
ORDER BY hour DESC, avg_surplus DESC;

-- Create REC summary view
CREATE MATERIALIZED VIEW IF NOT EXISTS rec_generation_summary AS
SELECT 
    date_trunc('hour', time) as hour,
    meter_id,
    location,
    weather_condition,
    SUM(energy_generated) as total_generation,
    SUM(carbon_offset) as total_carbon_offset,
    AVG(irradiance) as avg_irradiance,
    COUNT(*) as reading_count
FROM energy_readings_enhanced
WHERE rec_eligible = true
GROUP BY date_trunc('hour', time), meter_id, location, weather_condition
ORDER BY hour DESC, total_generation DESC;

-- Create weather impact analysis view
CREATE MATERIALIZED VIEW IF NOT EXISTS weather_impact_analysis AS
SELECT 
    date_trunc('day', time) as day,
    weather_condition,
    AVG(energy_generated) as avg_generation,
    AVG(irradiance) as avg_irradiance,
    AVG(panel_temperature) as avg_panel_temp,
    COUNT(*) as reading_count
FROM energy_readings_enhanced
WHERE energy_generated > 0
GROUP BY date_trunc('day', time), weather_condition
ORDER BY day DESC, avg_generation DESC;

-- Create battery performance view
CREATE MATERIALIZED VIEW IF NOT EXISTS battery_performance_summary AS
SELECT 
    date_trunc('hour', time) as hour,
    meter_id,
    AVG(battery_level) as avg_battery_level,
    MAX(battery_level) - MIN(battery_level) as battery_usage,
    SUM(CASE WHEN surplus_energy > 0 THEN surplus_energy ELSE 0 END) as energy_stored,
    SUM(CASE WHEN deficit_energy > 0 THEN deficit_energy ELSE 0 END) as energy_discharged,
    COUNT(*) as reading_count
FROM energy_readings_enhanced
WHERE battery_level > 0
GROUP BY date_trunc('hour', time), meter_id
ORDER BY hour DESC, energy_stored DESC;

-- Create comprehensive energy balance view
CREATE MATERIALIZED VIEW IF NOT EXISTS energy_balance_summary AS
SELECT 
    date_trunc('hour', time) as hour,
    SUM(energy_generated) as total_generation,
    SUM(energy_consumed) as total_consumption,
    SUM(surplus_energy) as total_surplus,
    SUM(deficit_energy) as total_deficit,
    SUM(energy_available_for_sale) as total_available_for_sale,
    SUM(energy_needed_from_grid) as total_needed_from_grid,
    AVG(grid_feed_in_rate) as avg_feed_in_rate,
    AVG(grid_purchase_rate) as avg_purchase_rate,
    COUNT(DISTINCT meter_id) as active_meters,
    COUNT(*) as total_readings
FROM energy_readings_enhanced
GROUP BY date_trunc('hour', time)
ORDER BY hour DESC;

-- Create function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_energy_trading_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW trading_opportunities_summary;
    REFRESH MATERIALIZED VIEW rec_generation_summary;
    REFRESH MATERIALIZED VIEW weather_impact_analysis;
    REFRESH MATERIALIZED VIEW battery_performance_summary;
    REFRESH MATERIALIZED VIEW energy_balance_summary;
    
    RAISE NOTICE 'All energy trading materialized views refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically refresh views hourly
-- (This would typically be managed by a scheduler in production)

-- Grant permissions for the application user
GRANT SELECT, INSERT ON energy_readings_enhanced TO p2p_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO p2p_user;

-- Create retention policy (keep detailed data for 1 year, aggregated data longer)
SELECT add_retention_policy('energy_readings_enhanced', INTERVAL '1 year');

-- Create continuous aggregates for better performance
CREATE MATERIALIZED VIEW IF NOT EXISTS energy_readings_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS hour,
    meter_id,
    meter_type,
    user_type,
    AVG(energy_generated) as avg_generation,
    AVG(energy_consumed) as avg_consumption,
    AVG(surplus_energy) as avg_surplus,
    AVG(deficit_energy) as avg_deficit,
    AVG(battery_level) as avg_battery_level,
    AVG(max_sell_price) as avg_sell_price,
    AVG(max_buy_price) as avg_buy_price,
    SUM(carbon_offset) as total_carbon_offset,
    COUNT(*) as reading_count
FROM energy_readings_enhanced
GROUP BY hour, meter_id, meter_type, user_type;

-- Add refresh policy for continuous aggregate
SELECT add_continuous_aggregate_policy('energy_readings_hourly',
    start_offset => INTERVAL '2 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '30 minutes');

-- Create alerts for unusual patterns
CREATE OR REPLACE FUNCTION check_energy_anomalies()
RETURNS TABLE(
    meter_id VARCHAR(50),
    anomaly_type TEXT,
    current_value DECIMAL,
    expected_range TEXT,
    severity TEXT
) AS $$
BEGIN
    -- Check for unusually high energy generation
    RETURN QUERY
    SELECT 
        e.meter_id,
        'High Generation' as anomaly_type,
        e.energy_generated as current_value,
        'Expected < 20 kWh' as expected_range,
        'WARNING' as severity
    FROM energy_readings_enhanced e
    WHERE e.time >= NOW() - INTERVAL '1 hour'
    AND e.energy_generated > 20;
    
    -- Check for negative energy values (data quality issue)
    RETURN QUERY
    SELECT 
        e.meter_id,
        'Negative Energy' as anomaly_type,
        LEAST(e.energy_generated, e.energy_consumed) as current_value,
        'Expected >= 0' as expected_range,
        'ERROR' as severity
    FROM energy_readings_enhanced e
    WHERE e.time >= NOW() - INTERVAL '1 hour'
    AND (e.energy_generated < 0 OR e.energy_consumed < 0);
    
    -- Check for meters with no recent data
    RETURN QUERY
    SELECT 
        DISTINCT meter_id,
        'No Recent Data' as anomaly_type,
        0 as current_value,
        'Expected data within 1 hour' as expected_range,
        'WARNING' as severity
    FROM energy_readings_enhanced e1
    WHERE NOT EXISTS (
        SELECT 1 FROM energy_readings_enhanced e2 
        WHERE e2.meter_id = e1.meter_id 
        AND e2.time >= NOW() - INTERVAL '1 hour'
    );
    
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE energy_readings_enhanced IS 'Enhanced AMI data for P2P energy trading with battery storage and REC support';
COMMENT ON COLUMN energy_readings_enhanced.energy_available_for_sale IS 'Energy available for P2P trading (kWh)';
COMMENT ON COLUMN energy_readings_enhanced.energy_needed_from_grid IS 'Energy deficit that needs to be purchased (kWh)';
COMMENT ON COLUMN energy_readings_enhanced.battery_level IS 'Battery state of charge (%)';
COMMENT ON COLUMN energy_readings_enhanced.surplus_energy IS 'Total energy surplus available for trading (kWh)';
COMMENT ON COLUMN energy_readings_enhanced.deficit_energy IS 'Total energy deficit requiring purchase (kWh)';
COMMENT ON COLUMN energy_readings_enhanced.rec_eligible IS 'Whether this generation qualifies for Renewable Energy Certificate';
COMMENT ON COLUMN energy_readings_enhanced.carbon_offset IS 'CO2 offset in kg for renewable generation';