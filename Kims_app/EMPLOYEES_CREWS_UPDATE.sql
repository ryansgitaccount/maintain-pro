-- ============================================================
-- ADD CREW_ID TO EMPLOYEES TABLE
-- ============================================================

-- Add crew_id column to employees table (if not exists)
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS crew_id UUID REFERENCES public.crews(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_crew_id ON public.employees(crew_id);
