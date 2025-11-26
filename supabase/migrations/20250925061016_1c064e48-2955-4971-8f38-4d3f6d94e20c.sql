-- Temporarily disable foreign key constraint to add sample data
-- This is for demonstration purposes only
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Insert sample users
INSERT INTO public.users (id, id_type, role, username, real_name, id_number, phone, email, title, field, education) VALUES
-- Platform Admin
('00000000-0000-0000-0000-000000000001', 'national_id', 'platform_admin', 'admin001', '张伟', '110101199001011234', '13800138001', 'admin@example.com', '平台管理员', '计算机科学', 'phd'),

-- Data Providers  
('00000000-0000-0000-0000-000000000002', 'national_id', 'data_provider', 'provider001', '李明', '110101198502152345', '13800138002', 'li.ming@university.edu.cn', '教授', '生物医学', 'phd'),
('00000000-0000-0000-0000-000000000003', 'national_id', 'data_provider', 'provider002', '王丽华', '110101198703203456', '13800138003', 'wang.lihua@research.org.cn', '研究员', '心理学', 'phd'),
('00000000-0000-0000-0000-000000000004', 'passport', 'data_provider', 'provider003', '陈晓东', 'G12345678', '13800138004', 'chen.xiaodong@hospital.com.cn', '主任医师', '临床医学', 'phd'),

-- Registered Researchers
('00000000-0000-0000-0000-000000000005', 'national_id', 'registered_researcher', 'researcher001', '刘芳', '110101199205104567', '13800138005', 'liu.fang@student.edu.cn', '博士研究生', '数据科学', 'phd'),
('00000000-0000-0000-0000-000000000006', 'national_id', 'registered_researcher', 'researcher002', '赵建国', '110101198901156789', '13800138006', 'zhao.jianguo@company.com', '数据分析师', '统计学', 'master'),
('00000000-0000-0000-0000-000000000007', 'other', 'registered_researcher', 'researcher003', '孙美丽', '2020123456', '13800138007', 'sun.meili@university.edu.cn', '硕士研究生', '社会学', 'master'),
('00000000-0000-0000-0000-000000000008', 'national_id', 'registered_researcher', 'researcher004', '周强', '110101199412207890', '13800138008', 'zhou.qiang@institute.ac.cn', '助理研究员', '经济学', 'phd'),

-- Public Visitors
('00000000-0000-0000-0000-000000000009', 'national_id', 'public_visitor', 'visitor001', '吴敏', '110101199806158901', '13800138009', 'wu.min@email.com', NULL, '教育学', 'bachelor'),
('00000000-0000-0000-0000-000000000010', 'national_id', 'public_visitor', 'visitor002', '马超', '110101200001129012', '13800138010', 'ma.chao@gmail.com', NULL, '新闻传播', 'bachelor')

ON CONFLICT (id) DO NOTHING;