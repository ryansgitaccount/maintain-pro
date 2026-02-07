-- Migration: Update service_cards table to match ServiceCardForm requirements
-- This migration aligns the database schema with the ServiceCardForm data structure

-- Step 1: Add missing columns to service_cards table
ALTER TABLE service_cards
ADD COLUMN IF NOT EXISTS plant_id text,
ADD COLUMN IF NOT EXISTS machine_hours_at_service numeric,
ADD COLUMN IF NOT EXISTS serviced_by text,
ADD COLUMN IF NOT EXISTS crew_name text,
ADD COLUMN IF NOT EXISTS parts_used jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS labour_hours numeric,
ADD COLUMN IF NOT EXISTS total_cost numeric,
ADD COLUMN IF NOT EXISTS work_description text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'open' CHECK (status IN ('open', 'completed', 'invoiced'));

-- Step 2: Verify the table structure
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'service_cards' 
-- ORDER BY ordinal_position;
