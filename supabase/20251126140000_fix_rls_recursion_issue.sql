-- Fix infinite recursion in RLS policies by using SECURITY DEFINER functions

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Institution users can view profiles within their institution" ON public.users;
DROP POLICY IF EXISTS "Institution supervisors can update users within their institution" ON public.users;
DROP POLICY IF EXISTS "Institution supervisors can view their own institution" ON public.institutions;
DROP POLICY IF EXISTS "Institution supervisors can update their own institution" ON public.institutions;
DROP POLICY IF EXISTS "Institution supervisors can view datasets within their institution" ON public.datasets;
DROP POLICY IF EXISTS "Institution supervisors can update datasets within their institution" ON public.datasets;
DROP POLICY IF EXISTS "Institution supervisors can view applications within their institution" ON public.applications;
DROP POLICY IF EXISTS "Institution supervisors can view applications for institution datasets" ON public.applications;
DROP POLICY IF EXISTS "Institution supervisors can view outputs within their institution" ON public.research_outputs;
DROP POLICY IF EXISTS "Institution supervisors can update outputs within their institution" ON public.research_outputs;
DROP POLICY IF EXISTS "Institution supervisors can delete outputs within their institution" ON public.research_outputs;

-- Create a function to check if a user is an institution supervisor for a given institution
-- This avoids the recursive policy issue by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_institution_supervisor(institution_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
    AND institution_id = is_institution_supervisor.institution_id
    AND role = 'institution_supervisor'
  );
$$;

-- Create a function to get the institution_id for an institution supervisor
CREATE OR REPLACE FUNCTION public.get_institution_supervisor_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id
  FROM public.users
  WHERE id = auth.uid()
  AND role = 'institution_supervisor'
  LIMIT 1;
$$;

-- Recreate the policies using the functions to avoid recursion

-- Institution users can view each other's profiles
CREATE POLICY "Institution users can view profiles within their institution" 
ON public.users 
FOR SELECT 
USING (
  institution_id = public.get_institution_supervisor_id()
  AND public.get_institution_supervisor_id() IS NOT NULL
);

-- Institution supervisors can update users within their institution
CREATE POLICY "Institution supervisors can update users within their institution" 
ON public.users 
FOR UPDATE 
USING (
  institution_id = public.get_institution_supervisor_id()
  AND public.get_institution_supervisor_id() IS NOT NULL
);

-- Institution supervisors can view their own institution details
CREATE POLICY "Institution supervisors can view their own institution"
ON public.institutions
FOR SELECT
TO authenticated
USING (
  id = public.get_institution_supervisor_id()
  AND public.get_institution_supervisor_id() IS NOT NULL
);

-- Institution supervisors can update their own institution
CREATE POLICY "Institution supervisors can update their own institution"
ON public.institutions
FOR UPDATE
USING (
  id = public.get_institution_supervisor_id()
  AND public.get_institution_supervisor_id() IS NOT NULL
);

-- Institution supervisors can view datasets within their institution
CREATE POLICY "Institution supervisors can view datasets within their institution" 
ON public.datasets 
FOR SELECT 
USING (
  provider_id IN (
    SELECT id 
    FROM public.users 
    WHERE institution_id = public.get_institution_supervisor_id()
  )
  AND public.get_institution_supervisor_id() IS NOT NULL
);

-- Institution supervisors can update datasets within their institution
CREATE POLICY "Institution supervisors can update datasets within their institution" 
ON public.datasets 
FOR UPDATE 
USING (
  provider_id IN (
    SELECT id 
    FROM public.users 
    WHERE institution_id = public.get_institution_supervisor_id()
  )
  AND public.get_institution_supervisor_id() IS NOT NULL
);

-- Institution supervisors can view applications within their institution
CREATE POLICY "Institution supervisors can view applications within their institution" 
ON public.applications 
FOR SELECT 
USING (
  applicant_id IN (
    SELECT id 
    FROM public.users 
    WHERE institution_id = public.get_institution_supervisor_id()
  )
  AND public.get_institution_supervisor_id() IS NOT NULL
);

-- Institution supervisors can view applications for datasets within their institution
CREATE POLICY "Institution supervisors can view applications for institution datasets" 
ON public.applications 
FOR SELECT 
USING (
  dataset_id IN (
    SELECT id 
    FROM public.datasets 
    WHERE provider_id IN (
      SELECT id 
      FROM public.users 
      WHERE institution_id = public.get_institution_supervisor_id()
    )
  )
  AND public.get_institution_supervisor_id() IS NOT NULL
);

-- Institution supervisors can view research outputs within their institution
CREATE POLICY "Institution supervisors can view outputs within their institution"
ON public.research_outputs
FOR SELECT
USING (
  submitter_id IN (
    SELECT id 
    FROM public.users 
    WHERE institution_id = public.get_institution_supervisor_id()
  )
  AND public.get_institution_supervisor_id() IS NOT NULL
);

-- Institution supervisors can update outputs within their institution
CREATE POLICY "Institution supervisors can update outputs within their institution"
ON public.research_outputs
FOR UPDATE
USING (
  submitter_id IN (
    SELECT id 
    FROM public.users 
    WHERE institution_id = public.get_institution_supervisor_id()
  )
  AND public.get_institution_supervisor_id() IS NOT NULL
  AND (approved IS NULL OR approved = false)
);

-- Institution supervisors can delete outputs within their institution
CREATE POLICY "Institution supervisors can delete outputs within their institution"
ON public.research_outputs
FOR DELETE
USING (
  submitter_id IN (
    SELECT id 
    FROM public.users 
    WHERE institution_id = public.get_institution_supervisor_id()
  )
  AND public.get_institution_supervisor_id() IS NOT NULL
  AND (approved IS NULL OR approved = false)
);