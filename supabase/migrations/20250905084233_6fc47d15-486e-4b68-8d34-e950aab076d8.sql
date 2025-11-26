-- Insert sample institutions first
INSERT INTO public.institutions (id, username, full_name, short_name, type, contact_person, contact_email, contact_phone, contact_id_type, contact_id_number, verified) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'huaxi_hospital', '四川大学华西医院', '华西医院', 'hospital', '张教授', 'zhang@huaxi.edu.cn', '028-85422286', 'national_id', '510100196001011234', true),
('550e8400-e29b-41d4-a716-446655440001', 'scu_medical', '四川大学医学院', '川大医学院', 'university', '李主任', 'li@scu.edu.cn', '028-85501234', 'national_id', '510100197001011234', true),
('550e8400-e29b-41d4-a716-446655440002', 'west_china_research', '华西医学中心', '华西医学中心', 'research_center', '王博士', 'wang@research.cn', '028-85503456', 'national_id', '510100198001011234', true);

-- Insert sample research subjects
INSERT INTO public.research_subjects (id, name, name_en, description, active) VALUES
('660e8400-e29b-41d4-a716-446655440000', '心血管疾病', 'Cardiovascular Disease', '心血管系统相关疾病研究', true),
('660e8400-e29b-41d4-a716-446655440001', '内分泌代谢', 'Endocrinology', '内分泌系统和代谢相关疾病研究', true),
('660e8400-e29b-41d4-a716-446655440002', '神经系统疾病', 'Neurological Disorders', '神经系统疾病相关研究', true),
('660e8400-e29b-41d4-a716-446655440003', '肿瘤学', 'Oncology', '肿瘤相关疾病研究', true);

-- Insert sample users (without supervisor relationships to avoid foreign key issues)
INSERT INTO public.users (id, username, real_name, email, phone, id_type, id_number, role, title, field, institution_id, education, supervisor_id) VALUES
-- Data providers
('11111111-1111-1111-1111-111111111111', 'zhang_prof', '张明华', 'zhang@huaxi.edu.cn', '13800138001', 'national_id', '510100197001011001', 'data_provider', '主任医师', '心血管内科', '550e8400-e29b-41d4-a716-446655440000', 'professor', NULL),
('22222222-2222-2222-2222-222222222222', 'li_director', '李晓红', 'li@scu.edu.cn', '13800138002', 'national_id', '510100197501011002', 'data_provider', '科主任', '内分泌科', '550e8400-e29b-41d4-a716-446655440001', 'professor', NULL),
('33333333-3333-3333-3333-333333333333', 'wang_researcher', '王建国', 'wang@research.cn', '13800138003', 'national_id', '510100198001011003', 'data_provider', '研究员', '神经科学', '550e8400-e29b-41d4-a716-446655440002', 'phd', NULL),
-- Researchers (set supervisors after all users are inserted)
('44444444-4444-4444-4444-444444444444', 'chen_student', '陈小明', 'chen@student.edu.cn', '13800138004', 'national_id', '510100199001011004', 'registered_researcher', '博士研究生', '生物统计学', '550e8400-e29b-41d4-a716-446655440001', 'phd', NULL),
('55555555-5555-5555-5555-555555555555', 'liu_researcher', '刘丽华', 'liu@huaxi.edu.cn', '13800138005', 'national_id', '510100198501011005', 'registered_researcher', '副研究员', '流行病学', '550e8400-e29b-41d4-a716-446655440000', 'master', NULL),
-- Platform admin
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin_user', '系统管理员', 'admin@platform.cn', '13800138000', 'national_id', '510100197001011000', 'platform_admin', '系统管理员', '信息管理', '550e8400-e29b-41d4-a716-446655440000', 'master', NULL);

-- Now update supervisor relationships
UPDATE public.users SET supervisor_id = '22222222-2222-2222-2222-222222222222' WHERE id = '44444444-4444-4444-4444-444444444444';
UPDATE public.users SET supervisor_id = '11111111-1111-1111-1111-111111111111' WHERE id = '55555555-5555-5555-5555-555555555555';