-- Temporarily disable foreign key checks to insert sample data
SET session_replication_role = replica;

-- Insert sample users (these will have invalid auth references but that's ok for sample data)
INSERT INTO public.users (id, username, real_name, email, phone, id_type, id_number, role, title, field, institution_id, education, supervisor_id) VALUES
('11111111-1111-1111-1111-111111111111', 'zhang_prof', '张明华', 'zhang@huaxi.edu.cn', '13800138001', 'national_id', '510100197001011001', 'data_provider', '主任医师', '心血管内科', '550e8400-e29b-41d4-a716-446655440000', 'professor', NULL),
('22222222-2222-2222-2222-222222222222', 'li_director', '李晓红', 'li@scu.edu.cn', '13800138002', 'national_id', '510100197501011002', 'data_provider', '科主任', '内分泌科', '550e8400-e29b-41d4-a716-446655440001', 'professor', NULL),
('33333333-3333-3333-3333-333333333333', 'wang_researcher', '王建国', 'wang@research.cn', '13800138003', 'national_id', '510100198001011003', 'data_provider', '研究员', '神经科学', '550e8400-e29b-41d4-a716-446655440002', 'phd', NULL),
('44444444-4444-4444-4444-444444444444', 'chen_student', '陈小明', 'chen@student.edu.cn', '13800138004', 'national_id', '510100199001011004', 'registered_researcher', '博士研究生', '生物统计学', '550e8400-e29b-41d4-a716-446655440001', 'phd', '22222222-2222-2222-2222-222222222222'),
('55555555-5555-5555-5555-555555555555', 'liu_researcher', '刘丽华', 'liu@huaxi.edu.cn', '13800138005', 'national_id', '510100198501011005', 'registered_researcher', '副研究员', '流行病学', '550e8400-e29b-41d4-a716-446655440000', 'master', '11111111-1111-1111-1111-111111111111');

-- Insert sample datasets
INSERT INTO public.datasets (id, title_cn, description, type, category, provider_id, supervisor_id, subject_area_id, start_date, end_date, record_count, variable_count, keywords, published, approved, search_count) VALUES
('77777777-7777-7777-7777-777777777777', '冠心病队列研究数据集', '多中心前瞻性队列研究，跟踪冠心病患者5年预后情况，包含临床指标、生化指标、影像学数据等。', 'cohort', '心血管疾病', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '660e8400-e29b-41d4-a716-446655440000', '2019-01-01', '2024-01-01', 2847, 156, ARRAY['冠心病', '队列研究', '预后', '心血管'], true, true, 45),
('88888888-8888-8888-8888-888888888888', '糖尿病患者生物标志物数据', '2型糖尿病患者血清生物标志物检测数据，包含炎症因子、代谢产物、蛋白质组学数据。', 'cross_sectional', '内分泌代谢', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '660e8400-e29b-41d4-a716-446655440001', '2023-03-01', '2023-12-31', 1563, 89, ARRAY['糖尿病', '生物标志物', '蛋白质组学'], true, true, 32),
('99999999-9999-9999-9999-999999999999', '脑卒中康复随访数据', '急性脑卒中患者康复治疗效果评估数据，包含运动功能、认知功能、生活质量评分。', 'cohort', '神经系统疾病', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '660e8400-e29b-41d4-a716-446655440002', '2022-06-01', '2024-01-01', 892, 67, ARRAY['脑卒中', '康复', '功能评估'], true, true, 28);

-- Insert sample applications
INSERT INTO public.applications (id, dataset_id, applicant_id, supervisor_id, project_title, project_description, purpose, funding_source, status, submitted_at, reviewed_at, approved_at) VALUES
('cccccccc-dddd-eeee-ffff-000000000001', '77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '基于机器学习的心血管风险预测模型研究', '利用冠心病队列数据，构建机器学习预测模型，识别高风险患者。', '学术研究，用于博士学位论文', '国家自然科学基金青年项目', 'approved', '2024-01-10', '2024-01-15', '2024-01-15'),
('dddddddd-eeee-ffff-0000-000000000002', '88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '糖尿病并发症早期预警指标筛选', '基于生物标志物数据，筛选糖尿病并发症的早期预警指标。', '学术研究，发表SCI论文', '省部级科研项目', 'under_review', '2024-01-12', NULL, NULL);

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;