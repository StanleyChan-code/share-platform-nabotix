-- Add missing storage RLS policies for datasets bucket
-- Only creates policies that don't already exist

-- Policy 1: Allow users to view files for approved/published datasets
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

-- Policy 2: Allow data providers to access their own dataset files
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

-- Policy 3: Allow admins full access to all dataset files
CREATE POLICY "Admins can access all dataset files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'datasets' AND
  public.has_role(auth.uid(), 'platform_admin')
);

-- Add indexes on file_url and data_dict_url for better performance
CREATE INDEX IF NOT EXISTS idx_datasets_file_url ON public.datasets(file_url);
CREATE INDEX IF NOT EXISTS idx_datasets_data_dict_url ON public.datasets(data_dict_url);