-- Add new fields to datasets table
ALTER TABLE public.datasets
ADD COLUMN dataset_leader text,
ADD COLUMN data_collection_unit text,
ADD COLUMN contact_person text,
ADD COLUMN contact_info text,
ADD COLUMN demographic_fields jsonb,
ADD COLUMN outcome_fields jsonb,
ADD COLUMN terms_agreement_url text,
ADD COLUMN sampling_method text,
ADD COLUMN version_number text DEFAULT '1.0',
ADD COLUMN first_published_date timestamp with time zone,
ADD COLUMN current_version_date timestamp with time zone DEFAULT now();

-- Create dataset_versions table for version history
CREATE TABLE public.dataset_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  version_number text NOT NULL,
  published_date timestamp with time zone NOT NULL DEFAULT now(),
  changes_description text,
  file_url text,
  data_dict_url text,
  terms_agreement_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(dataset_id, version_number)
);

-- Enable RLS on dataset_versions
ALTER TABLE public.dataset_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for dataset_versions
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

-- Trigger to update first_published_date
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