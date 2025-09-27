-- Initialize P2P Energy Trading Database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id VARCHAR(64) NOT NULL UNIQUE,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('Prosumer', 'Consumer')),
    location VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Inactive')),
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (kyc_status IN ('Pending', 'Verified', 'Rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Smart meters table
CREATE TABLE smart_meters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_id VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    location VARCHAR(255),
    meter_type VARCHAR(50) NOT NULL DEFAULT 'Solar',
    calibration_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Energy transactions table
CREATE TABLE energy_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_hash VARCHAR(128) NOT NULL UNIQUE,
    block_number BIGINT,
    buyer_id UUID REFERENCES users(id),
    seller_id UUID REFERENCES users(id),
    energy_amount DECIMAL(18, 8) NOT NULL,
    price_per_kwh DECIMAL(18, 8) NOT NULL,
    total_amount DECIMAL(18, 8) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('Trade', 'Mint', 'Burn')),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Market orders table
CREATE TABLE market_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(128) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id),
    order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('Buy', 'Sell')),
    energy_amount DECIMAL(18, 8) NOT NULL,
    price_per_kwh DECIMAL(18, 8) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Filled', 'Cancelled', 'Expired')),
    epoch_number BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    filled_at TIMESTAMP WITH TIME ZONE
);

-- Energy generation/consumption logs table
CREATE TABLE energy_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_id UUID REFERENCES smart_meters(id),
    energy_amount DECIMAL(18, 8) NOT NULL,
    log_type VARCHAR(20) NOT NULL CHECK (log_type IN ('Generation', 'Consumption')),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Market analytics table
CREATE TABLE market_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(18, 8) NOT NULL,
    metric_unit VARCHAR(20),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- REC regulators table
CREATE TABLE rec_regulators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Oracle requests table
CREATE TABLE oracle_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id VARCHAR(128) NOT NULL UNIQUE,
    requester_id UUID REFERENCES users(id),
    meter_id UUID REFERENCES smart_meters(id),
    request_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Fulfilled', 'Failed')),
    response_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_users_account_id ON users(account_id);
CREATE INDEX idx_smart_meters_meter_id ON smart_meters(meter_id);
CREATE INDEX idx_smart_meters_user_id ON smart_meters(user_id);
CREATE INDEX idx_energy_transactions_hash ON energy_transactions(transaction_hash);
CREATE INDEX idx_energy_transactions_buyer ON energy_transactions(buyer_id);
CREATE INDEX idx_energy_transactions_seller ON energy_transactions(seller_id);
CREATE INDEX idx_market_orders_user_id ON market_orders(user_id);
CREATE INDEX idx_market_orders_status ON market_orders(status);
CREATE INDEX idx_market_orders_epoch ON market_orders(epoch_number);
CREATE INDEX idx_energy_logs_meter_id ON energy_logs(meter_id);
CREATE INDEX idx_energy_logs_recorded_at ON energy_logs(recorded_at);
CREATE INDEX idx_oracle_requests_request_id ON oracle_requests(request_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smart_meters_updated_at BEFORE UPDATE ON smart_meters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_orders_updated_at BEFORE UPDATE ON market_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rec_regulators_updated_at BEFORE UPDATE ON rec_regulators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
INSERT INTO rec_regulators (account_id, name, contact_email) VALUES
('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'Development REC Regulator', 'regulator@dev.p2p'),
('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'Test REC Regulator', 'test@dev.p2p');

INSERT INTO users (account_id, user_type, location, status, kyc_status) VALUES
('5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY', 'Prosumer', 'Campus Building A', 'Active', 'Verified'),
('5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc', 'Consumer', 'Campus Building B', 'Active', 'Verified'),
('5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y', 'Prosumer', 'Campus Building C', 'Active', 'Verified');

INSERT INTO smart_meters (meter_id, user_id, location, meter_type, status) VALUES
('METER_001', (SELECT id FROM users WHERE account_id = '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY'), 'Rooftop Solar Panel A1', 'Solar', 'Active'),
('METER_002', (SELECT id FROM users WHERE account_id = '5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc'), 'Building B Consumption', 'Consumption', 'Active'),
('METER_003', (SELECT id FROM users WHERE account_id = '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y'), 'Rooftop Solar Panel C1', 'Solar', 'Active');
