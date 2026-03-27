-- Migration: Add shirt_size to registrations and family_members
-- Run this in Supabase SQL Editor

-- 1. Create enum type for shirt sizes
CREATE TYPE public.shirt_size AS ENUM ('S', 'M', 'L', 'XL', '2XL', '3XL', '4XL');

-- 2. Add shirt_size column to registrations table (for the representative/individual)
ALTER TABLE public.registrations
  ADD COLUMN shirt_size public.shirt_size NOT NULL DEFAULT 'M';

-- 3. Add shirt_size column to family_members table (for each family member)
ALTER TABLE public.family_members
  ADD COLUMN shirt_size public.shirt_size NOT NULL DEFAULT 'M';
