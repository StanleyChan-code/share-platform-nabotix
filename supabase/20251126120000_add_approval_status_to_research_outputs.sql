-- Add approval status fields to research_outputs table
ALTER TABLE public.research_outputs 
ADD COLUMN journal TEXT,
ADD COLUMN approved BOOLEAN DEFAULT FALSE,
ADD COLUMN approved_by UUID REFERENCES public.users(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN rejection_reason TEXT;

-- Add comments to explain the new columns
COMMENT ON COLUMN public.research_outputs.journal IS 'Journal name for research papers';
COMMENT ON COLUMN public.research_outputs.approved IS 'Whether the research output has been approved by admins';
COMMENT ON COLUMN public.research_outputs.approved_by IS 'The admin who approved/rejected the research output';
COMMENT ON COLUMN public.research_outputs.approved_at IS 'When the research output was approved/rejected';
COMMENT ON COLUMN public.research_outputs.rejection_reason IS 'Reason for rejection if applicable';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_research_outputs_approved ON public.research_outputs(approved);
CREATE INDEX IF NOT EXISTS idx_research_outputs_submitter_id ON public.research_outputs(submitter_id);

-- Grant admin users the ability to update approval status
CREATE POLICY "Admins can approve/reject outputs"
ON public.research_outputs
FOR UPDATE
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Update existing RLS policies to respect approval status
DROP POLICY IF EXISTS "Research outputs are viewable by everyone" ON public.research_outputs;
CREATE POLICY "Approved research outputs are viewable by everyone"
ON public.research_outputs 
FOR SELECT 
USING (approved = true OR submitter_id = auth.uid() OR public.has_role(auth.uid(), 'platform_admin'));

-- Submitters can view their own research outputs regardless of approval status
CREATE POLICY "Submitters can view their own outputs"
ON public.research_outputs
FOR SELECT
USING (submitter_id = auth.uid());

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

-- Create a function to approve/reject research outputs
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