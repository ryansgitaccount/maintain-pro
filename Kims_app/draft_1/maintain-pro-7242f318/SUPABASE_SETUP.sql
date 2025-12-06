-- ============================================================
-- SUPABASE SCHEMA SETUP FOR MAINTENANCE HUB
-- ============================================================
-- This SQL file creates the necessary tables for the Maintenance Hub application.
-- Run these commands in your Supabase SQL editor (Dashboard > SQL Editor > New Query)

-- ============================================================
-- 1. MACHINES TABLE
-- ============================================================
CREATE TABLE machines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plant_id text NOT NULL,
  model text NOT NULL,
  manufacturer text,
  serial_number text,
  status text DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'broken', 'needs_service')),
  crew_name text,
  last_service_date timestamp with time zone,
  last_service_hours numeric DEFAULT 0,
  service_interval_hours numeric DEFAULT 200,
  current_operating_hours numeric DEFAULT 0,
  machine_type text DEFAULT 'feller_buncher',
  notes jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- 2. MAINTENANCE RECORDS TABLE
-- ============================================================
CREATE TABLE maintenance_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id uuid NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  crew_name text,
  description text,
  hours_worked numeric,
  work_type text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- 3. MAINTENANCE ISSUES TABLE
-- ============================================================
CREATE TABLE maintenance_issues (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id uuid NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  maintenance_record_id uuid REFERENCES maintenance_records(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  crew_name text,
  created_date timestamp with time zone DEFAULT now(),
  resolved_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- 4. MAINTENANCE CHECKLISTS TABLE
-- ============================================================
CREATE TABLE maintenance_checklists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  items jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- 5. MESSAGES TABLE
-- ============================================================
CREATE TABLE messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  author text,
  machine_id uuid REFERENCES machines(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- 6. TAKE5 RECORDS TABLE
-- ============================================================
CREATE TABLE take5_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_name text,
  hazards text,
  controls text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- 7. WORKSHOP JOB CARDS TABLE
-- ============================================================
CREATE TABLE workshop_job_cards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id uuid NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  crew_name text,
  job_description text,
  parts_required jsonb DEFAULT '[]'::jsonb,
  date_reported timestamp with time zone,
  date_completed timestamp with time zone,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'closed')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- 8. WORKSHOP INVENTORY TABLE
-- ============================================================
CREATE TABLE workshop_inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  part_name text NOT NULL,
  part_number text,
  quantity integer DEFAULT 0,
  reorder_level integer DEFAULT 5,
  supplier text,
  cost numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- 9. SERVICE CARDS TABLE
-- ============================================================
CREATE TABLE service_cards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id uuid NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  service_date timestamp with time zone,
  service_type text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- 10. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text,
  machine_id uuid REFERENCES machines(id) ON DELETE CASCADE,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_machines_status ON machines(status);
CREATE INDEX idx_machines_crew_name ON machines(crew_name);
CREATE INDEX idx_maintenance_records_machine_id ON maintenance_records(machine_id);
CREATE INDEX idx_maintenance_records_completed_at ON maintenance_records(completed_at);
CREATE INDEX idx_maintenance_issues_machine_id ON maintenance_issues(machine_id);
CREATE INDEX idx_maintenance_issues_status ON maintenance_issues(status);
CREATE INDEX idx_workshop_job_cards_machine_id ON workshop_job_cards(machine_id);
CREATE INDEX idx_workshop_job_cards_status ON workshop_job_cards(status);
CREATE INDEX idx_notifications_read ON notifications(read);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
-- Enable RLS on all tables
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE take5_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data
CREATE POLICY "Enable read access for authenticated users" ON machines
  FOR SELECT USING (auth.role() = 'authenticated_user');

CREATE POLICY "Enable read access for authenticated users" ON maintenance_records
  FOR SELECT USING (auth.role() = 'authenticated_user');

CREATE POLICY "Enable read access for authenticated users" ON maintenance_issues
  FOR SELECT USING (auth.role() = 'authenticated_user');

CREATE POLICY "Enable read access for authenticated users" ON maintenance_checklists
  FOR SELECT USING (auth.role() = 'authenticated_user');

CREATE POLICY "Enable read access for authenticated users" ON messages
  FOR SELECT USING (auth.role() = 'authenticated_user');

CREATE POLICY "Enable read access for authenticated users" ON take5_records
  FOR SELECT USING (auth.role() = 'authenticated_user');

CREATE POLICY "Enable read access for authenticated users" ON workshop_job_cards
  FOR SELECT USING (auth.role() = 'authenticated_user');

CREATE POLICY "Enable read access for authenticated users" ON workshop_inventory
  FOR SELECT USING (auth.role() = 'authenticated_user');

CREATE POLICY "Enable read access for authenticated users" ON service_cards
  FOR SELECT USING (auth.role() = 'authenticated_user');

CREATE POLICY "Enable read access for authenticated users" ON notifications
  FOR SELECT USING (auth.role() = 'authenticated_user');

-- Allow authenticated users to insert/update their own data
CREATE POLICY "Enable insert for authenticated users" ON machines
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Enable update for authenticated users" ON machines
  FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Enable insert for authenticated users" ON maintenance_records
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Enable update for authenticated users" ON maintenance_records
  FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Enable insert for authenticated users" ON maintenance_issues
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Enable update for authenticated users" ON maintenance_issues
  FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Enable insert for authenticated users" ON workshop_job_cards
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Enable update for authenticated users" ON workshop_job_cards
  FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

-- ============================================================
-- STORAGE BUCKETS FOR FILE UPLOADS
-- ============================================================
-- Create storage buckets via Supabase dashboard:
-- 1. Create bucket: "files" (public)
-- 2. Create bucket: "private-files" (private)
-- Then set CORS policy to allow your domain
