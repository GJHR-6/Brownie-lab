// Reglas de fecha/hora de entrega — compartidas entre checkout (cliente) y
// validación del servidor. Hora de referencia: Honduras (UTC-6, sin DST).

export interface ConfigPedidos {
  horas_entrega: string[];
  hora_corte: string; // "HH:MM" 24h
}

export const CONFIG_PEDIDOS_DEFAULT: ConfigPedidos = {
  horas_entrega: ['10:00 AM', '3:00 PM'],
  hora_corte: '19:00',
};

export function parseConfigPedidos(raw: { horas_entrega?: unknown; hora_corte?: unknown }): ConfigPedidos {
  const horas = Array.isArray(raw.horas_entrega)
    ? (raw.horas_entrega as unknown[]).filter((h): h is string => typeof h === 'string' && h.trim().length > 0).slice(0, 4)
    : [];
  const corte = typeof raw.hora_corte === 'string' && /^\d{1,2}:\d{2}$/.test(raw.hora_corte)
    ? raw.hora_corte
    : CONFIG_PEDIDOS_DEFAULT.hora_corte;
  return {
    horas_entrega: horas.length > 0 ? horas : CONFIG_PEDIDOS_DEFAULT.horas_entrega,
    hora_corte: corte,
  };
}

// Fecha/hora actual en Honduras, independiente de la TZ del servidor o cliente
function ahoraHonduras(): Date {
  return new Date(Date.now() - 6 * 3600 * 1000);
}

/**
 * Fecha mínima de entrega (YYYY-MM-DD, hora Honduras):
 * - Base: mañana (24 h de anticipación).
 * - Si el pedido se hace a la hora de corte o después: un día extra.
 *   Ej.: corte 19:00 → pedido lunes 8 PM → entrega mínima miércoles.
 */
export function fechaMinimaEntrega(horaCorte: string): string {
  const ahora = ahoraHonduras();
  const [hCorte, mCorte] = horaCorte.split(':').map(Number);
  const pasadoElCorte =
    ahora.getUTCHours() > hCorte ||
    (ahora.getUTCHours() === hCorte && ahora.getUTCMinutes() >= (mCorte || 0));

  const min = new Date(ahora);
  min.setUTCDate(min.getUTCDate() + (pasadoElCorte ? 2 : 1));
  return min.toISOString().slice(0, 10);
}
