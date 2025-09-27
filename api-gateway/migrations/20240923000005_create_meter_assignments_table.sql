-- Create meter assignments table
CREATE TABLE meter_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meter_id VARCHAR(20) NOT NULL,
    building VARCHAR(255),
    floor_level INTEGER,
    room_number VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ
);

-- Create indexes for meter assignments
CREATE INDEX idx_meter_assignments_user_id ON meter_assignments(user_id);
CREATE INDEX idx_meter_assignments_meter_id ON meter_assignments(meter_id);
CREATE INDEX idx_meter_assignments_active ON meter_assignments(is_active) WHERE is_active = TRUE;

-- Ensure a meter can only be assigned to one active user at a time
CREATE UNIQUE INDEX idx_meter_assignments_unique_active 
ON meter_assignments(meter_id) 
WHERE is_active = TRUE;