-- First, let's insert just the institutions and research subjects
INSERT INTO public.institutions (id, username, full_name, short_name, type, contact_person, contact_email, contact_phone, contact_id_type, contact_id_number, verified) 
VALUES
('550e8400-e29b-41d4-a716-446655440000', 'huaxi_hospital', '四川大学华西医院', '华西医院', 'hospital', '张教授', 'zhang@huaxi.edu.cn', '028-85422286', 'national_id', '510100196001011234', true),
('550e8400-e29b-41d4-a716-446655440001', 'scu_medical', '四川大学医学院', '川大医学院', 'university', '李主任', 'li@scu.edu.cn', '028-85501234', 'national_id', '510100197001011234', true),
('550e8400-e29b-41d4-a716-446655440002', 'west_china_research', '华西医学中心', '华西医学中心', 'research_center', '王博士', 'wang@research.cn', '028-85503456', 'national_id', '510100198001011234', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.research_subjects (id, name, name_en, description, active) 
VALUES
('660e8400-e29b-41d4-a716-446655440000', '心血管疾病', 'Cardiovascular Disease', '心血管系统相关疾病研究', true),
('660e8400-e29b-41d4-a716-446655440001', '内分泌代谢', 'Endocrinology', '内分泌系统和代谢相关疾病研究', true),
('660e8400-e29b-41d4-a716-446655440002', '神经系统疾病', 'Neurological Disorders', '神经系统疾病相关研究', true),
('660e8400-e29b-41d4-a716-446655440003', '肿瘤学', 'Oncology', '肿瘤相关疾病研究', true)
ON CONFLICT (id) DO NOTHING;