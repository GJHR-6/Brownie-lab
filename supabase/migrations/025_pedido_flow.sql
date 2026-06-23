-- ============================================================
-- FLUJO "EMPIEZA TU PEDIDO": zonas de envío, OTP, tarjetas de
-- regalo y solicitudes de catering
-- ============================================================

-- 1. MODO DE ENVÍO GLOBAL (distancia GPS vs. zonas con tarifa plana)
ALTER TABLE public.configuracion
  ADD COLUMN IF NOT EXISTS envio_modo TEXT NOT NULL DEFAULT 'distancia'
    CHECK (envio_modo IN ('distancia', 'zonas'));

COMMENT ON COLUMN public.configuracion.envio_modo IS 'distancia = cálculo GPS (lib/envio.ts); zonas = tarifa plana por delivery_zones';

-- 2. ZONAS DE ENVÍO (tarifa plana)
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id          UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre      TEXT          NOT NULL,
  descripcion TEXT,
  tarifa      NUMERIC(10,2) NOT NULL CHECK (tarifa >= 0),
  activa      BOOLEAN       NOT NULL DEFAULT true,
  orden       INTEGER       NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_zones_activa ON public.delivery_zones(activa);

CREATE TRIGGER delivery_zones_set_updated_at
  BEFORE UPDATE ON public.delivery_zones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery_zones_public_read" ON public.delivery_zones FOR SELECT USING (activa = true);
CREATE POLICY "delivery_zones_admin_all"   ON public.delivery_zones FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. CÓDIGOS OTP (solo service role — sin RLS pública)
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telefono     TEXT        NOT NULL,
  code_hash    TEXT        NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  attempts     INTEGER     NOT NULL DEFAULT 0,
  verified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_telefono ON public.otp_codes(telefono, created_at DESC);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
-- Sin políticas públicas: solo accesible vía service role desde server actions.

-- 4. TARJETAS DE REGALO
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id                     UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo                 TEXT          NOT NULL UNIQUE,
  monto                  NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  saldo                  NUMERIC(10,2) NOT NULL CHECK (saldo >= 0),
  estado                 TEXT          NOT NULL DEFAULT 'pendiente'
                                       CHECK (estado IN ('pendiente', 'activa', 'agotada', 'cancelada')),
  destinatario_nombre    TEXT,
  destinatario_telefono  TEXT,
  comprador_telefono     TEXT          NOT NULL,
  mensaje                TEXT,
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  redeemed_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_codigo  ON public.gift_cards(codigo);
CREATE INDEX IF NOT EXISTS idx_gift_cards_estado   ON public.gift_cards(estado);

ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
-- Sin lectura/escritura pública directa: validación y redención pasan por
-- server actions con service role (validarGiftCard / redimirGiftCard).
CREATE POLICY "gift_cards_admin_all" ON public.gift_cards FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. SOLICITUDES DE CATERING
CREATE TABLE IF NOT EXISTS public.catering_solicitudes (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_evento     TEXT        NOT NULL,
  rango_personas  TEXT        NOT NULL,
  fecha_evento    DATE        NOT NULL,
  sede_cercana    TEXT,
  detalles        TEXT,
  cliente_nombre  TEXT        NOT NULL,
  cliente_telefono TEXT       NOT NULL,
  estado          TEXT        NOT NULL DEFAULT 'nueva'
                              CHECK (estado IN ('nueva', 'contactado', 'cotizado', 'cerrada')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catering_solicitudes_estado ON public.catering_solicitudes(estado);

ALTER TABLE public.catering_solicitudes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catering_solicitudes_public_insert" ON public.catering_solicitudes FOR INSERT WITH CHECK (true);
CREATE POLICY "catering_solicitudes_admin_all"      ON public.catering_solicitudes FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
