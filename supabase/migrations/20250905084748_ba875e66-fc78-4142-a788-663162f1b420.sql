-- Try inserting one user at a time to identify the issue
-- Let's use simpler UUIDs that might not conflict

INSERT INTO public.users (
  id, 
  username, 
  real_name, 
  email, 
  phone, 
  id_type, 
  id_number, 
  role, 
  title, 
  field, 
  institution_id, 
  education,
  supervisor_id
) VALUES (
  gen_random_uuid(),
  'zhang_prof', 
  '张明华', 
  'zhang@huaxi.edu.cn', 
  '13800138001', 
  'national_id', 
  '510100197001011001', 
  'data_provider', 
  '主任医师', 
  '心血管内科', 
  '550e8400-e29b-41d4-a716-446655440000', 
  'professor',
  NULL
);