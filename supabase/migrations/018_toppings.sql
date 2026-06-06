-- Agregar imagen_url a ingredientes (para toppings personalizados)
ALTER TABLE public.ingredientes ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- Sembrar los 9 toppings originales (solo si no existen ya como topping)
INSERT INTO public.ingredientes
  (nombre, unidad, tamano_paquete, costo_paquete, precio_extra, es_topping, activo, stock_paquetes)
SELECT
  v.nombre,
  v.unidad,
  v.tamano_paquete::NUMERIC,
  v.costo_paquete::NUMERIC,
  v.precio_extra::NUMERIC,
  true,
  true,
  5
FROM (VALUES
  ('Nueces',               'g',      500,  50.00, 10.00),
  ('Chispas de Chocolate', 'g',      500,  35.00,  5.00),
  ('M&M''s',               'unidad', 100,  35.00,  8.00),
  ('Marshmallows',         'g',      200,  25.00,  6.00),
  ('Coco Rallado',         'g',      200,  18.00,  5.00),
  ('Sal de Mar',           'g',      250,  20.00,  3.00),
  ('Almendras',            'g',      500,  70.00, 10.00),
  ('Oreo Crumbs',          'unidad',  15,  15.00,  8.00),
  ('Fresas',               'g',      500,  40.00, 12.00)
) AS v(nombre, unidad, tamano_paquete, costo_paquete, precio_extra)
WHERE NOT EXISTS (
  SELECT 1 FROM public.ingredientes i
  WHERE i.nombre = v.nombre AND i.es_topping = true
);
