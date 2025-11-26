-- ==========================================
-- 修改用户联系信息字段为可空
-- 允许手机号、身份证类型和身份证号码字段为空
-- ==========================================

-- 修改用户表中的字段为可空
ALTER TABLE public.users 
ALTER COLUMN phone DROP NOT NULL,
ALTER COLUMN id_type DROP NOT NULL,
ALTER COLUMN id_number DROP NOT NULL;
