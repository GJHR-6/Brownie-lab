-- Vincula un especial (Capricho del Chef) a un producto del catálogo.
-- Permite que la landing enlace a /menu/[producto_id] y agregue al carrito.
ALTER TABLE public.especiales
  ADD COLUMN IF NOT EXISTS producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL;
