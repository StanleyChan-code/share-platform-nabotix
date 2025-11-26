-- Create a security definer function for public stats that bypasses RLS
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