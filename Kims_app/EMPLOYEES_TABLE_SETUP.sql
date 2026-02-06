-- ============================================================
-- EMPLOYEES TABLE AND MIGRATION
-- ============================================================
-- This SQL file creates/updates the employees table with all required columns
-- Run these commands in your Supabase SQL editor

-- Create the employees table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
  crew_id UUID REFERENCES public.crews(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add updated_by column if it doesn't exist (for existing tables)
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_crew_id ON public.employees(crew_id);

-- Enable RLS on employees table
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employees
CREATE POLICY "Everyone can view employees" ON public.employees
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert employees" ON public.employees
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update employees" ON public.employees
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only admins can delete employees" ON public.employees
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
