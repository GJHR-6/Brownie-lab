-- ============================================================
-- FASE 3: Testimonios, actividad log, push subscriptions
-- ============================================================

-- 1. TESTIMONIOS
CREATE TABLE IF NOT EXISTS public.testimonios (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  autor      TEXT        NOT NULL,
  texto      TEXT        NOT NULL,
  estrellas  INTEGER     NOT NULL DEFAULT 5 CHECK (estrellas BETWEEN 1 AND 5),
  aprobado   BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.testimonios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "testimonios_public_read" ON public.testimonios FOR SELECT USING (aprobado = true);
CREATE POLICY "testimonios_admin_all"   ON public.testimonios FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2. REGISTRO DE ACTIVIDAD (solo admin)
CREATE TABLE IF NOT EXISTS public.actividad_log (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_email TEXT,
  tipo          TEXT        NOT NULL,
  descripcion   TEXT        NOT NULL,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.actividad_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "actividad_admin_read" ON public.actividad_log FOR SELECT USING (public.is_admin());
CREATE POLICY "actividad_service_insert" ON public.actividad_log FOR INSERT WITH CHECK (true);

-- 3. PUSH SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint   TEXT        NOT NULL UNIQUE,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_admin_all" ON public.push_subscriptions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "push_public_insert" ON public.push_subscriptions FOR INSERT WITH CHECK (true);
