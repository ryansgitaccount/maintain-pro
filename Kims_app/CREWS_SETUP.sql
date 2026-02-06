-- ============================================================
-- CREWS TABLE SETUP
-- ============================================================

-- Create crews table
CREATE TABLE IF NOT EXISTS public.crews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add crew_id column to maintenance_checklists (if not exists)
ALTER TABLE public.maintenance_checklists 
ADD COLUMN IF NOT EXISTS crew_id UUID REFERENCES public.crews(id) ON DELETE SET NULL;

-- Insert the existing crew names (you can modify/remove as needed)
INSERT INTO public.crews (name, description) VALUES 
  ('BBC', 'BBC Crew'),
  ('BGB', 'BGB Crew'),
  ('Boar', 'Boar Crew'),
  ('Boar Extra', 'Boar Extra Crew'),
  ('Bryant', 'Bryant Crew'),
  ('BSW', 'BSW Crew'),
  ('Bull', 'Bull Crew'),
  ('Chamois', 'Chamois Crew'),
  ('L9', 'L9 Crew'),
  ('NBL', 'NBL Crew'),
  ('Viking', 'Viking Crew'),
  ('Stag', 'Stag Crew')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on crews table
ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for crews
CREATE POLICY "Everyone can view crews" ON public.crews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert crews" ON public.crews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update crews" ON public.crews
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete crews" ON public.crews
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_crews_name ON public.crews(name);
