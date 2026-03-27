-- Migration: Add shirt_size to registrations and family_members
-- Run this in Supabase SQL Editor

-- 1. Create enum type for shirt sizes (Kaos 30 Dewasa + Anak)
CREATE TYPE public.shirt_size AS ENUM (
  'S', 'M', 'L', 'XL', 'XXL', 'XXXL',                          -- Kaos 30 Dewasa
  'ANAK_2', 'ANAK_4', 'ANAK_6', 'ANAK_8', 'ANAK_10', 'ANAK_13' -- Anak
);

-- 2. Add shirt_size to registrations (for the representative/individual)
ALTER TABLE public.registrations
  ADD COLUMN shirt_size public.shirt_size NOT NULL DEFAULT 'M';

-- 3. Add shirt_size to family_members (for each family member)
ALTER TABLE public.family_members
  ADD COLUMN shirt_size public.shirt_size NOT NULL DEFAULT 'M';
