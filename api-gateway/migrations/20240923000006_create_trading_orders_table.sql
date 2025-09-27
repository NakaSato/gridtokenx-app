-- Create trading orders table
CREATE TABLE trading_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_type order_type_enum NOT NULL,
    side order_side_enum NOT NULL,
    energy_amount DECIMAL(18, 8) NOT NULL CHECK (energy_amount > 0),
    price_per_kwh DECIMAL(18, 8) CHECK (price_per_kwh > 0),
    total_value DECIMAL(18, 8),
    filled_amount DECIMAL(18, 8) NOT NULL DEFAULT 0,
    status order_status_enum NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMPTZ,
    blockchain_tx_hash VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    filled_at TIMESTAMPTZ
);

-- Create indexes for trading orders
CREATE INDEX idx_trading_orders_user_id ON trading_orders(user_id);
CREATE INDEX idx_trading_orders_status ON trading_orders(status);
CREATE INDEX idx_trading_orders_side ON trading_orders(side);
CREATE INDEX idx_trading_orders_created_at ON trading_orders(created_at);
CREATE INDEX idx_trading_orders_active ON trading_orders(status, created_at) 
WHERE status IN ('pending', 'active');