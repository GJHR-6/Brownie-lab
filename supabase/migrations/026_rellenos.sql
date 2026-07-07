-- ── Rellenos ──────────────────────────────────────────────────────────────────
-- Los rellenos viven en `ingredientes` igual que los toppings (es_topping),
-- con su propio flag. Selección única en /personaliza, solo para galletas.

ALTER TABLE public.ingredientes ADD COLUMN IF NOT EXISTS es_relleno boolean NOT NULL DEFAULT false;

-- La página /personaliza lee rellenos como visitante anónimo
-- (las policies de SELECT se combinan con OR, igual que ingredientes_public_read_toppings)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'ingredientes'
      AND policyname = 'ingredientes_public_read_rellenos'
  ) THEN
    CREATE POLICY "ingredientes_public_read_rellenos"
      ON public.ingredientes FOR SELECT
      USING (es_relleno = true AND activo = true);
  END IF;
END $$;
