-- Add new output types to the output_type enum
ALTER TYPE output_type ADD VALUE IF NOT EXISTS 'project';
ALTER TYPE output_type ADD VALUE IF NOT EXISTS 'invention_patent';
ALTER TYPE output_type ADD VALUE IF NOT EXISTS 'utility_patent';
ALTER TYPE output_type ADD VALUE IF NOT EXISTS 'software_copyright';
ALTER TYPE output_type ADD VALUE IF NOT EXISTS 'other_award';

-- Note: 'paper' and 'patent' already exist in the enum
-- We'll keep them for backward compatibility