-- Add user_id column to institutions table
ALTER TABLE public.institutions 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add comment to explain the purpose of the column
COMMENT ON COLUMN public.institutions.user_id IS '关联的用户ID，指向机构管理员账户';

-- Create index for better performance
CREATE INDEX idx_institutions_user_id ON public.institutions(user_id);