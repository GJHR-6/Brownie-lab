ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS comprobante_url TEXT;
