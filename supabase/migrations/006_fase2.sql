-- ============================================================
-- FASE 2: Categorías, stats promo, disponibilidad, seguimiento
-- ============================================================

-- 1. CATEGORÍAS
CREATE TABLE IF NOT EXISTS public.categorias (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre      TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  orden       INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categorias_public_read" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "categorias_admin_all"   ON public.categorias FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.categorias (nombre, slug, orden) VALUES
  ('Clásicas',   'clasicas',   1),
  ('Brownies',   'brownies',   2),
  ('Especiales', 'especiales', 3)
ON CONFLICT (slug) DO NOTHING;

-- 2. USOS ORIGINALES en promociones
ALTER TABLE public.promociones ADD COLUMN IF NOT EXISTS usos_originales INTEGER;
UPDATE public.promociones SET usos_originales = usos_restantes WHERE usos_originales IS NULL;

-- 3. DISPONIBILIDAD PROGRAMADA en productos
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS disponible_desde DATE;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS disponible_hasta DATE;

-- 4. FUNCIÓN DE SEGUIMIENTO (SECURITY DEFINER: bypasses RLS, solo devuelve campos seguros)
CREATE OR REPLACE FUNCTION public.get_pedidos_por_telefono(telefono_input TEXT)
RETURNS TABLE (
  id           UUID,
  estado       TEXT,
  total        NUMERIC,
  created_at   TIMESTAMPTZ,
  nombre_cliente TEXT
)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT
    p.id,
    p.estado,
    p.total,
    p.created_at,
    p.cliente_datos->>'nombre' AS nombre_cliente
  FROM public.pedidos p
  WHERE p.cliente_datos->>'telefono' = telefono_input
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_pedidos_por_telefono TO anon;
