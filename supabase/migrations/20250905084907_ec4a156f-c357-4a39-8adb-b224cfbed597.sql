-- Create sample research outputs without user/dataset dependencies
-- These will just be standalone records to populate the dashboard

INSERT INTO public.research_outputs (
  id, 
  dataset_id, 
  submitter_id, 
  title, 
  abstract, 
  type, 
  publication_url, 
  citation_count
) VALUES 
(
  gen_random_uuid(),
  gen_random_uuid(), -- fake dataset ID for now
  gen_random_uuid(), -- fake user ID for now  
  '基于多中心数据的心血管风险预测模型', 
  '本研究基于华西医院等多中心冠心病队列数据，采用机器学习方法构建心血管风险预测模型。', 
  'publication', 
  'https://doi.org/10.1161/CIRCULATIONAHA.123.456789', 
  12
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  gen_random_uuid(),
  '糖尿病并发症早期识别算法研究', 
  '基于糖尿病患者的生物标志物数据，开发了糖尿病并发症早期识别算法。', 
  'publication', 
  'https://doi.org/10.2337/dc23-1234', 
  8
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  gen_random_uuid(),
  '脑卒中康复效果影响因素分析', 
  '通过对脑卒中患者康复数据的分析，识别了影响康复效果的关键因素。', 
  'publication', 
  'https://doi.org/10.1161/STROKEAHA.123.789012', 
  5
);