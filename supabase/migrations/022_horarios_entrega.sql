-- ============================================================
-- HORARIOS DE ENTREGA: franjas seleccionables + hora de corte
-- ============================================================

ALTER TABLE public.configuracion
  -- Franjas de hora que el cliente puede elegir en el checkout (máx. recomendado: 2)
  ADD COLUMN IF NOT EXISTS horas_entrega JSONB NOT NULL DEFAULT '["10:00 AM", "3:00 PM"]'::jsonb,
  -- Hora de corte (formato HH:MM, 24h, hora Honduras). Pedidos después de esta hora
  -- empujan la fecha mínima de entrega un día extra.
  ADD COLUMN IF NOT EXISTS hora_corte TEXT NOT NULL DEFAULT '19:00';

COMMENT ON COLUMN public.configuracion.horas_entrega IS 'Franjas de entrega seleccionables en checkout: ["10:00 AM", "3:00 PM"]';
COMMENT ON COLUMN public.configuracion.hora_corte    IS 'HH:MM 24h hora Honduras. Pedido después del corte → entrega mínima +1 día extra';
