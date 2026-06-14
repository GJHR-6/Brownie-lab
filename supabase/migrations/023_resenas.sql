-- Reseñas por producto: envío público (queda pendiente de aprobación) + moderación admin
CREATE TABLE IF NOT EXISTS public.resenas (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID        NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  autor       TEXT        NOT NULL,
  texto       TEXT        NOT NULL,
  estrellas   INTEGER     NOT NULL DEFAULT 5 CHECK (estrellas BETWEEN 1 AND 5),
  aprobado    BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resenas_producto_id ON public.resenas(producto_id);

ALTER TABLE public.resenas ENABLE ROW LEVEL SECURITY;

-- Lectura pública: solo reseñas aprobadas
CREATE POLICY "resenas_public_read" ON public.resenas
  FOR SELECT USING (aprobado = true);

-- Envío público: cualquiera puede crear, pero queda sin aprobar
CREATE POLICY "resenas_public_insert" ON public.resenas
  FOR INSERT WITH CHECK (aprobado = false);

-- Admin: control total (moderación)
CREATE POLICY "resenas_admin_all" ON public.resenas
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
