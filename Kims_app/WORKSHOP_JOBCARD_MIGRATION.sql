-- Migration: Update workshop_job_cards table to match form requirements
-- This migration aligns the database schema with the JobCardForm data structure

-- Step 1: Add missing columns to workshop_job_cards table
ALTER TABLE workshop_job_cards
ADD COLUMN IF NOT EXISTS job_number text UNIQUE,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS reported_by text,
ADD COLUMN IF NOT EXISTS order_number text,
ADD COLUMN IF NOT EXISTS fault_description text,
ADD COLUMN IF NOT EXISTS work_to_be_done text,
ADD COLUMN IF NOT EXISTS mechanic_assigned text,
ADD COLUMN IF NOT EXISTS parts_used jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS labour_hours numeric,
ADD COLUMN IF NOT EXISTS total_cost numeric,
ADD COLUMN IF NOT EXISTS completion_notes text;

-- Step 2: Update existing status values to match form expectations
-- Map old values to new values if needed
UPDATE workshop_job_cards 
SET status = 'new' 
WHERE status = 'pending';

UPDATE workshop_job_cards 
SET status = 'in_progress' 
WHERE status = 'in_progress';

UPDATE workshop_job_cards 
SET status = 'completed' 
WHERE status = 'completed';

UPDATE workshop_job_cards 
SET status = 'closed' 
WHERE status = 'closed';

-- Step 3: Update status constraint to match form values
ALTER TABLE workshop_job_cards 
DROP CONSTRAINT IF EXISTS workshop_job_cards_status_check;

ALTER TABLE workshop_job_cards
ADD CONSTRAINT workshop_job_cards_status_check 
CHECK (status IN ('new', 'in_progress', 'completed', 'closed'));

-- Step 4: Verify the table structure
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'workshop_job_cards' 
-- ORDER BY ordinal_position;
