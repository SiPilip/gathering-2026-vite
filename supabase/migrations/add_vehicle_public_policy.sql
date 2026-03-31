-- Run di Supabase SQL Editor
-- Menambahkan policy SELECT pada table vehicles agar pengunjung publik bisa melihat nama kendaraan

CREATE POLICY "Public can view vehicles"
  ON public.vehicles FOR SELECT TO public USING (true);
