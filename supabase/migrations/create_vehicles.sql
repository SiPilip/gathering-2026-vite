-- Migration: Add Vehicles and Passenger mapping
-- Run in Supabase SQL Editor

-- 1. Create table `vehicles`
CREATE TABLE public.vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL, -- e.g. "Mobil Pak Budi", "Avanza Hitam"
  capacity integer NOT NULL DEFAULT 4,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vehicles_pkey PRIMARY KEY (id)
);

-- 2. Add vehicle_id to registrations (for INDIVIDUAL or Reps acting as Individuals)
ALTER TABLE public.registrations
  ADD COLUMN vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL;

-- 3. Add vehicle_id to family_members (allowing splitting family members across cars)
ALTER TABLE public.family_members
  ADD COLUMN vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage vehicles"
  ON public.vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Auto updated_at for vehicles
CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
