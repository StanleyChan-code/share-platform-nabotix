-- ==========================================
-- 数据库初始化脚本
-- 包含表结构定义和基础数据插入
-- ==========================================

-- 创建枚举类型
CREATE TYPE public.user_role AS ENUM ('public_visitor', 'registered_researcher', 'data_provider', 'institution_supervisor', 'platform_admin');
CREATE TYPE public.id_type AS ENUM ('national_id', 'passport', 'other');
CREATE TYPE public.education_level AS ENUM ('bachelor', 'master', 'phd', 'postdoc', 'professor', 'other');
CREATE TYPE public.institution_type AS ENUM ('hospital', 'university', 'research_center', 'lab', 'government', 'enterprise', 'other');
CREATE TYPE public.dataset_type AS ENUM ('cohort', 'case_control', 'cross_sectional', 'rct', 'registry', 'biobank', 'omics', 'wearable');
CREATE TYPE public.application_status AS ENUM ('submitted', 'under_review', 'approved', 'denied');
CREATE TYPE public.output_type AS ENUM ('paper', 'patent', 'publication', 'software', 'project', 'invention_patent', 'utility_patent', 'software_copyright', 'other_award');
CREATE TYPE public.applicant_role AS ENUM ('team_researcher', 'collaborative_researcher');

-- 创建机构表
CREATE TABLE public.institutions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    short_name TEXT,
    type institution_type NOT NULL,
    contact_person TEXT NOT NULL,
    contact_id_type id_type NOT NULL,
    contact_id_number TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    user_id UUID REFERENCES auth.users(id)
);

-- 添加注释说明user_id用途
COMMENT ON COLUMN public.institutions.user_id IS '关联的用户ID，指向机构管理员账户';

-- 创建用户表
CREATE TABLE public.users (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    real_name TEXT NOT NULL,
    id_type id_type NOT NULL,
    id_number TEXT NOT NULL,
    education education_level,
    title TEXT,
    field TEXT,
    institution_id UUID REFERENCES public.institutions(id),
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'public_visitor',
    supervisor_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建研究主题表
CREATE TABLE public.research_subjects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建数据集表
CREATE TABLE public.datasets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title_cn TEXT NOT NULL,
    description TEXT NOT NULL,
    type dataset_type NOT NULL,
    category TEXT,
    provider_id UUID NOT NULL REFERENCES public.users(id),
    supervisor_id UUID REFERENCES public.users(id),
    start_date DATE,
    end_date DATE,
    record_count INTEGER,
    variable_count INTEGER,
    keywords TEXT[],
    subject_area_id UUID REFERENCES public.research_subjects(id),
    file_url TEXT,
    data_dict_url TEXT,
    approved BOOLEAN DEFAULT FALSE,
    published BOOLEAN DEFAULT FALSE,
    search_count INTEGER DEFAULT 0,
    share_all_data BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    -- 新增字段
    dataset_leader TEXT,
    data_collection_unit TEXT,
    contact_person TEXT,
    contact_info TEXT,
    demographic_fields JSONB,
    outcome_fields JSONB,
    terms_agreement_url TEXT,
    sampling_method TEXT,
    version_number TEXT DEFAULT '1.0',
    first_published_date TIMESTAMP WITH TIME ZONE,
    current_version_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    parent_dataset_id UUID REFERENCES public.datasets(id),
    principal_investigator TEXT
);

-- 创建数据集统计表
CREATE TABLE public.dataset_statistics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    variable_name TEXT NOT NULL,
    variable_type TEXT NOT NULL,
    mean_value DECIMAL,
    std_deviation DECIMAL,
    percentage DECIMAL,
    missing_count INTEGER,
    total_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建申请表
CREATE TABLE public.applications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    dataset_id UUID NOT NULL REFERENCES public.datasets(id),
    applicant_id UUID NOT NULL REFERENCES public.users(id),
    supervisor_id UUID REFERENCES public.users(id),
    project_title TEXT NOT NULL,
    project_description TEXT NOT NULL,
    funding_source TEXT,
    purpose TEXT NOT NULL,
    status application_status DEFAULT 'submitted',
    admin_notes TEXT,
    provider_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_document_url TEXT,
    applicant_role applicant_role NOT NULL DEFAULT 'team_researcher',
    applicant_type TEXT
);

