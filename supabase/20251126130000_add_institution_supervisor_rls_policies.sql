-- Update RLS policies to allow institution supervisors to view and manage records within their own institution

-- Drop existing policies that need to be updated
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Providers can view their own datasets" ON public.datasets;
DROP POLICY IF EXISTS "Users can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Providers can view applications for their datasets" ON public.applications;
DROP POLICY IF EXISTS "Submitters can view their own outputs" ON public.research_outputs;
DROP POLICY IF EXISTS "Approved research outputs are viewable by everyone" ON public.research_outputs;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT
                                             USING (auth.uid() = id);

-- Users from the same institution can view each other's profiles
CREATE POLICY "Institution users can view profiles within their institution" 
ON public.users 
FOR SELECT
               USING (
               institution_id IN (
               SELECT institution_id
               FROM public.users
               WHERE id = auth.uid()
               AND role = 'institution_supervisor'
               )
               AND EXISTS (
               SELECT 1
               FROM public.users
               WHERE id = auth.uid()
               AND role = 'institution_supervisor'
               )
               );

-- Institution supervisors can update users within their institution
CREATE POLICY "Institution supervisors can update users within their institution"
ON public.users
FOR UPDATE
               USING (
               institution_id IN (
               SELECT institution_id
               FROM public.users
               WHERE id = auth.uid()
               AND role = 'institution_supervisor'
               )
               AND EXISTS (
               SELECT 1
               FROM public.users
               WHERE id = auth.uid()
               AND role = 'institution_supervisor'
               )
               );


-- Providers can view their own datasets
CREATE POLICY "Providers can view their own datasets"
ON public.datasets
FOR SELECT
               USING (provider_id = auth.uid());

-- Institution supervisors can view datasets within their institution
CREATE POLICY "Institution supervisors can view datasets within their institution"
ON public.datasets
FOR SELECT
               USING (
               provider_id IN (
               SELECT id
               FROM public.users
               WHERE institution_id IN (
               SELECT institution_id
               FROM public.users
               WHERE id = auth.uid()
               AND role = 'institution_supervisor'
               )
               )
               AND EXISTS (
               SELECT 1
               FROM public.users
               WHERE id = auth.uid()
               AND role = 'institution_supervisor'
               )
               );


-- Institution supervisors can update datasets within their institution
CREATE POLICY "Institution supervisors can update datasets within their institution"
ON public.datasets
FOR UPDATE
               USING (
               provider_id IN (
               SELECT id
               FROM public.users
               WHERE institution_id IN (
               SELECT institution_id
               FROM public.users
               WHERE id = auth.uid()
               AND role = 'institution_supervisor'
               )
               )
               AND EXISTS (
               SELECT 1
               FROM public.users
               WHERE id = auth.uid()
               AND role = 'institution_supervisor'
               )
               );


-- Users can view their own applications
CREATE POLICY "Users can view their own applications"
ON public.applications
FOR SELECT
               USING (applicant_id = auth.uid());

-- Institution supervisors can view applications within their institution
CREATE POLICY "Institution supervisors can view applications within their institution"
ON public.applications
FOR SELECT
               USING (
               applicant_id IN (
               SELECT id
               FROM public.users
               WHERE institution_id IN (
               SELECT institution_id
               FROM public.users
               WHERE id = auth.uid()
               AND role = 'institution_supervisor'
               )
               )
               AND EXISTS (
               SELECT 1
               FROM public.users
               WHERE id = auth.uid()
               AND role = 'institution_supervisor'
               )
               );

-- Providers can view applications for their datasets
CREATE POLICY "Providers can view applications for their datasets"
ON public.applications
FOR SELECT
               USING (
               EXISTS (
               SELECT 1
               FROM public.datasets
               WHERE datasets.id = dataset_id
               AND datasets.provider_id = auth.uid()
               )
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
               WHERE institution_id IN (
               SELECT institution_id
               FROM public.users
               WHERE id = auth.uid()
               AND role = 'institution_supervisor'
               )
               )
               )
               AND EXISTS (
               SELECT 1
               FROM public.users
               WHERE id = auth.uid()
               AND role = 'institution_supervisor'
               )
               );


-- Approved research outputs are viewable by everyone
CREATE POLICY "Approved research outputs are viewable by everyone"
ON public.research_outputs
FOR SELECT
               USING (approved = true OR submitter_id = auth.uid() OR public.has_role(auth.uid(), 'platform_admin'));

-- Submitters can view their own research outputs regardless of approval status
CREATE POLICY "Submitters can view their own outputs"
ON public.research_outputs
FOR SELECT
               USING (submitter_id = auth.uid());

-- Institution supervisors can view research outputs within their institution
CREATE POLICY "Institution supervisors can view outputs within their institution"
ON public.research_outputs
FOR SELECT
               USING (
               submitter_id IN (
               SELECT id
               FROM public.users
               WHERE institution_id IN (
               SELECT institution_id
               FROM public.users
               WHERE id = auth.uid()
               AND role = 'institution_supervisor'
               )
               )
               AND EXISTS (
               SELECT 1
               FROM public.users
               WHERE id = auth.uid()
               AND role = 'institution_supervisor'
               )
               );


-- Submitters can update their own unapproved outputs
CREATE POLICY "Submitters can update their own unapproved outputs"
ON public.research_outputs
FOR UPDATE
               USING (submitter_id = auth.uid() AND (approved IS NULL OR approved = false));

-- Institution supervisors can update outputs within their institution
CREATE POLICY "Institution supervisors can update outputs within their institution"
ON public.research_outputs
FOR UPDATE
               USING (
               submitter_id IN (
               SELECT id
               FROM public.users
               WHERE institution_id IN (
               SELECT institution_id
               FROM public.users
               WHERE id = auth.uid()
               AND role = 'institution_supervisor'
               )
               )
               AND EXISTS (
               SELECT 1
               FROM public.users
               WHERE id = auth.uid()
               AND role = 'institution_supervisor'
               )
               AND (approved IS NULL OR approved = false)
               );

-- Submitters can delete their own unapproved outputs
CREATE POLICY "Submitters can delete their own unapproved outputs"
ON public.research_outputs
FOR DELETE
USING (submitter_id = auth.uid() AND (approved IS NULL OR approved = false));

-- Institution supervisors can delete outputs within their institution
CREATE POLICY "Institution supervisors can delete outputs within their institution"
ON public.research_outputs
FOR DELETE
USING (
  submitter_id IN (
    SELECT id
    FROM public.users
    WHERE institution_id IN (
      SELECT institution_id
      FROM public.users
      WHERE id = auth.uid()
      AND role = 'institution_supervisor'
    )
  )
  AND EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role = 'institution_supervisor'
  )
  AND (approved IS NULL OR approved = false)
);
