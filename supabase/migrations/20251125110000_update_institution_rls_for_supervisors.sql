-- Update institutions RLS policies to allow institution supervisors to view and update their own institutions

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Authenticated users can view basic institution info" ON public.institutions;
DROP POLICY IF EXISTS "Admins can view full institution details" ON public.institutions;
DROP POLICY IF EXISTS "Admins can update institutions" ON public.institutions;

-- Authenticated users can view verified institutions
CREATE POLICY "Authenticated users can view verified institutions"
ON public.institutions
FOR SELECT
TO authenticated
USING (verified = true);

-- Institution supervisors can view their own institution details
CREATE POLICY "Institution supervisors can view their own institution"
ON public.institutions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()
    AND users.institution_id = institutions.id
  )
);

-- Platform admins can view all institution details
CREATE POLICY "Platform admins can view all institution details"
ON public.institutions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'platform_admin'
  )
);

-- Institution supervisors can update their own institution
CREATE POLICY "Institution supervisors can update their own institution"
ON public.institutions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()
    AND users.id = institutions.user_id
    AND users.institution_id = institutions.id
  )
);

-- Platform admins can update all institutions
CREATE POLICY "Platform admins can update institutions"
ON public.institutions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'platform_admin'
  )
);

-- Platform admins can insert institutions
CREATE POLICY "Platform admins can insert institutions"
ON public.institutions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'platform_admin'
  )
);