-- 创建研究成果表
CREATE TABLE public.research_outputs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    dataset_id UUID NOT NULL REFERENCES public.datasets(id),
    submitter_id UUID NOT NULL REFERENCES public.users(id),
    type output_type NOT NULL,
    title TEXT NOT NULL,
    abstract TEXT,
    journal TEXT,
    patent_number TEXT,
    citation_count INTEGER DEFAULT 0,
    publication_url TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT
);

-- Add comments to explain the new columns
COMMENT ON COLUMN public.research_outputs.journal IS 'Journal name for research papers';
COMMENT ON COLUMN public.research_outputs.approved IS 'Whether the research output has been approved by admins';
COMMENT ON COLUMN public.research_outputs.approved_by IS 'The admin who approved/rejected the research output';
COMMENT ON COLUMN public.research_outputs.approved_at IS 'When the research output was approved/rejected';
COMMENT ON COLUMN public.research_outputs.rejection_reason IS 'Reason for rejection if applicable';

-- 创建审计日志表
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建用户角色表（安全增强）
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, role)
);

-- 创建数据集版本表
CREATE TABLE public.dataset_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    version_number TEXT NOT NULL,
    published_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    changes_description TEXT,
    file_url TEXT,
    data_dict_url TEXT,
    terms_agreement_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(dataset_id, version_number)
);

-- 创建分析结果表
CREATE TABLE public.analysis_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    total_rows INTEGER NOT NULL,
    total_columns INTEGER NOT NULL,
    analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    overall_missing_rate NUMERIC,
    memory_usage_mb NUMERIC,
    correlations JSONB,
    field_mappings JSONB,
    unit_conversions JSONB,
    analysis_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用行级安全
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- 启用关键表的实时功能
ALTER TABLE public.datasets REPLICA IDENTITY FULL;
ALTER TABLE public.applications REPLICA IDENTITY FULL;
ALTER TABLE public.research_outputs REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;

-- 将表添加到实时发布中
ALTER PUBLICATION supabase_realtime ADD TABLE public.datasets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_outputs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- 创建安全函数
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'platform_admin');
$$;

-- 创建检查用户是否已认证的函数
CREATE OR REPLACE FUNCTION public.is_authenticated_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 创建获取公开统计信息的函数
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'users_count', (SELECT COUNT(*) FROM users),
    'datasets_count', (SELECT COUNT(*) FROM datasets WHERE published = true AND approved = true),
    'applications_count', (SELECT COUNT(*) FROM applications),
    'outputs_count', (SELECT COUNT(*) FROM research_outputs WHERE approved = true)
  );
$$;

-- 机构表RLS策略
-- Authenticated users can view verified institutions
CREATE POLICY "Authenticated users can view verified institutions"
ON public.institutions
FOR SELECT
TO authenticated
USING (verified = true);

-- Institution users can view their own institution details
CREATE POLICY "Institution users can view their own institution"
ON public.institutions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()
    AND users.institution_id = institutions.id
  )
);

-- Platform admins can view all institution details
CREATE POLICY "Platform admins can view all institution details"
ON public.institutions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'platform_admin'
  )
);

-- Institution supervisors can update their own institution
CREATE POLICY "Institution supervisors can update their own institution"
ON public.institutions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()
    AND users.id = institutions.user_id
    AND users.institution_id = institutions.id
  )
);

-- Platform admins can update institutions
CREATE POLICY "Platform admins can update institutions"
ON public.institutions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'platform_admin'
  )
);

-- Platform admins can insert institutions
CREATE POLICY "Platform admins can insert institutions"
ON public.institutions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'platform_admin'
  )
);

-- 用户表RLS策略
-- 用户可以查看自己的资料
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
-- 管理员可以查看所有用户
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (public.is_admin());
-- 用户可以更新自己的资料
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
-- 用户可以插入自己的资料
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- 研究主题表RLS策略
-- 活跃的研究主题对所有人可见
CREATE POLICY "Research subjects are viewable by everyone" ON public.research_subjects FOR SELECT USING (active = true);
-- 只有管理员可以管理研究主题
CREATE POLICY "Only admins can manage research subjects" ON public.research_subjects FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'platform_admin')
);

