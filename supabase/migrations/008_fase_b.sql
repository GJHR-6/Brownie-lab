-- Mejora 23: Alérgenos en productos
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS alergenos TEXT[] DEFAULT '{}';

-- Mejora 26: Mínimo de pedido en configuracion
ALTER TABLE public.configuracion ADD COLUMN IF NOT EXISTS pedido_minimo NUMERIC(10,2) DEFAULT 0;

-- Mejora 28: Tiempo estimado en productos
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS tiempo_preparacion TEXT;

-- Mejora 21: Lightbox — no requiere BD (solo frontend)
