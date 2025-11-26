-- Update the admin user role to platform_admin
UPDATE public.users 
SET role = 'platform_admin' 
WHERE email = 'admin@example.com';