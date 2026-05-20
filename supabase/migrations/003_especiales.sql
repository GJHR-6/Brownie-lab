-- ============================================================
-- BROWNIE LAB — Tabla especiales del chef
-- ============================================================

CREATE TABLE IF NOT EXISTS public.especiales (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre        TEXT        NOT NULL,
  descripcion   TEXT        NOT NULL,
  emoji         TEXT        NOT NULL DEFAULT '🍪',
  fecha_inicio  DATE        NOT NULL DEFAULT CURRENT_DATE,
  duracion_dias INTEGER     NOT NULL DEFAULT 7 CHECK (duracion_dias > 0),
  activo        BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.especiales ENABLE ROW LEVEL SECURITY;

-- Público solo ve activos
CREATE POLICY "especiales_public_read"
  ON public.especiales FOR SELECT
  USING (activo = true);

-- Admin gestiona todo
CREATE POLICY "especiales_admin_all"
  ON public.especiales FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
