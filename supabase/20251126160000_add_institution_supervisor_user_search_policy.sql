-- Institution supervisors can search all users by real_name
CREATE POLICY "Institution supervisors can search all users"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role = 'institution_supervisor'
  )
);
