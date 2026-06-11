-- ============================================================
-- FASE 2 CONTABLE: costo de producto, gastos, método de pago
-- ============================================================

-- 1. Costo de producto (COGS) — para calcular margen bruto
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS costo NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (costo >= 0);

COMMENT ON COLUMN public.productos.costo IS 'Costo de producción por unidad (ingredientes + empaque). 0 = sin definir.';

-- 2. Promover metodo_pago y descuento a columnas reales en pedidos
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS metodo_pago TEXT
    CHECK (metodo_pago IS NULL OR metodo_pago IN ('efectivo', 'transferencia')),
  ADD COLUMN IF NOT EXISTS descuento NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (descuento >= 0);

-- Backfill desde el JSON cliente_datos (solo valores válidos)
UPDATE public.pedidos
SET metodo_pago = cliente_datos->>'metodo_pago'
WHERE metodo_pago IS NULL
  AND cliente_datos->>'metodo_pago' IN ('efectivo', 'transferencia');

CREATE INDEX IF NOT EXISTS idx_pedidos_metodo_pago ON public.pedidos(metodo_pago);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at  ON public.pedidos(created_at);

-- 3. Tabla de gastos operativos
CREATE TABLE IF NOT EXISTS public.gastos (
  id         UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha      DATE          NOT NULL DEFAULT CURRENT_DATE,
  categoria  TEXT          NOT NULL DEFAULT 'otros'
                           CHECK (categoria IN ('ingredientes', 'empaque', 'delivery', 'servicios', 'equipo', 'marketing', 'otros')),
  monto      NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  nota       TEXT,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gastos_fecha     ON public.gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON public.gastos(categoria);

CREATE TRIGGER gastos_set_updated_at
  BEFORE UPDATE ON public.gastos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: solo admin
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gastos_admin_all"
  ON public.gastos FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
