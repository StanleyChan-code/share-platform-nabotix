-- Simply promote an existing user to platform_admin
UPDATE public.users 
SET role = 'platform_admin' 
WHERE email = 'zhang@example.com';