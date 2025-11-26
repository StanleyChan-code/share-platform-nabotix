-- Create admin user account
-- Note: This creates the user in auth.users and then creates the corresponding profile
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Insert into auth.users table directly (this is a special case for initial admin setup)
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
    ) VALUES (
        gen_random_uuid(),
        'admin@example.com',
        crypt('admin', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"real_name": "Administrator"}',
        false,
        'authenticated'
    )
    RETURNING id INTO admin_user_id;

    -- Insert corresponding profile in public.users table
    INSERT INTO public.users (
        id,
        username,
        real_name,
        email,
        phone,
        id_type,
        id_number,
        role
    ) VALUES (
        admin_user_id,
        'admin',
        'Administrator',
        'admin@example.com',
        '000-0000-0000',
        'national_id',
        'ADMIN001',
        'platform_admin'
    );
END $$;