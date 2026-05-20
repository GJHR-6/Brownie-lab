-- Agrega campo items (JSONB) a pedidos para guardar líneas del pedido
-- Nullable: pedidos existentes no se rompen
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS items JSONB;