-- 数据集表RLS策略
-- 已发布和批准的数据集对所有人可见
CREATE POLICY "Published datasets are viewable by everyone" ON public.datasets FOR SELECT USING (published = true AND approved = true);
-- 提供者可以查看自己的数据集
CREATE POLICY "Providers can view their own datasets" ON public.datasets FOR SELECT USING (provider_id = auth.uid());
-- 管理员可以查看所有数据集
CREATE POLICY "Admins can view all datasets" ON public.datasets FOR SELECT USING (public.has_role(auth.uid(), 'platform_admin'));
-- 数据提供者可以插入数据集
CREATE POLICY "Data providers can insert datasets" ON public.datasets FOR INSERT WITH CHECK (
    provider_id = auth.uid() AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('data_provider', 'platform_admin'))
);
-- 提供者可以更新自己的数据集
CREATE POLICY "Providers can update their own datasets" ON public.datasets FOR UPDATE USING (provider_id = auth.uid());
-- 管理员可以更新所有数据集
CREATE POLICY "Admins can update all datasets" ON public.datasets FOR UPDATE USING (public.has_role(auth.uid(), 'platform_admin'));
-- 管理员可以删除数据集
CREATE POLICY "Admins can delete datasets" ON public.datasets FOR DELETE USING (public.has_role(auth.uid(), 'platform_admin'));

-- 数据集统计表RLS策略
-- 有数据集访问权限的用户可以查看统计信息
CREATE POLICY "Statistics viewable with dataset access" ON public.dataset_statistics FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.datasets WHERE datasets.id = dataset_id AND (datasets.published = true AND datasets.approved = true))
    OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'platform_admin')
    OR EXISTS (SELECT 1 FROM public.datasets WHERE datasets.id = dataset_id AND datasets.provider_id = auth.uid())
);

-- 申请表RLS策略
-- 用户可以查看自己的申请
CREATE POLICY "Users can view their own applications" ON public.applications FOR SELECT USING (applicant_id = auth.uid());
-- 数据集提供者可以查看其数据集的申请
CREATE POLICY "Providers can view applications for their datasets" ON public.applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.datasets WHERE datasets.id = dataset_id AND datasets.provider_id = auth.uid())
);
-- 管理员可以查看所有申请
CREATE POLICY "Admins can view all applications" ON public.applications FOR SELECT USING (public.has_role(auth.uid(), 'platform_admin'));
-- 管理员可以更新申请
CREATE POLICY "Admins can update applications" ON public.applications FOR UPDATE USING (public.has_role(auth.uid(), 'platform_admin'));
-- 管理员可以删除申请
CREATE POLICY "Admins can delete applications" ON public.applications FOR DELETE USING (public.has_role(auth.uid(), 'platform_admin'));
-- 研究人员可以提交申请
CREATE POLICY "Researchers can submit applications" ON public.applications FOR INSERT WITH CHECK (
    applicant_id = auth.uid() AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('registered_researcher', 'data_provider', 'platform_admin'))
);
-- 允许用户更新自己的申请
CREATE POLICY "Users can update their own applications" ON public.applications FOR UPDATE USING (applicant_id = auth.uid());
-- 允许用户删除自己的申请
CREATE POLICY "Users can delete their own applications" ON public.applications FOR DELETE USING (applicant_id = auth.uid());

-- 研究成果表RLS策略
-- Approved research outputs are viewable by everyone
CREATE POLICY "Approved research outputs are viewable by everyone"
ON public.research_outputs 
FOR SELECT 
USING (approved = true OR submitter_id = auth.uid() OR public.has_role(auth.uid(), 'platform_admin'));

-- Submitters can view their own research outputs regardless of approval status
CREATE POLICY "Submitters can view their own outputs"
ON public.research_outputs
FOR SELECT
USING (submitter_id = auth.uid());

-- Users can submit their own outputs
CREATE POLICY "Users can submit their own outputs" 
ON public.research_outputs 
FOR INSERT 
WITH CHECK (submitter_id = auth.uid());

-- Submitters can update their own unapproved outputs
CREATE POLICY "Submitters can update their own unapproved outputs"
ON public.research_outputs
FOR UPDATE
USING (submitter_id = auth.uid() AND (approved IS NULL OR approved = false));

-- Submitters can delete their own unapproved outputs
CREATE POLICY "Submitters can delete their own unapproved outputs"
ON public.research_outputs
FOR DELETE
USING (submitter_id = auth.uid() AND (approved IS NULL OR approved = false));

