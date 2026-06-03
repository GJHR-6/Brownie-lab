ALTER TABLE public.configuracion
  ADD COLUMN IF NOT EXISTS hero_imagen_url    TEXT,
  ADD COLUMN IF NOT EXISTS nosotros_imagen_url TEXT;
