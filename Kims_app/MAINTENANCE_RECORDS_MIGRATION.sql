-- Migration: Update maintenance_records table to support checklist data
-- This migration adds columns needed to store comprehensive maintenance checklist data

-- Step 1: Add missing columns to maintenance_records table
ALTER TABLE maintenance_records
ADD COLUMN IF NOT EXISTS checklist_id uuid REFERENCES maintenance_checklists(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS operator_name text,
ADD COLUMN IF NOT EXISTS maintenance_type text,
ADD COLUMN IF NOT EXISTS duration_minutes numeric,
ADD COLUMN IF NOT EXISTS completed_tasks jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_signed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fluid_checks jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS safety_checks jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS daily_maintenance_checks jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS work_area_checks jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS safe_operation_checks jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS machine_hours_at_service numeric;

-- Step 2: Verify the table structure
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'maintenance_records' 
-- ORDER BY ordinal_position;
