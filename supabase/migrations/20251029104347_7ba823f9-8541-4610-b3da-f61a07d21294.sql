-- Create enum for applicant role
CREATE TYPE public.applicant_role AS ENUM (
  'team_researcher',
  'collaborative_researcher'
);

-- Add applicant_role column to applications table
ALTER TABLE public.applications
ADD COLUMN applicant_role applicant_role NOT NULL DEFAULT 'team_researcher';

-- Add applicant_type column for sub-type (employee or student)
ALTER TABLE public.applications
ADD COLUMN applicant_type text;