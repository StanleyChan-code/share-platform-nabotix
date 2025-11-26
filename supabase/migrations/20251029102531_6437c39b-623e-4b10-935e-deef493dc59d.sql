-- Add principal_investigator field to datasets table
ALTER TABLE public.datasets 
ADD COLUMN principal_investigator TEXT;