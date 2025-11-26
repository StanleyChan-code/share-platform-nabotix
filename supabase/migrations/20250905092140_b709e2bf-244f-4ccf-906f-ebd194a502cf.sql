-- Check if we have a proper policy for public access to published datasets
-- The current policy should allow everyone to see published and approved datasets

-- Let's ensure the published datasets policy works correctly
DROP POLICY IF EXISTS "Published datasets are viewable by everyone" ON public.datasets;

CREATE POLICY "Published datasets are viewable by everyone" 
ON public.datasets 
FOR SELECT 
USING ((published = true) AND (approved = true));