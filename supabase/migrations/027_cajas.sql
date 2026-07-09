-- ── Tabla cajas ────────────────────────────────────────────────────────────────
-- "Arma tu caja": cajas de N postres con % de descuento sobre la suma de items.
-- El contenido elegido no se persiste como filas; viaja en el nombre del item
-- del pedido (igual que los postres personalizados).

CREATE TABLE IF NOT EXISTS public.cajas (
  id            uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  slug          text          NOT NULL UNIQUE,
  nombre        text          NOT NULL,
  descripcion   text          NOT NULL DEFAULT '',
  tamano        integer       NOT NULL CHECK (tamano BETWEEN 2 AND 24),
  descuento_pct numeric(5,2)  NOT NULL DEFAULT 0 CHECK (descuento_pct >= 0 AND descuento_pct < 100),
  imagen_url    text          NOT NULL DEFAULT '',
  activo        boolean       NOT NULL DEFAULT true,
  orden         integer       NOT NULL DEFAULT 0,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.cajas ENABLE ROW LEVEL SECURITY;

-- Lectura pública (la página /cajas es accesible sin login)
CREATE POLICY "cajas_public_read"
  ON public.cajas FOR SELECT
  USING (true);

-- Escritura/borrado solo admins
CREATE POLICY "cajas_admin_write"
  ON public.cajas FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER set_updated_at_cajas
  BEFORE UPDATE ON public.cajas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Semilla: dos cajas de ejemplo, editables desde admin
INSERT INTO public.cajas (slug, nombre, descripcion, tamano, descuento_pct, activo, orden)
VALUES
  ('caja-de-4', 'Caja de 4', 'Elige 4 postres y ahorra', 4, 10.00, true, 1),
  ('caja-de-6', 'Caja de 6', 'Elige 6 postres y ahorra más', 6, 15.00, true, 2)
ON CONFLICT (slug) DO NOTHING;
