-- Fix infinite recursion in users table RLS policies
-- The issue is that the admin policy tries to query users table from within users table policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Create a simpler admin policy that doesn't cause recursion
-- We'll use a function that checks admin role without causing recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'platform_admin'
  );
$$;

-- Create new admin policy using the function
CREATE POLICY "Admins can view all users" 
ON public.users 
FOR SELECT 
USING (public.is_admin());

-- Also ensure the users table has proper realtime enabled
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.datasets REPLICA IDENTITY FULL;
ALTER TABLE public.applications REPLICA IDENTITY FULL;
ALTER TABLE public.research_outputs REPLICA IDENTITY FULL;