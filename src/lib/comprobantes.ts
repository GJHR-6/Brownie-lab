import type { SupabaseClient } from '@supabase/supabase-js';

// Bucket PRIVADO — los comprobantes de pago son datos financieros del cliente
// y solo deben verse vía signed URLs generadas server-side para el admin.
export const COMPROBANTES_BUCKET = 'comprobantes';

const HORA = 60 * 60;
export const COMPROBANTE_URL_TTL = HORA;            // vista en admin
export const COMPROBANTE_EMAIL_TTL = 7 * 24 * HORA; // link en correo de notificación

// Extensión derivada del MIME validado (no del nombre del archivo)
export const COMPROBANTE_EXT_POR_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg':  'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
};

export const COMPROBANTE_MAX_BYTES = 10 * 1024 * 1024;

/**
 * Resuelve el valor guardado en pedidos.comprobante_url a una URL visible.
 * - Valores legacy (URLs públicas completas, empiezan con http) pasan tal cual.
 * - Valores nuevos son paths dentro del bucket privado → signed URL.
 */
export async function resolveComprobanteUrl(
  service: SupabaseClient,
  stored: string | null | undefined,
  expiresIn: number = COMPROBANTE_URL_TTL
): Promise<string | null> {
  if (!stored) return null;
  if (/^https?:\/\//i.test(stored)) return stored;

  const { data } = await service.storage
    .from(COMPROBANTES_BUCKET)
    .createSignedUrl(stored, expiresIn);
  return data?.signedUrl ?? null;
}
