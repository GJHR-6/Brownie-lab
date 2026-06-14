-- Permite que cualquier persona envíe un testimonio general (queda pendiente de aprobación)
CREATE POLICY "testimonios_public_insert" ON public.testimonios
  FOR INSERT WITH CHECK (aprobado = false);
