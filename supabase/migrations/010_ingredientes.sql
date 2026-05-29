-- ── Tabla ingredientes ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingredientes (
  id                   uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre               text          NOT NULL,
  descripcion_paquete  text,
  unidad               text          NOT NULL DEFAULT 'g',
  tamano_paquete       numeric(10,2) NOT NULL,
  costo_paquete        numeric(10,2) NOT NULL DEFAULT 0,
  costo_por_unidad     numeric(10,4) GENERATED ALWAYS AS (costo_paquete / NULLIF(tamano_paquete, 0)) STORED,
  cantidad_por_bandeja numeric(10,2),
  costo_por_bandeja    numeric(10,2),
  stock_paquetes       numeric(10,2) NOT NULL DEFAULT 0,
  es_topping           boolean       NOT NULL DEFAULT false,
  activo               boolean       NOT NULL DEFAULT true,
  notas                text,
  created_at           timestamptz   NOT NULL DEFAULT now(),
  updated_at           timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE ingredientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on ingredientes"
  ON ingredientes FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TRIGGER set_updated_at_ingredientes
  BEFORE UPDATE ON ingredientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Datos base de la receta ────────────────────────────────────────────────────
INSERT INTO ingredientes (nombre, descripcion_paquete, unidad, tamano_paquete, costo_paquete, cantidad_por_bandeja, costo_por_bandeja, es_topping, notas) VALUES
  ('Chocolate Costa 60%',        'Barra 80g',             'g',      80,   63.00, 160, 126.00, false, '2 barras por bandeja'),
  ('Huevos talla grande',        'Cartón 30 unidades',    'unidad', 30,  101.00,   3,  10.10, false, null),
  ('Mantequilla sin sal',        'Barra 100g',            'g',     100,   36.00, 100,  36.00, false, null),
  ('Azúcar moreno doña Matilde', 'Bolsa 1800g',           'g',    1800,   62.00,  75,   2.58, false, null),
  ('Azúcar blanco el Cañal',     'Bolsa 1800g',           'g',    1800,   53.00, 160,   4.71, false, null),
  ('Sal del Pacífico',           'Bolsa 200g',            'g',     200,    4.00,  10,   0.20, false, null),
  ('Café instantáneo Nescafé',   'Frasco 200g',           'g',     200,  250.00,  12,  15.00, false, null),
  ('Harina de trigo Manhattan',  'Bolsa 2268g',           'g',    2268,   62.00,  90,   2.46, false, null),
  ('Cacao amargo Hershey''s',    'Lata 652g',             'g',     652,  455.00,  30,  20.93, false, null),
  ('Nueces pecan Diamond',       'Bolsa 907g',            'g',     907,  365.00,  35,  14.09, true,  'Topping base del brownie clásico'),
  ('Chispas de chocolate',       'Bolsa 340g (12 oz)',    'g',     340,  190.00,  35,  19.56, true,  'Topping base del brownie clásico'),
  ('Vainilla don Julio',         'Botella 473mL (16 oz)', 'mL',    473,   42.00,  15,   1.33, false, null),
  -- Toppings adicionales (precio pendiente de registrar)
  ('Galletas Oreo',              'Paquete',               'g',       1,    0.00, null,   null, true,  'Precio pendiente — actualizar al comprar'),
  ('M&Ms',                       'Bolsa',                 'g',       1,    0.00, null,   null, true,  'Precio pendiente — actualizar al comprar'),
  ('Dulce de leche / Arequipe',  'Frasco',                'g',       1,    0.00, null,   null, true,  'Precio pendiente — actualizar al comprar');
