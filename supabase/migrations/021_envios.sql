-- ============================================================
-- ENVÍOS A DOMICILIO: sedes con coordenadas + tarifa por km
-- ============================================================

-- Sedes de despacho (JSONB: [{ nombre, lat, lng, tarifa_base }])
-- Defaults: centros de SPS y El Progreso — ajustar coords reales en el panel admin.
ALTER TABLE public.configuracion
  ADD COLUMN IF NOT EXISTS envio_sedes JSONB NOT NULL DEFAULT '[
    { "nombre": "San Pedro Sula", "lat": 15.5042, "lng": -88.0250, "tarifa_base": 50 },
    { "nombre": "El Progreso",    "lat": 15.4000, "lng": -87.8067, "tarifa_base": 50 }
  ]'::jsonb,
  ADD COLUMN IF NOT EXISTS envio_por_km       NUMERIC(10,2) NOT NULL DEFAULT 10 CHECK (envio_por_km >= 0),
  ADD COLUMN IF NOT EXISTS envio_factor_ruta  NUMERIC(4,2)  NOT NULL DEFAULT 1.3 CHECK (envio_factor_ruta >= 1),
  ADD COLUMN IF NOT EXISTS envio_km_max       NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (envio_km_max >= 0),
  ADD COLUMN IF NOT EXISTS envio_gratis_monto NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (envio_gratis_monto >= 0);

COMMENT ON COLUMN public.configuracion.envio_sedes        IS 'Sedes de despacho: [{nombre, lat, lng, tarifa_base}]';
COMMENT ON COLUMN public.configuracion.envio_por_km       IS 'Lempiras por km (sobre distancia haversine × factor de ruta)';
COMMENT ON COLUMN public.configuracion.envio_factor_ruta  IS 'Factor línea recta → ruta real en ciudad (típico 1.3)';
COMMENT ON COLUMN public.configuracion.envio_km_max       IS 'Distancia máxima de entrega en km. 0 = sin límite';
COMMENT ON COLUMN public.configuracion.envio_gratis_monto IS 'Subtotal desde el cual el envío es gratis. 0 = nunca gratis';

-- Costo de envío cobrado en el pedido (columna real para reportes)
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS costo_envio NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (costo_envio >= 0);
