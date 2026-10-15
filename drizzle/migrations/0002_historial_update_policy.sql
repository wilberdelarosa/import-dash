GRANT UPDATE ON public.historial_eventos TO authenticated;
CREATE POLICY "Admin supervisor update historial" ON public.historial_eventos FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'supervisor'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'supervisor'));