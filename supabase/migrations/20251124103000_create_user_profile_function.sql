-- Create a function to allow admins to create user profiles
-- This bypasses RLS restrictions by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.create_institution_user_profile(
  user_id uuid,
  user_username text,
  user_real_name text,
  user_email text,
  user_phone text,
  user_id_type public.id_type,
  user_id_number text,
  user_institution_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is a platform admin
  IF NOT public.has_role(auth.uid(), 'platform_admin') THEN
    RAISE EXCEPTION 'Only platform admins can create user profiles';
  END IF;
  
  -- Insert the user profile
  INSERT INTO public.users (
    id,
    username,
    real_name,
    email,
    phone,
    id_type,
    id_number,
    institution_id
  ) VALUES (
    user_id,
    user_username,
    user_real_name,
    user_email,
    user_phone,
    user_id_type,
    user_id_number,
    user_institution_id
  );
  
  -- Also insert the role into user_roles table
  INSERT INTO public.user_roles (
    user_id,
    role,
    created_by
  ) VALUES (
    user_id,
    'institution_supervisor',
    auth.uid()
  );
END;
$$;

-- Grant execute permission to authenticated users
-- The function itself checks for admin privileges
GRANT EXECUTE ON FUNCTION public.create_institution_user_profile TO authenticated;