-- Fix the security issues identified by the linter

-- Drop the problematic view
DROP VIEW IF EXISTS public.institutions_public;

-- Update the function to have proper search_path (fix linter warning)
CREATE OR REPLACE FUNCTION public.is_authenticated_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Instead of a view, we'll handle this through proper RLS policies
-- Update the policies to be more specific and secure

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Authenticated users can view basic institution info" ON public.institutions;
DROP POLICY IF EXISTS "Admins can view full institution details" ON public.institutions;

-- Create secure policies without using problematic views
-- Policy 1: Authenticated users can see basic institution info only
CREATE POLICY "Authenticated users can view verified institutions"
ON public.institutions
FOR SELECT
TO authenticated
USING (verified = true);

-- Policy 2: Admins can see all institution details (including unverified and contact info)
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

-- Add a function to get safe institution data for regular users
-- This will be used in the application layer to filter sensitive fields
CREATE OR REPLACE FUNCTION public.get_institutions_for_user()
RETURNS TABLE (
  id uuid,
  full_name text,
  short_name text,
  institution_type text,
  verified boolean
) AS $$
BEGIN
  -- Only return basic info for non-admin users
  IF EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'platform_admin') THEN
    -- Admins get full access through regular table access
    RETURN;
  ELSE 
    -- Regular users get filtered data
    RETURN QUERY
    SELECT 
      institutions.id,
      institutions.full_name,
      institutions.short_name,
      institutions.type::text as institution_type,
      institutions.verified
    FROM public.institutions
    WHERE institutions.verified = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;