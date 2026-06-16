// Cálculo de costo de envío — funciones puras, compartidas entre cliente y servidor.
// Distancia: haversine (línea recta) × factor de ruta ≈ distancia real en ciudad.
// Sin APIs externas — la ubicación del cliente viene del GPS del navegador.

export interface SedeEnvio {
  nombre: string;
  lat: number;
  lng: number;
  tarifa_base: number;
}

export interface ConfigEnvio {
  sedes: SedeEnvio[];
  por_km: number;
  factor_ruta: number;
  km_max: number;        // 0 = sin límite
  gratis_desde: number;  // 0 = nunca gratis
}

export interface ResultadoEnvio {
  sede: SedeEnvio;
  distancia_km: number;  // ya con factor de ruta aplicado
  costo: number;         // 0 si aplica envío gratis
  gratis: boolean;
  fueraDeRango: boolean;
}

const R_TIERRA_KM = 6371;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_TIERRA_KM * Math.asin(Math.sqrt(a));
}

export function sedeMasCercana(sedes: SedeEnvio[], lat: number, lng: number): { sede: SedeEnvio; km: number } | null {
  let mejor: { sede: SedeEnvio; km: number } | null = null;
  for (const sede of sedes) {
    const km = haversineKm(sede.lat, sede.lng, lat, lng);
    if (!mejor || km < mejor.km) mejor = { sede, km };
  }
  return mejor;
}

// Redondea hacia arriba al múltiplo de 5 más cercano (precios "limpios")
function redondear5(n: number): number {
  return Math.ceil(n / 5) * 5;
}

/**
 * Costo con ubicación GPS del cliente.
 * costo = tarifa_base de la sede + km × por_km, redondeado a múltiplo de 5.
 */
export function calcularEnvio(config: ConfigEnvio, lat: number, lng: number, subtotal: number): ResultadoEnvio | null {
  const cercana = sedeMasCercana(config.sedes, lat, lng);
  if (!cercana) return null;

  const distancia_km = Math.round(cercana.km * config.factor_ruta * 10) / 10;
  const fueraDeRango = config.km_max > 0 && distancia_km > config.km_max;
  const gratis = config.gratis_desde > 0 && subtotal >= config.gratis_desde;
  const bruto = Number(cercana.sede.tarifa_base) + distancia_km * Number(config.por_km);
  const costo = gratis ? 0 : redondear5(bruto);

  return { sede: cercana.sede, distancia_km, costo, gratis, fueraDeRango };
}

/**
 * Fallback sin GPS: el cliente elige la sede manualmente → envío sin costo
 * (no se cobra distancia porque no se conoce la ubicación real del cliente).
 */
export function calcularEnvioPorSede(config: ConfigEnvio, nombreSede: string, subtotal: number): ResultadoEnvio | null {
  const sede = config.sedes.find(s => s.nombre === nombreSede);
  if (!sede) return null;

  return { sede, distancia_km: 0, costo: 0, gratis: true, fueraDeRango: false };
}

// Normaliza el JSONB crudo de la BD a ConfigEnvio tipado
export function parseConfigEnvio(raw: {
  envio_sedes?: unknown;
  envio_por_km?: unknown;
  envio_factor_ruta?: unknown;
  envio_km_max?: unknown;
  envio_gratis_monto?: unknown;
}): ConfigEnvio {
  const sedes = Array.isArray(raw.envio_sedes)
    ? (raw.envio_sedes as Array<Record<string, unknown>>)
        .filter(s => typeof s.nombre === 'string' && Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng)))
        .map(s => ({
          nombre: s.nombre as string,
          lat: Number(s.lat),
          lng: Number(s.lng),
          tarifa_base: Math.max(0, Number(s.tarifa_base ?? 0)),
        }))
    : [];
  return {
    sedes,
    por_km: Math.max(0, Number(raw.envio_por_km ?? 0)),
    factor_ruta: Math.max(1, Number(raw.envio_factor_ruta ?? 1.3)),
    km_max: Math.max(0, Number(raw.envio_km_max ?? 0)),
    gratis_desde: Math.max(0, Number(raw.envio_gratis_monto ?? 0)),
  };
}
