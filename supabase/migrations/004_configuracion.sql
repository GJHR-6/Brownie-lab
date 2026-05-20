-- ============================================================
-- BROWNIE LAB — Tabla configuracion (singleton)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.configuracion (
  id           INTEGER     NOT NULL DEFAULT 1 PRIMARY KEY,
  nombre       TEXT        NOT NULL DEFAULT 'Brownie Lab',
  tagline      TEXT        NOT NULL DEFAULT 'Horneado con amor, cada galleta cuenta',
  descripcion  TEXT,
  whatsapp     TEXT        NOT NULL DEFAULT '',
  instagram    TEXT        NOT NULL DEFAULT '',
  facebook     TEXT        NOT NULL DEFAULT '',
  tiktok       TEXT        NOT NULL DEFAULT '',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT singleton CHECK (id = 1)
);

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "configuracion_public_read"
  ON public.configuracion FOR SELECT USING (true);

CREATE POLICY "configuracion_admin_update"
  ON public.configuracion FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "configuracion_admin_insert"
  ON public.configuracion FOR INSERT
  WITH CHECK (public.is_admin());

-- Fila inicial con los valores actuales del proyecto
INSERT INTO public.configuracion (id, nombre, tagline, whatsapp, instagram, facebook, tiktok)
VALUES (
  1,
  'Brownie Lab',
  'Horneado con amor, cada galleta cuenta',
  '50431534704',
  'https://instagram.com/brownielab',
  'https://facebook.com/brownielab',
  ''
)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_configuracion_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER configuracion_set_updated_at
  BEFORE UPDATE ON public.configuracion
  FOR EACH ROW EXECUTE FUNCTION public.set_configuracion_updated_at();
