-- Migration: Create donors table
-- Run this in Supabase SQL Editor

CREATE TABLE public.donors (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  amount     numeric     NOT NULL DEFAULT 0,
  notes      text,
  donated_at date        NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT donors_pkey PRIMARY KEY (id)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER donors_updated_at
  BEFORE UPDATE ON public.donors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (same pattern as other tables)
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;

-- Allow authenticated (admin) users full access
CREATE POLICY "Admin can manage donors"
  ON public.donors
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow public read (optional — remove if not needed)
CREATE POLICY "Public can view donors"
  ON public.donors
  FOR SELECT
  TO anon
  USING (true);
