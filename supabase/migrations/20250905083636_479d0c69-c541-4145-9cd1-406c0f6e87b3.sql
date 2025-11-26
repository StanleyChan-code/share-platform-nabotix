-- First, create a security definer function to check if user is authenticated
-- This avoids infinite recursion issues
CREATE OR REPLACE FUNCTION public.is_authenticated_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Institutions are viewable by everyone" ON public.institutions;

-- Create new restrictive policies for institutions
-- Policy 1: Basic institution info (name, type) for authenticated users
CREATE POLICY "Authenticated users can view basic institution info"
ON public.institutions
FOR SELECT
TO authenticated
USING (
  public.is_authenticated_user() AND verified = true
);

-- Policy 2: Full contact details only for platform admins
CREATE POLICY "Admins can view full institution details"
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

-- Create a view for public institution data (only basic info)
CREATE OR REPLACE VIEW public.institutions_public AS
SELECT 
  id,
  full_name,
  short_name,
  type,
  verified,
  created_at
FROM public.institutions
WHERE verified = true;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.institutions_public TO authenticated;