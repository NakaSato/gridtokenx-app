-- Create blockchain transactions table
CREATE TABLE blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signature VARCHAR(88) NOT NULL UNIQUE, -- Solana transaction signature
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id VARCHAR(44) NOT NULL, -- Solana program public key
    instruction_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    fee BIGINT, -- lamports
    compute_units_consumed INTEGER,
    error_message TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    slot BIGINT
);

-- Create indexes for blockchain transactions
CREATE INDEX idx_blockchain_tx_signature ON blockchain_transactions(signature);
CREATE INDEX idx_blockchain_tx_user_id ON blockchain_transactions(user_id);
CREATE INDEX idx_blockchain_tx_status ON blockchain_transactions(status);
CREATE INDEX idx_blockchain_tx_submitted_at ON blockchain_transactions(submitted_at);