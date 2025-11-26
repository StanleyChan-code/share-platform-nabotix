-- Add share_all_data column to datasets table
ALTER TABLE public.datasets 
ADD COLUMN share_all_data boolean DEFAULT false;