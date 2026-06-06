-- Actualiza get_pedidos_por_telefono para incluir los ítems del pedido
CREATE OR REPLACE FUNCTION public.get_pedidos_por_telefono(telefono_input TEXT)
RETURNS TABLE (
  id             UUID,
  estado         TEXT,
  total          NUMERIC,
  created_at     TIMESTAMPTZ,
  nombre_cliente TEXT,
  items          JSONB
)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT
    p.id,
    p.estado,
    p.total,
    p.created_at,
    p.cliente_datos->>'nombre' AS nombre_cliente,
    COALESCE(
      (SELECT jsonb_agg(
         jsonb_build_object(
           'nombre',   pi.nombre_producto,
           'cantidad', pi.cantidad,
           'subtotal', pi.cantidad * pi.precio_unitario
         ) ORDER BY pi.id
       )
       FROM public.pedido_items pi
       WHERE pi.pedido_id = p.id),
      '[]'::jsonb
    ) AS items
  FROM public.pedidos p
  WHERE p.cliente_datos->>'telefono' = telefono_input
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_pedidos_por_telefono TO anon;
