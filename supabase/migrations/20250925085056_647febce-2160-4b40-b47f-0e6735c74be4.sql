-- Delete the existing admin user that was created incorrectly
DELETE FROM public.users WHERE email = 'admin@example.com';
DELETE FROM auth.users WHERE email = 'admin@example.com';

-- We'll create the admin user properly through the application signup flow instead
-- This comment serves as a placeholder for the migration