-- Admins can update all outputs (needed for approval process)
CREATE POLICY "Admins can update all outputs"
ON public.research_outputs
FOR UPDATE
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Admins can delete all outputs
CREATE POLICY "Admins can delete all outputs"
ON public.research_outputs
FOR DELETE
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Admins can approve/reject outputs
CREATE POLICY "Admins can approve/reject outputs"
ON public.research_outputs
FOR UPDATE
USING (public.has_role(auth.uid(), 'platform_admin'));

-- 审计日志表RLS策略
-- 只有管理员可以查看审计日志
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'platform_admin'));

-- 用户角色表RLS策略
-- 只有管理员可以管理角色
CREATE POLICY "Only existing admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'platform_admin'
  )
);

-- 用户可以查看自己的角色
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- 数据集版本表RLS策略
-- 有数据集访问权限的用户可以查看版本
CREATE POLICY "Versions viewable with dataset access"
ON public.dataset_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.datasets
    WHERE datasets.id = dataset_versions.dataset_id
    AND ((datasets.published = true AND datasets.approved = true)
         OR datasets.provider_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'platform_admin'
  )
);

-- 提供者可以为其数据集插入版本
CREATE POLICY "Providers can insert versions for their datasets"
ON public.dataset_versions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.datasets
    WHERE datasets.id = dataset_versions.dataset_id
    AND datasets.provider_id = auth.uid()
  )
);

-- 分析结果表RLS策略
-- 有数据集访问权限的用户可以查看分析结果
CREATE POLICY "Analysis results viewable with dataset access"
ON public.analysis_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM datasets 
    WHERE datasets.id = analysis_results.dataset_id 
    AND (
      (datasets.published = true AND datasets.approved = true)
      OR datasets.provider_id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'platform_admin'
  )
);

-- 创建更新时间戳函数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 创建触发器
CREATE TRIGGER update_institutions_updated_at 
    BEFORE UPDATE ON public.institutions 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    
CREATE TRIGGER update_datasets_updated_at 
    BEFORE UPDATE ON public.datasets 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    
CREATE TRIGGER update_analysis_results_updated_at 
    BEFORE UPDATE ON public.analysis_results 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 创建首次发布时间触发器函数
CREATE OR REPLACE FUNCTION public.set_first_published_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.published = true AND NEW.approved = true AND OLD.first_published_date IS NULL THEN
        NEW.first_published_date = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_first_published_date
    BEFORE UPDATE ON public.datasets
    FOR EACH ROW
    EXECUTE FUNCTION public.set_first_published_date();

-- 创建索引
CREATE INDEX idx_datasets_parent_id ON public.datasets(parent_dataset_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_datasets_file_url ON public.datasets(file_url);
CREATE INDEX idx_datasets_data_dict_url ON public.datasets(data_dict_url);
CREATE INDEX idx_institutions_user_id ON public.institutions(user_id);
CREATE INDEX idx_research_outputs_approved ON public.research_outputs(approved);
CREATE INDEX idx_research_outputs_submitter_id ON public.research_outputs(submitter_id);

-- 创建视图用于公开机构信息
CREATE OR REPLACE VIEW public.institutions_public AS
SELECT 
  id,
  full_name,
  short_name,
  type,
  verified,
  created_at
FROM public.institutions
WHERE verified = true;

-- 授权访问权限
GRANT SELECT ON public.institutions_public TO authenticated;

-- 插入初始研究主题
INSERT INTO public.research_subjects (name, name_en, description) VALUES 
('心血管疾病', 'Cardiovascular Disease', 'Studies related to heart and blood vessel diseases'),
('肿瘤学', 'Oncology', 'Cancer research and treatment studies'),
('神经科学', 'Neuroscience', 'Studies of the nervous system and brain'),
('内分泌学', 'Endocrinology', 'Hormone and metabolic disorder studies'),
('免疫学', 'Immunology', 'Immune system research'),
('感染性疾病', 'Infectious Disease', 'Studies on infectious pathogens and treatments'),
('精神医学', 'Psychiatry', 'Mental health and psychiatric disorder research'),
('儿科学', 'Pediatrics', 'Children''s health and development studies');

-- 插入示例机构
INSERT INTO public.institutions (id, username, full_name, short_name, type, contact_person, contact_email, contact_phone, contact_id_type, contact_id_number, verified) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'huaxi_hospital', '四川大学华西医院', '华西医院', 'hospital', '张教授', 'zhang@huaxi.edu.cn', '028-85422286', 'national_id', '510100196001011234', true),
('550e8400-e29b-41d4-a716-446655440001', 'scu_medical', '四川大学医学院', '川大医学院', 'university', '李主任', 'li@scu.edu.cn', '028-85501234', 'national_id', '510100197001011234', true),
('550e8400-e29b-41d4-a716-446655440002', 'west_china_research', '华西医学中心', '华西医学中心', 'research_center', '王博士', 'wang@research.cn', '028-85503456', 'national_id', '510100198001011234', true);

