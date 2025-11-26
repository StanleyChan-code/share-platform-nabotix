-- Create enums for various types
CREATE TYPE public.user_role AS ENUM ('public_visitor', 'registered_researcher', 'data_provider', 'institution_supervisor', 'platform_admin');
CREATE TYPE public.id_type AS ENUM ('national_id', 'passport', 'other');
CREATE TYPE public.education_level AS ENUM ('bachelor', 'master', 'phd', 'postdoc', 'professor', 'other');
CREATE TYPE public.institution_type AS ENUM ('hospital', 'university', 'research_center', 'lab', 'government', 'enterprise', 'other');
CREATE TYPE public.dataset_type AS ENUM ('cohort', 'case_control', 'cross_sectional', 'rct', 'registry', 'biobank', 'omics', 'wearable');
CREATE TYPE public.application_status AS ENUM ('submitted', 'under_review', 'approved', 'denied');
CREATE TYPE public.output_type AS ENUM ('paper', 'patent');

-- Create institutions table
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
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create users table (extends auth.users)
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

-- Create research subjects table (admin configurable)
CREATE TABLE public.research_subjects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create datasets table
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dataset statistics table
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

-- Create applications table
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
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Create research outputs table
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit logs table
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

-- Enable Row Level Security
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for institutions
CREATE POLICY "Institutions are viewable by everyone" ON public.institutions FOR SELECT USING (true);
CREATE POLICY "Only admins can insert institutions" ON public.institutions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'platform_admin')
);
CREATE POLICY "Only admins can update institutions" ON public.institutions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'platform_admin')
);

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'platform_admin')
);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for research subjects
CREATE POLICY "Research subjects are viewable by everyone" ON public.research_subjects FOR SELECT USING (active = true);
CREATE POLICY "Only admins can manage research subjects" ON public.research_subjects FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'platform_admin')
);

-- RLS Policies for datasets
CREATE POLICY "Published datasets are viewable by everyone" ON public.datasets FOR SELECT USING (published = true AND approved = true);
CREATE POLICY "Providers can view their own datasets" ON public.datasets FOR SELECT USING (provider_id = auth.uid());
CREATE POLICY "Admins can view all datasets" ON public.datasets FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'platform_admin')
);
CREATE POLICY "Data providers can insert datasets" ON public.datasets FOR INSERT WITH CHECK (
    provider_id = auth.uid() AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('data_provider', 'platform_admin'))
);
CREATE POLICY "Providers can update their own datasets" ON public.datasets FOR UPDATE USING (provider_id = auth.uid());
CREATE POLICY "Admins can update all datasets" ON public.datasets FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'platform_admin')
);

-- RLS Policies for dataset statistics
CREATE POLICY "Statistics viewable with dataset access" ON public.dataset_statistics FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.datasets WHERE datasets.id = dataset_id AND (datasets.published = true AND datasets.approved = true))
    OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'platform_admin')
    OR EXISTS (SELECT 1 FROM public.datasets WHERE datasets.id = dataset_id AND datasets.provider_id = auth.uid())
);

-- RLS Policies for applications
CREATE POLICY "Users can view their own applications" ON public.applications FOR SELECT USING (applicant_id = auth.uid());
CREATE POLICY "Providers can view applications for their datasets" ON public.applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.datasets WHERE datasets.id = dataset_id AND datasets.provider_id = auth.uid())
);
CREATE POLICY "Admins can view all applications" ON public.applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'platform_admin')
);
CREATE POLICY "Researchers can submit applications" ON public.applications FOR INSERT WITH CHECK (
    applicant_id = auth.uid() AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('registered_researcher', 'data_provider'))
);

-- RLS Policies for research outputs
CREATE POLICY "Research outputs are viewable by everyone" ON public.research_outputs FOR SELECT USING (true);
CREATE POLICY "Users can submit their own outputs" ON public.research_outputs FOR INSERT WITH CHECK (submitter_id = auth.uid());

-- RLS Policies for audit logs
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'platform_admin')
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON public.institutions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_datasets_updated_at BEFORE UPDATE ON public.datasets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial research subjects
INSERT INTO public.research_subjects (name, name_en, description) VALUES 
('心血管疾病', 'Cardiovascular Disease', 'Studies related to heart and blood vessel diseases'),
('肿瘤学', 'Oncology', 'Cancer research and treatment studies'),
('神经科学', 'Neuroscience', 'Studies of the nervous system and brain'),
('内分泌学', 'Endocrinology', 'Hormone and metabolic disorder studies'),
('免疫学', 'Immunology', 'Immune system research'),
('感染性疾病', 'Infectious Disease', 'Studies on infectious pathogens and treatments'),
('精神医学', 'Psychiatry', 'Mental health and psychiatric disorder research'),
('儿科学', 'Pediatrics', 'Children''s health and development studies');