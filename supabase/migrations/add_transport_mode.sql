-- Migration: Add transport_mode to registrations
-- Run in Supabase SQL Editor

-- 1. Create enum
CREATE TYPE public.transport_mode AS ENUM ('BUS', 'OWN');

-- 2. Add column with default BUS
ALTER TABLE public.registrations
  ADD COLUMN transport_mode public.transport_mode NOT NULL DEFAULT 'BUS';
