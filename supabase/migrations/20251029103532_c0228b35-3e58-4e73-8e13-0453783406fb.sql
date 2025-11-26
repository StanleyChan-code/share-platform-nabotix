-- Add approval document URL field to applications table
ALTER TABLE public.applications 
ADD COLUMN approval_document_url TEXT;

COMMENT ON COLUMN public.applications.approval_document_url IS 'URL of the uploaded signed approval form document';

-- Create storage bucket for application documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('application-documents', 'application-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for application documents bucket
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