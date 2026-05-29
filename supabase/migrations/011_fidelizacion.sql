-- ── Clientes ───────────────────────────────────────────────────────────────────
CREATE TABLE clientes (
  telefono          text        PRIMARY KEY,
  nombre            text        NOT NULL DEFAULT '',
  compras_actuales  int         NOT NULL DEFAULT 0
                                CHECK (compras_actuales BETWEEN 0 AND 10),
  compras_totales   int         NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_clientes
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Cupones ────────────────────────────────────────────────────────────────────
CREATE TABLE cupones (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  telefono_cliente  text        NOT NULL REFERENCES clientes(telefono) ON DELETE CASCADE,
  codigo_unico      text        NOT NULL UNIQUE,
  estado            text        NOT NULL DEFAULT 'DISPONIBLE'
                                CHECK (estado IN ('DISPONIBLE', 'UTILIZADO')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  used_at           timestamptz
);

CREATE INDEX idx_cupones_telefono ON cupones(telefono_cliente);
CREATE INDEX idx_cupones_codigo   ON cupones(codigo_unico);
CREATE INDEX idx_cupones_estado   ON cupones(estado);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupones  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública clientes"
  ON clientes FOR SELECT USING (true);

CREATE POLICY "Lectura pública cupones"
  ON cupones FOR SELECT USING (true);

CREATE POLICY "Admin full access clientes"
  ON clientes FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin full access cupones"
  ON cupones FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
