-- ============================================
-- CRITICAL SECURITY FIX: Separate User Roles Table
-- ============================================
-- This migration fixes privilege escalation vulnerabilities by:
-- 1. Creating a separate user_roles table with proper RLS
-- 2. Implementing secure role checking via SECURITY DEFINER function
-- 3. Updating all RLS policies to use the secure function
-- 4. Migrating existing valid role data

-- Create user_roles table for secure role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can manage roles (prevents privilege escalation)
CREATE POLICY "Only existing admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'platform_admin'
  )
);

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Create secure role checking function (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Update is_admin() to use the secure user_roles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'platform_admin');
$$;

-- Migrate existing role data from users table to user_roles table
-- Only migrate users that exist in auth.users
INSERT INTO public.user_roles (user_id, role, created_by)
SELECT u.id, u.role, u.id
FROM public.users u
INNER JOIN auth.users au ON u.id = au.id
WHERE u.role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Update RLS policies to use secure has_role function

-- Applications table policies
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;
CREATE POLICY "Admins can view all applications"
ON public.applications
FOR SELECT
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Add missing UPDATE policy for admins on applications
CREATE POLICY "Admins can update applications"
ON public.applications
FOR UPDATE
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Add missing DELETE policy for admins on applications
CREATE POLICY "Admins can delete applications"
ON public.applications
FOR DELETE
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Datasets table policies
DROP POLICY IF EXISTS "Admins can view all datasets" ON public.datasets;
CREATE POLICY "Admins can view all datasets"
ON public.datasets
FOR SELECT
USING (public.has_role(auth.uid(), 'platform_admin'));

DROP POLICY IF EXISTS "Admins can update all datasets" ON public.datasets;
CREATE POLICY "Admins can update all datasets"
ON public.datasets
FOR UPDATE
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Add missing DELETE policy for admins on datasets
CREATE POLICY "Admins can delete datasets"
ON public.datasets
FOR DELETE
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Users table policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Audit logs table policies
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Institutions table policies
DROP POLICY IF EXISTS "Platform admins can view all institution details" ON public.institutions;
CREATE POLICY "Platform admins can view all institution details"
ON public.institutions
FOR SELECT
USING (public.has_role(auth.uid(), 'platform_admin'));

DROP POLICY IF EXISTS "Only admins can update institutions" ON public.institutions;
CREATE POLICY "Only admins can update institutions"
ON public.institutions
FOR UPDATE
USING (public.has_role(auth.uid(), 'platform_admin'));

DROP POLICY IF EXISTS "Only admins can insert institutions" ON public.institutions;
CREATE POLICY "Only admins can insert institutions"
ON public.institutions
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

-- Research subjects table policies
DROP POLICY IF EXISTS "Only admins can manage research subjects" ON public.research_subjects;
CREATE POLICY "Only admins can manage research subjects"
ON public.research_subjects
FOR ALL
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Add missing UPDATE/DELETE policies for research_outputs
CREATE POLICY "Submitters can update their own outputs"
ON public.research_outputs
FOR UPDATE
USING (submitter_id = auth.uid());

CREATE POLICY "Submitters can delete their own outputs"
ON public.research_outputs
FOR DELETE
USING (submitter_id = auth.uid());

CREATE POLICY "Admins can update all outputs"
ON public.research_outputs
FOR UPDATE
USING (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Admins can delete all outputs"
ON public.research_outputs
FOR DELETE
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Add comment explaining role column deprecation
COMMENT ON COLUMN public.users.role IS 'DEPRECATED: Use user_roles table for role management. This column is kept for backward compatibility only.';