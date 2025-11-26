-- Enable real-time on key tables
ALTER TABLE public.datasets REPLICA IDENTITY FULL;
ALTER TABLE public.applications REPLICA IDENTITY FULL;
ALTER TABLE public.research_outputs REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.datasets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_outputs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- Create storage bucket for dataset files
INSERT INTO storage.buckets (id, name, public) VALUES ('datasets', 'datasets', false);

-- Storage policies for dataset files
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

CREATE POLICY "Providers can update their own dataset files" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'datasets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Providers can delete their own dataset files" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'datasets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);