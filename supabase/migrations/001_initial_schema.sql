-- ============================================================
-- BROWNIE LAB — SCHEMA INICIAL
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================


-- ============================================================
-- 1. FUNCIÓN AUXILIAR: is_admin()
--    SECURITY DEFINER para bypassear RLS al consultar admin_users
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
$$;


-- ============================================================
-- 2. FUNCIÓN AUXILIAR: set_updated_at()
--    Trigger para mantener updated_at sincronizado
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ============================================================
-- 3. TABLA: admin_users
--    Registra los usuarios con acceso de superusuario
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id    UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT         NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id)
);


-- ============================================================
-- 4. TABLA: productos
-- ============================================================

CREATE TABLE IF NOT EXISTS public.productos (
  id          UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre      TEXT          NOT NULL,
  descripcion TEXT,
  precio      NUMERIC(10,2) NOT NULL CHECK (precio > 0),
  imagen_url  TEXT,
  stock       INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  disponible  BOOLEAN       NOT NULL DEFAULT true,
  categoria   TEXT          NOT NULL DEFAULT 'clasicas',
  emoji       TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER productos_set_updated_at
  BEFORE UPDATE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- 5. TABLA: pedidos
--    cliente_datos: JSONB con { nombre, telefono, notas? }
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pedidos (
  id            UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_datos JSONB         NOT NULL,
  total         NUMERIC(10,2) NOT NULL CHECK (total > 0),
  estado        TEXT          NOT NULL DEFAULT 'pendiente'
                              CHECK (estado IN ('pendiente', 'preparacion', 'listo', 'completado')),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER pedidos_set_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- 6. TABLA: promociones
-- ============================================================

CREATE TABLE IF NOT EXISTS public.promociones (
  id                   UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo               TEXT        NOT NULL UNIQUE,
  descuento_porcentaje INTEGER     NOT NULL CHECK (descuento_porcentaje BETWEEN 1 AND 100),
  usos_restantes       INTEGER     NOT NULL DEFAULT 1 CHECK (usos_restantes >= 0),
  activa               BOOLEAN     NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 7. TABLA: banners
-- ============================================================

CREATE TABLE IF NOT EXISTS public.banners (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mensaje    TEXT        NOT NULL,
  activo     BOOLEAN     NOT NULL DEFAULT false,
  orden      INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.admin_users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promociones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners      ENABLE ROW LEVEL SECURITY;

-- admin_users: cada usuario solo ve su propio registro
CREATE POLICY "admin_users_self_select"
  ON public.admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- productos: lectura pública, escritura solo admin
CREATE POLICY "productos_public_read"
  ON public.productos FOR SELECT
  USING (true);

CREATE POLICY "productos_admin_insert"
  ON public.productos FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "productos_admin_update"
  ON public.productos FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "productos_admin_delete"
  ON public.productos FOR DELETE
  USING (public.is_admin());

-- pedidos: solo admin
CREATE POLICY "pedidos_admin_all"
  ON public.pedidos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- promociones: solo admin
CREATE POLICY "promociones_admin_all"
  ON public.promociones FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- banners: público ve solo activos; admin ve y gestiona todos
CREATE POLICY "banners_public_read"
  ON public.banners FOR SELECT
  USING (activo = true);

CREATE POLICY "banners_admin_all"
  ON public.banners FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- PASO POST-DEPLOY (manual):
-- Después de hacer login por primera vez con Google, ejecuta:
--
--   INSERT INTO public.admin_users (user_id, email)
--   VALUES ('<tu-uid-de-auth.users>', '<tu-email>');
--
-- El UID lo encuentras en: Authentication > Users en el dashboard
-- ============================================================
