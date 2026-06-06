-- Amplía el CHECK constraint de estado para permitir 'cancelado'
ALTER TABLE public.pedidos
  DROP CONSTRAINT IF EXISTS pedidos_estado_check;

ALTER TABLE public.pedidos
  ADD CONSTRAINT pedidos_estado_check
  CHECK (estado IN ('pendiente', 'preparacion', 'listo', 'completado', 'cancelado'));
