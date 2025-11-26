-- Fix infinite recursion in user_roles RLS policies
-- The issue is that the admin policy tries to query user_roles table from within user_roles table policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Only existing admins can manage roles" ON public.user_roles;

-- Create a simpler admin policy that doesn't cause recursion
-- We'll use the has_role function that checks admin role without causing recursion
CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Also ensure the user_roles table has proper realtime enabled
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;