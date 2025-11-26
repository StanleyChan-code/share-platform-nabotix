-- Let's create sample datasets using a dummy approach
-- We'll create some datasets without strict user relationships for now

-- First, let's create some basic datasets with simple IDs
INSERT INTO public.datasets (
  id, 
  title_cn, 
  description, 
  type, 
  category, 
  provider_id, 
  supervisor_id, 
  subject_area_id, 
  start_date, 
  end_date, 
  record_count, 
  variable_count, 
  keywords, 
  published, 
  approved, 
  search_count
) VALUES 
(
  gen_random_uuid(),
  '冠心病队列研究数据集', 
  '多中心前瞻性队列研究，跟踪冠心病患者5年预后情况，包含临床指标、生化指标、影像学数据等。研究覆盖华西医院、省医院等多个医疗机构，样本代表性强。', 
  'cohort', 
  '心血管疾病', 
  gen_random_uuid(), -- We'll use random UUIDs for now
  NULL, 
  '660e8400-e29b-41d4-a716-446655440000', 
  '2019-01-01', 
  '2024-01-01', 
  2847, 
  156, 
  ARRAY['冠心病', '队列研究', '预后', '心血管'], 
  true, 
  true, 
  45
),
(
  gen_random_uuid(),
  '糖尿病患者生物标志物数据', 
  '2型糖尿病患者血清生物标志物检测数据，包含炎症因子、代谢产物、蛋白质组学数据。采用高通量检测技术，数据质量可靠。', 
  'cross_sectional', 
  '内分泌代谢', 
  gen_random_uuid(), 
  NULL, 
  '660e8400-e29b-41d4-a716-446655440001', 
  '2023-03-01', 
  '2023-12-31', 
  1563, 
  89, 
  ARRAY['糖尿病', '生物标志物', '蛋白质组学'], 
  true, 
  true, 
  32
),
(
  gen_random_uuid(),
  '脑卒中康复随访数据', 
  '急性脑卒中患者康复治疗效果评估数据，包含运动功能、认知功能、生活质量评分。长期随访数据完整，适合预后研究。', 
  'cohort', 
  '神经系统疾病', 
  gen_random_uuid(), 
  NULL, 
  '660e8400-e29b-41d4-a716-446655440002', 
  '2022-06-01', 
  '2024-01-01', 
  892, 
  67, 
  ARRAY['脑卒中', '康复', '功能评估'], 
  true, 
  true, 
  28
);