-- Allow anyone to count users without exposing user data
-- This enables dashboard stats while maintaining privacy
CREATE POLICY "Anyone can count users" 
ON public.users 
FOR SELECT 
USING (false) -- This ensures no actual rows are returned
WITH CHECK (false); -- This is for consistency, though not used for SELECT

-- Actually, let's use a better approach - create a security definer function for public stats
DROP POLICY IF EXISTS "Anyone can count users" ON public.users;

-- Create a function that returns public statistics without exposing user data
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'users_count', (SELECT COUNT(*) FROM users),
    'datasets_count', (SELECT COUNT(*) FROM datasets WHERE published = true AND approved = true),
    'applications_count', (SELECT COUNT(*) FROM applications),
    'outputs_count', (SELECT COUNT(*) FROM research_outputs)
  );
$$;