-- 插入示例研究主题
INSERT INTO public.research_subjects (id, name, name_en, description, active) VALUES
('660e8400-e29b-41d4-a716-446655440000', '心血管疾病', 'Cardiovascular Disease', '心血管系统相关疾病研究', true),
('660e8400-e29b-41d4-a716-446655440001', '内分泌代谢', 'Endocrinology', '内分泌系统和代谢相关疾病研究', true),
('660e8400-e29b-41d4-a716-446655440002', '神经系统疾病', 'Neurological Disorders', '神经系统疾病相关研究', true),
('660e8400-e29b-41d4-a716-446655440003', '肿瘤学', 'Oncology', '肿瘤相关疾病研究', true);

-- 插入示例用户
INSERT INTO public.users (id, username, real_name, email, phone, id_type, id_number, role, title, field, institution_id, education) VALUES
-- 平台管理员
('8022c0a0-b761-46e1-b15b-78e0a90db348', 'admin001', '张伟', 'admin@example.com', '13800138001', 'national_id', '110101199001011234', 'platform_admin', '平台管理员', '计算机科学', NULL, 'phd'),
-- 数据提供者
('13d0c92f-4dc5-4a51-96bd-2f23c2bdc5fc', 'provider001', '李明', 'li.ming@university.edu.cn', '13800138002', 'national_id', '110101198502152345', 'data_provider', '教授', '生物医学', '550e8400-e29b-41d4-a716-446655440001', 'phd'),
('32ab99a9-ba3a-424d-aac8-4ac586904bfd', 'provider002', '王丽华', 'wang.lihua@research.org.cn', '13800138003', 'national_id', '110101198703203456', 'data_provider', '研究员', '心理学', '550e8400-e29b-41d4-a716-446655440002', 'phd'),
-- 注册研究者
('f41d0e1f-3539-433b-98ba-5aef05884b07', 'researcher001', '刘芳', 'liu.fang@student.edu.cn', '13800138005', 'national_id', '110101199205104567', 'registered_researcher', '博士研究生', '数据科学', '550e8400-e29b-41d4-a716-446655440001', 'phd'),
('fdb502e6-0942-4710-8854-7279361cd6f9', 'researcher002', '赵建国', 'zhao.jianguo@company.com', '13800138006', 'national_id', '110101198901156789', 'registered_researcher', '数据分析师', '统计学', '550e8400-e29b-41d4-a716-446655440000', 'master');

-- 插入用户角色
INSERT INTO public.user_roles (user_id, role, created_by) VALUES
('8022c0a0-b761-46e1-b15b-78e0a90db348', 'platform_admin', '8022c0a0-b761-46e1-b15b-78e0a90db348'),
('13d0c92f-4dc5-4a51-96bd-2f23c2bdc5fc', 'data_provider', '8022c0a0-b761-46e1-b15b-78e0a90db348'),
('32ab99a9-ba3a-424d-aac8-4ac586904bfd', 'data_provider', '8022c0a0-b761-46e1-b15b-78e0a90db348'),
('f41d0e1f-3539-433b-98ba-5aef05884b07', 'registered_researcher', '8022c0a0-b761-46e1-b15b-78e0a90db348'),
('fdb502e6-0942-4710-8854-7279361cd6f9', 'registered_researcher', '8022c0a0-b761-46e1-b15b-78e0a90db348');

