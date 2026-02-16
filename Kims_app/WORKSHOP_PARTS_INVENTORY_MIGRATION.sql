-- ============================================================
-- WORKSHOP PARTS INVENTORY MIGRATION
-- ============================================================
-- This migration adds columns for parts inventory management
-- with machine-specific parts tracking and service intervals

-- Add new columns for parts inventory (only if they don't exist)
ALTER TABLE workshop_inventory 
  ADD COLUMN IF NOT EXISTS machine_model text,
  ADD COLUMN IF NOT EXISTS unique_id text,
  ADD COLUMN IF NOT EXISTS plant_id text,
  ADD COLUMN IF NOT EXISTS nbl_code text,
  ADD COLUMN IF NOT EXISTS serial_number text,
  ADD COLUMN IF NOT EXISTS part_description text,
  ADD COLUMN IF NOT EXISTS service_interval text,
  ADD COLUMN IF NOT EXISTS part_number_oem text,
  ADD COLUMN IF NOT EXISTS part_number_aftermarket text,
  ADD COLUMN IF NOT EXISTS notes_capacities text;

-- Ensure quantity_on_hand is text type to support values like '1 Set', '1 Pair'
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workshop_inventory' 
    AND column_name = 'quantity_on_hand' 
    AND data_type != 'text'
  ) THEN
    ALTER TABLE workshop_inventory 
      ALTER COLUMN quantity_on_hand TYPE text USING quantity_on_hand::text;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workshop_inventory_unique_id ON workshop_inventory(unique_id);
CREATE INDEX IF NOT EXISTS idx_workshop_inventory_machine_model ON workshop_inventory(machine_model);
CREATE INDEX IF NOT EXISTS idx_workshop_inventory_plant_id ON workshop_inventory(plant_id);
CREATE INDEX IF NOT EXISTS idx_workshop_inventory_service_interval ON workshop_inventory(service_interval);
CREATE INDEX IF NOT EXISTS idx_workshop_inventory_nbl_code ON workshop_inventory(nbl_code);

-- Create a GIN index for full-text search on part descriptions
CREATE INDEX IF NOT EXISTS idx_workshop_inventory_part_search 
  ON workshop_inventory USING gin(to_tsvector('english', 
    COALESCE(part_description, '') || ' ' || 
    COALESCE(part_number_oem, '') || ' ' || 
    COALESCE(part_number_aftermarket, '')
  ));

-- Add comment to the table
COMMENT ON TABLE workshop_inventory IS 'Stores parts inventory with machine-specific service intervals';
