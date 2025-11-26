-- Temporarily disable triggers and constraints to insert sample data
SET session_replication_role = replica;

-- Insert minimal sample data for counts
-- Research outputs (standalone records for counting)
INSERT INTO public.research_outputs (id, dataset_id, submitter_id, title, type, citation_count) VALUES 
(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), '心血管风险预测模型研究', 'paper', 12),
(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), '糖尿病并发症预警算法', 'paper', 8),
(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), '脑卒中康复效果分析', 'paper', 5),
(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), '肺癌治疗靶点专利', 'patent', 2),
(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), '心血管评估系统专利', 'patent', 0);

-- Datasets (for counting)  
INSERT INTO public.datasets (id, title_cn, description, type, provider_id, published, approved, record_count, variable_count, search_count) VALUES
(gen_random_uuid(), '冠心病队列研究数据集', '多中心前瞻性队列研究数据', 'cohort', gen_random_uuid(), true, true, 2847, 156, 45),
(gen_random_uuid(), '糖尿病生物标志物数据', '2型糖尿病患者检测数据', 'cross_sectional', gen_random_uuid(), true, true, 1563, 89, 32),
(gen_random_uuid(), '脑卒中康复数据', '急性脑卒中患者康复数据', 'cohort', gen_random_uuid(), true, true, 892, 67, 28),
(gen_random_uuid(), '肺癌基因组数据', '非小细胞肺癌基因组数据', 'case_control', gen_random_uuid(), true, true, 456, 234, 67);

-- Applications (for counting)
INSERT INTO public.applications (id, dataset_id, applicant_id, project_title, project_description, purpose, status, submitted_at) VALUES
(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), '机器学习风险预测研究', '构建心血管风险预测模型', '学术研究', 'approved', now() - interval '5 days'),
(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), '糖尿病并发症预警研究', '筛选糖尿病并发症预警指标', '学术研究', 'under_review', now() - interval '3 days'),
(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), '康复效果评估研究', '建立康复效果评估体系', '学术研究', 'submitted', now() - interval '1 day'),
(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), '流行病学特征分析', '分析疾病流行病学特征', '学术研究', 'approved', now() - interval '10 days'),
(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), '基因突变谱研究', '分析基因突变谱特征', '学术研究', 'approved', now() - interval '7 days');

-- Users (for counting)
INSERT INTO public.users (id, username, real_name, email, phone, id_type, id_number, role, institution_id, education) VALUES
(gen_random_uuid(), 'sample_user1', '张教授', 'zhang@example.com', '13800000001', 'national_id', '510100197001010001', 'data_provider', gen_random_uuid(), 'professor'),
(gen_random_uuid(), 'sample_user2', '李主任', 'li@example.com', '13800000002', 'national_id', '510100197001010002', 'data_provider', gen_random_uuid(), 'professor'),
(gen_random_uuid(), 'sample_user3', '王研究员', 'wang@example.com', '13800000003', 'national_id', '510100197001010003', 'registered_researcher', gen_random_uuid(), 'phd'),
(gen_random_uuid(), 'sample_user4', '陈博士', 'chen@example.com', '13800000004', 'national_id', '510100197001010004', 'registered_researcher', gen_random_uuid(), 'phd'),
(gen_random_uuid(), 'sample_user5', '刘副研究员', 'liu@example.com', '13800000005', 'national_id', '510100197001010005', 'registered_researcher', gen_random_uuid(), 'master');

-- Re-enable triggers and constraints
SET session_replication_role = DEFAULT;