-- 插入示例数据集
INSERT INTO public.datasets (id, title_cn, description, type, category, provider_id, supervisor_id, subject_area_id, start_date, end_date, record_count, variable_count, keywords, published, approved, search_count) VALUES
('77777777-7777-7777-7777-777777777777', '冠心病队列研究数据集', '多中心前瞻性队列研究，跟踪冠心病患者5年预后情况，包含临床指标、生化指标、影像学数据等。', 'cohort', '心血管疾病', '13d0c92f-4dc5-4a51-96bd-2f23c2bdc5fc', '13d0c92f-4dc5-4a51-96bd-2f23c2bdc5fc', '660e8400-e29b-41d4-a716-446655440000', '2019-01-01', '2024-01-01', 2847, 156, ARRAY['冠心病', '队列研究', '预后', '心血管'], true, true, 45),
('88888888-8888-8888-8888-888888888888', '糖尿病患者生物标志物数据', '2型糖尿病患者血清生物标志物检测数据，包含炎症因子、代谢产物、蛋白质组学数据。', 'cross_sectional', '内分泌代谢', '13d0c92f-4dc5-4a51-96bd-2f23c2bdc5fc', '13d0c92f-4dc5-4a51-96bd-2f23c2bdc5fc', '660e8400-e29b-41d4-a716-446655440001', '2023-03-01', '2023-12-31', 1563, 89, ARRAY['糖尿病', '生物标志物', '蛋白质组学'], true, true, 32),
('99999999-9999-9999-9999-999999999999', '脑卒中康复随访数据', '急性脑卒中患者康复治疗效果评估数据，包含运动功能、认知功能、生活质量评分。', 'cohort', '神经系统疾病', '32ab99a9-ba3a-424d-aac8-4ac586904bfd', '32ab99a9-ba3a-424d-aac8-4ac586904bfd', '660e8400-e29b-41d4-a716-446655440002', '2022-06-01', '2024-01-01', 892, 67, ARRAY['脑卒中', '康复', '功能评估'], true, true, 28);

-- 插入示例申请
INSERT INTO public.applications (id, dataset_id, applicant_id, supervisor_id, project_title, project_description, purpose, funding_source, status, submitted_at, reviewed_at, approved_at) VALUES
('cccccccc-dddd-eeee-ffff-000000000001', '77777777-7777-7777-7777-777777777777', 'f41d0e1f-3539-433b-98ba-5aef05884b07', '13d0c92f-4dc5-4a51-96bd-2f23c2bdc5fc', '基于机器学习的心血管风险预测模型研究', '利用冠心病队列数据，构建机器学习预测模型，识别高风险患者。', '学术研究，用于博士学位论文', '国家自然科学基金青年项目', 'approved', '2024-01-10', '2024-01-15', '2024-01-15'),
('dddddddd-eeee-ffff-0000-000000000002', '88888888-8888-8888-8888-888888888888', 'fdb502e6-0942-4710-8854-7279361cd6f9', '13d0c92f-4dc5-4a51-96bd-2f23c2bdc5fc', '糖尿病并发症早期预警指标筛选', '基于生物标志物数据，筛选糖尿病并发症的早期预警指标。', '学术研究，发表SCI论文', '省部级科研项目', 'under_review', '2024-01-12', NULL, NULL);

-- 插入示例研究成果
INSERT INTO public.research_outputs (id, dataset_id, submitter_id, title, abstract, type, publication_url, citation_count) VALUES
('eeeeeeee-1111-2222-3333-444444444444', '77777777-7777-7777-7777-777777777777', 'f41d0e1f-3539-433b-98ba-5aef05884b07', '基于多中心数据的心血管风险预测模型', '本研究基于华西医院等多中心冠心病队列数据，采用机器学习方法构建心血管风险预测模型。研究纳入2847例患者，建立了包含临床指标、生化指标的综合预测模型，AUC达到085，为临床风险评估提供了有效工具。', 'publication', 'https://doi.org/10.1161/CIRCULATIONAHA.123.456789', 12),
('eeeeeeee-2222-3333-4444-555555555555', '88888888-8888-8888-8888-888888888888', 'fdb502e6-0942-4710-8854-7279361cd6f9', '糖尿病并发症早期识别算法研究', '基于1563例2型糖尿病患者的生物标志物数据，开发了糖尿病并发症早期识别算法。研究发现多个新的预警指标，算法敏感性达92%，特异性达88%，为糖尿病并发症的早期干预提供了科学依据。', 'publication', 'https://doi.org/10.2337/dc23-1234', 8);

-- 创建存储桶用于数据集文件
INSERT INTO storage.buckets (id, name, public) VALUES ('datasets', 'datasets', false);
-- 创建存储桶用于申请文档
INSERT INTO storage.buckets (id, name, public) VALUES ('application-documents', 'application-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 存储策略
-- 数据集文件访问策略
CREATE POLICY "Dataset files viewable by authenticated users" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'datasets' AND auth.role() = 'authenticated');

