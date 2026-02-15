-- ============================================================
-- WORKSHOP INVENTORY TABLE MIGRATION
-- ============================================================
-- This migration updates the workshop_inventory table to add
-- missing columns and rename existing ones to match the application

-- Add new columns
ALTER TABLE workshop_inventory 
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS machine_id uuid REFERENCES machines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS machine_type text;

-- Rename quantity to quantity_on_hand
ALTER TABLE workshop_inventory 
  RENAME COLUMN quantity TO quantity_on_hand;

-- Rename cost to cost_per_unit
ALTER TABLE workshop_inventory 
  RENAME COLUMN cost TO cost_per_unit;

-- Create an index on machine_id for better query performance
CREATE INDEX IF NOT EXISTS idx_workshop_inventory_machine_id ON workshop_inventory(machine_id);

-- Create an index on machine_type for filtering
CREATE INDEX IF NOT EXISTS idx_workshop_inventory_machine_type ON workshop_inventory(machine_type);
