-- Add missing fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN region TEXT,
ADD COLUMN service_center TEXT,
ADD COLUMN active BOOLEAN DEFAULT true;