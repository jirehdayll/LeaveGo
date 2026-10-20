-- Migration: Add PENRO approval fields to leave_requests table
-- This migration supports the PENRO approval workflow (PENRO endorses -> Admin approves)

ALTER TABLE leave_requests
ADD COLUMN IF NOT EXISTS penro_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS penro_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS penro_approved_by TEXT;

-- Comments
COMMENT ON COLUMN leave_requests.penro_approved IS 'Executive endorsement/approval by PENRO';
COMMENT ON COLUMN leave_requests.penro_approved_at IS 'Timestamp when PENRO endorsed/approved';
COMMENT ON COLUMN leave_requests.penro_approved_by IS 'Email of PENRO who endorsed/approved';

-- Index
CREATE INDEX IF NOT EXISTS idx_leave_requests_penro_approved ON leave_requests(penro_approved);
