-- ── Tabla personaliza_variantes ────────────────────────────────────────────────
-- Variantes de base del personalizador (brownie/galleta) gestionables desde admin

CREATE TABLE IF NOT EXISTS public.personaliza_variantes (
  id           uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  base         text          NOT NULL CHECK (base IN ('brownie', 'galleta')),
  slug         text          NOT NULL,
  nombre       text          NOT NULL,
  descripcion  text          NOT NULL DEFAULT '',
  precio       numeric(10,2) NOT NULL CHECK (precio > 0),
  imagen_url   text          NOT NULL DEFAULT '',
  proximamente boolean       NOT NULL DEFAULT false,
  activo       boolean       NOT NULL DEFAULT true,
  orden        integer       NOT NULL DEFAULT 0,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (base, slug)
);

ALTER TABLE public.personaliza_variantes ENABLE ROW LEVEL SECURITY;

-- Lectura pública (la página /personaliza es accesible sin login)
CREATE POLICY "personaliza_variantes_public_read"
  ON public.personaliza_variantes FOR SELECT
  USING (true);

-- Escritura/borrado solo admins
CREATE POLICY "personaliza_variantes_admin_write"
  ON public.personaliza_variantes FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER set_updated_at_personaliza_variantes
  BEFORE UPDATE ON public.personaliza_variantes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Semilla: migración de datos hardcodeados → base de datos
INSERT INTO public.personaliza_variantes (base, slug, nombre, descripcion, precio, imagen_url, proximamente, activo, orden)
VALUES
  ('brownie', 'clasico',    'Clásico',    'Denso y húmedo',        40.00, '/art/brownie-clasico.svg',   false, true, 1),
  ('brownie', 'con-nuez',   'Con Nuez',   'Con nuez tostada',      45.00, '/art/brownie-nuez.svg',      false, true, 2),
  ('galleta', 'clasica',    'Clásica',    'Mantequilla horneada',  35.00, '/art/galleta-clasica.svg',   false, true, 1),
  ('galleta', 'mocca',      'Mocca',      'Café y chocolate',      35.00, '/art/galleta-mocca.svg',     true,  true, 2),
  ('galleta', 'red-velvet', 'Red Velvet', 'Terciopelo rojo',       35.00, '/art/galleta-redvelvet.svg', true,  true, 3)
ON CONFLICT (base, slug) DO NOTHING;

-- Fix: la página /personaliza necesita leer toppings como visitante anónimo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'ingredientes'
      AND policyname = 'ingredientes_public_read_toppings'
  ) THEN
    CREATE POLICY "ingredientes_public_read_toppings"
      ON public.ingredientes FOR SELECT
      USING (es_topping = true AND activo = true);
  END IF;
END $$;
