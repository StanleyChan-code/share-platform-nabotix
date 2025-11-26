-- Add parent_dataset_id for baseline-followup relationship
ALTER TABLE public.datasets ADD COLUMN parent_dataset_id uuid REFERENCES public.datasets(id);

-- Create index for parent-child lookups
CREATE INDEX idx_datasets_parent_id ON public.datasets(parent_dataset_id);

-- Create analysis_results table for comprehensive statistical analysis
CREATE TABLE public.analysis_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id uuid NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  total_rows integer NOT NULL,
  total_columns integer NOT NULL,
  analysis_date timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Overall statistics
  overall_missing_rate numeric,
  memory_usage_mb numeric,
  
  -- Correlation analysis (stored as JSONB for flexibility)
  correlations jsonb,
  
  -- Field mapping and unit conversions
  field_mappings jsonb,
  unit_conversions jsonb,
  
  -- Additional metadata
  analysis_metadata jsonb,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on analysis_results
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- Policies for analysis_results (match dataset access)
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

-- Add trigger for updated_at
CREATE TRIGGER update_analysis_results_updated_at
BEFORE UPDATE ON public.analysis_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.analysis_results IS 'Stores comprehensive statistical analysis results for datasets including correlations, field mappings, and unit conversions';