CREATE POLICY "Data providers can upload dataset files" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'datasets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('data_provider', 'platform_admin')
  )
);

-- 申请文档访问策略
CREATE POLICY "Users can upload their own application documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'application-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own application documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'application-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all application documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'application-documents'
  AND has_role(auth.uid(), 'platform_admin')
);

CREATE POLICY "Data providers can view application documents for their datasets"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'application-documents'
  AND EXISTS (
    SELECT 1 FROM applications a
    JOIN datasets d ON d.id = a.dataset_id
    WHERE d.provider_id = auth.uid()
    AND a.id::text = (storage.foldername(name))[2]
  )
);

-- 用户可以更新自己的申请文档
CREATE POLICY "Users can update their own application documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'application-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 用户可以删除自己的申请文档
CREATE POLICY "Users can delete their own application documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'application-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 用户可以访问已批准和发布的数据集文件
CREATE POLICY "Users can access approved dataset files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'datasets' AND
  (
    -- Allow if the file belongs to an approved and published dataset
    EXISTS (
      SELECT 1 FROM public.datasets
      WHERE (datasets.file_url = name OR datasets.data_dict_url = name)
      AND datasets.published = true
      AND datasets.approved = true
    )
  )
);

-- 数据提供者可以访问自己的数据集文件
CREATE POLICY "Providers can access their own dataset files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'datasets' AND
  EXISTS (
    SELECT 1 FROM public.datasets
    WHERE (datasets.file_url = name OR datasets.data_dict_url = name)
    AND datasets.provider_id = auth.uid()
  )
);

-- 管理员可以访问所有数据集文件
CREATE POLICY "Admins can access all dataset files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'datasets' AND
  public.has_role(auth.uid(), 'platform_admin')
);

-- 数据提供者可以更新自己的数据集文件
CREATE POLICY "Providers can update their dataset files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'datasets' AND
  EXISTS (
    SELECT 1 FROM public.datasets
    WHERE (datasets.file_url = name OR datasets.data_dict_url = name)
    AND datasets.provider_id = auth.uid()
  )
);

-- 数据提供者可以删除自己的数据集文件
CREATE POLICY "Providers can delete their dataset files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'datasets' AND
  EXISTS (
    SELECT 1 FROM public.datasets
    WHERE (datasets.file_url = name OR datasets.data_dict_url = name)
    AND datasets.provider_id = auth.uid()
  )
);

-- Create a function to allow admins to create user profiles
-- This bypasses RLS restrictions by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.create_institution_user_profile(
  user_id uuid,
  user_username text,
  user_real_name text,
  user_email text,
  user_phone text,
  user_id_type public.id_type,
  user_id_number text,
  user_institution_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is a platform admin
  IF NOT public.has_role(auth.uid(), 'platform_admin') THEN
    RAISE EXCEPTION 'Only platform admins can create user profiles';
END IF;

  -- Insert the user profile
INSERT INTO public.users (
    id,
    username,
    real_name,
    email,
    phone,
    id_type,
    id_number,
    institution_id
) VALUES (
             user_id,
             user_username,
             user_real_name,
             user_email,
             user_phone,
             user_id_type,
             user_id_number,
             user_institution_id
         );

-- Also insert the role into user_roles table
INSERT INTO public.user_roles (
    user_id,
    role,
    created_by
) VALUES (
             user_id,
             'institution_supervisor',
             auth.uid()
         );
END;
$$;

-- Grant execute permission to authenticated users
-- The function itself checks for admin privileges
GRANT EXECUTE ON FUNCTION public.create_institution_user_profile TO authenticated;

-- 创建存储过程用于审批研究成果
CREATE OR REPLACE FUNCTION public.update_research_output_approval(
  output_id UUID,
  is_approved BOOLEAN,
  reject_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.research_outputs
  SET 
    approved = is_approved,
    approved_by = auth.uid(),
    approved_at = NOW(),
    rejection_reason = CASE WHEN is_approved THEN NULL ELSE reject_reason END
  WHERE id = output_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加研究成果表的注释
COMMENT ON TABLE public.research_outputs IS 'Stores research outputs (papers, patents, etc.) submitted by users based on platform datasets';
