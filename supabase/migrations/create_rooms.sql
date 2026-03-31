-- Migration: Create Rooms and Passenger mapping
-- Run in Supabase SQL Editor

-- 1. Create table `rooms`
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,        -- e.g. "Boni Atas 01"
  building text NOT NULL,    -- e.g. "Boni", "Yosef"
  floor text NOT NULL,       -- e.g. "Atas", "Bawah"
  capacity integer NOT NULL DEFAULT 4,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rooms_pkey PRIMARY KEY (id)
);

-- 2. Add room_id to registrations 
ALTER TABLE public.registrations
  ADD COLUMN room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL;

-- 3. Add room_id to family_members 
ALTER TABLE public.family_members
  ADD COLUMN room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL;

-- 4. Enable RLS and Policies for rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage rooms"
  ON public.rooms FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can view rooms"
  ON public.rooms FOR SELECT TO public USING (true);

-- Auto updated_at trigger for rooms
CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Seeding Data (Insert 52 Kamar Otomatis)
DO $$ 
DECLARE
    i integer;
BEGIN
    -- Gedung Boni Kanan: Atas 16 kamar
    FOR i IN 1..16 LOOP
        INSERT INTO public.rooms (name, building, floor, capacity) 
        VALUES ('Boni Atas ' || lpad(i::text, 2, '0'), 'Boni', 'Atas', 4);
    END LOOP;
    
    -- Gedung Boni Kanan: Bawah 12 kamar
    FOR i IN 1..12 LOOP
        INSERT INTO public.rooms (name, building, floor, capacity) 
        VALUES ('Boni Bawah ' || lpad(i::text, 2, '0'), 'Boni', 'Bawah', 4);
    END LOOP;
    
    -- Gedung Yosef Kiri: Atas 12 kamar
    FOR i IN 1..12 LOOP
        INSERT INTO public.rooms (name, building, floor, capacity) 
        VALUES ('Yosef Atas ' || lpad(i::text, 2, '0'), 'Yosef', 'Atas', 4);
    END LOOP;
    
    -- Gedung Yosef Kiri: Bawah 12 kamar
    FOR i IN 1..12 LOOP
        INSERT INTO public.rooms (name, building, floor, capacity) 
        VALUES ('Yosef Bawah ' || lpad(i::text, 2, '0'), 'Yosef', 'Bawah', 4);
    END LOOP;
END $$;
