-- Script Update Kapasitas Kamar
-- Jika tabel rooms sudah telanjur dibuat, jalankan script ini di SQL Editor Supabase

-- 1. Update semua kamar yang sudah ter-generate agar kapasitasnya jadi 8
UPDATE public.rooms 
SET capacity = 8;

-- 2. Mengubah setelan default tabel agar setiap kamar baru kedepannya berkapasitas 8
ALTER TABLE public.rooms 
ALTER COLUMN capacity SET DEFAULT 8;
