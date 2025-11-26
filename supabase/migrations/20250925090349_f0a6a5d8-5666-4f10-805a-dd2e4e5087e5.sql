-- Create profile for 17353031@qq.com and make them platform_admin
INSERT INTO public.users (id, email, real_name, role, id_type, id_number, phone, username)
SELECT 
    au.id, 
    au.email, 
    COALESCE(au.raw_user_meta_data->>'real_name', 'Administrator'),
    'platform_admin'::user_role,
    'passport'::id_type,
    '000000000000000000',
    '00000000000',
    'admin'
FROM auth.users au
WHERE au.email = '17353031@qq.com' 
AND NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id);