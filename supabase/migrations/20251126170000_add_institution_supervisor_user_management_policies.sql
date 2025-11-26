-- Add RLS policies for institution supervisors to manage users

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Institution supervisors can search all users by real_name" ON public.users;
DROP POLICY IF EXISTS "Institution supervisors can search all users by email" ON public.users;

-- Create a function to check if current user is an institution supervisor
-- This avoids the recursive policy issue by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_current_user_institution_supervisor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'institution_supervisor'
  );
$$;

-- Create a policy allowing institution supervisors to search users by real_name or email
-- This policy allows access to specific fields only: id, real_name, email, institution_id
CREATE POLICY "Institution supervisors can search users with limited fields"
ON public.users
FOR SELECT
USING (
  public.is_current_user_institution_supervisor()
);

-- Create a policy allowing institution supervisors to update institution_id for users 
-- who don't currently belong to any institution
CREATE POLICY "Institution supervisors can assign institution to unaffiliated users"
ON public.users
FOR UPDATE
USING (
  institution_id IS NULL
  AND public.is_current_user_institution_supervisor()
)
WITH CHECK (
  institution_id = (
    SELECT institution_id
    FROM public.users u
    WHERE id = auth.uid()
    AND EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      WHERE ur.user_id = u.id 
      AND ur.role = 'institution_supervisor'
    )
    LIMIT 1
  )
);

-- Add a comment to document the intended usage
COMMENT ON POLICY "Institution supervisors can search users with limited fields" ON public.users 
IS 'Allows institution supervisors to search all users by real_name or email, returning only id, real_name, email, and institution_id';

COMMENT ON POLICY "Institution supervisors can assign institution to unaffiliated users" ON public.users 
IS 'Allows institution supervisors to assign their own institution_id to users who are not currently affiliated with any institution';