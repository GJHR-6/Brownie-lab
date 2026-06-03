'use server';

import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { rateLimit, getIpFromHeaders } from '@/lib/rate-limit';
import { sanitizeText, sanitizePhone, sanitizePromoCode } from '@/lib/sanitize';
import type { ActionResult } from '@/types/actions';
import type { ClienteDatos, EstadoPedido, PedidoItem } from '@/types/database';

// ── Validar código de promo ───────────────────────────────────────────────────

export async function validarPromocion(
  codigo: string
): Promise<ActionResult<{ codigo: string; descuento_porcentaje: number }>> {
  const ip = getIpFromHeaders(await headers());
  if (!rateLimit(`promo:${ip}`, 10, 5 * 60 * 1000)) {
    return { success: false, error: 'Demasiados intentos. Espera unos minutos.' };
  }

  const clean = sanitizePromoCode(codigo);
  if (!clean) return { success: false, error: 'Código de descuento no válido.' };

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('promociones')
      .select('id, codigo, descuento_porcentaje, usos_restantes, activa')
      .eq('codigo', clean.toUpperCase())
      .single();

    if (error || !data) return { success: false, error: 'Código de descuento no válido.' };
    if (!data.activa)             return { success: false, error: 'Este código ya no está activo.' };
    if (data.usos_restantes <= 0) return { success: false, error: 'Este código no tiene usos disponibles.' };

    await supabase
      .from('promociones')
      .update({ usos_restantes: data.usos_restantes - 1 })
      .eq('id', data.id);

    return { success: true, data: { codigo: data.codigo, descuento_porcentaje: data.descuento_porcentaje } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

// ── Seguimiento de pedido por teléfono ───────────────────────────────────────

export interface PedidoTracking {
  id: string;
  estado: EstadoPedido;
  total: number;
  created_at: string;
  nombre_cliente: string;
}

export async function buscarPedidosPorTelefono(
  telefono: string
): Promise<ActionResult<PedidoTracking[]>> {
  const ip = getIpFromHeaders(await headers());
  if (!rateLimit(`track:${ip}`, 20, 5 * 60 * 1000)) {
    return { success: false, error: 'Demasiados intentos. Espera unos minutos.' };
  }

  const clean = sanitizePhone(telefono);
  if (!clean) return { success: false, error: 'Teléfono inválido.' };

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.rpc('get_pedidos_por_telefono', {
      telefono_input: clean,
    });

    if (error) return { success: false, error: 'Error al buscar pedidos.' };
    return { success: true, data: (data ?? []) as PedidoTracking[] };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

// ── Datos bancarios públicos ──────────────────────────────────────────────────

export async function getConfiguracionBanco(): Promise<{ banco: string; titular: string; numero: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('configuracion')
      .select('banco_nombre, banco_titular, banco_numero')
      .eq('id', 1)
      .single();
    return {
      banco:   data?.banco_nombre  ?? '',
      titular: data?.banco_titular ?? '',
      numero:  data?.banco_numero  ?? '',
    };
  } catch {
    return { banco: '', titular: '', numero: '' };
  }
}

// ── Crear pedido desde checkout público ──────────────────────────────────────

export async function crearPedidoPublico(
  clienteDatos: ClienteDatos,
  items: PedidoItem[],
  total: number,
  promo?: { codigo: string; descuento_porcentaje: number } | null,
  idempotencyKey?: string
): Promise<ActionResult<{ id: string }>> {
  const ip = getIpFromHeaders(await headers());
  if (!rateLimit(`order:${ip}`, 5, 60 * 60 * 1000)) {
    return { success: false, error: 'Demasiados pedidos. Intenta más tarde.' };
  }

  // Sanitize all string fields from clienteDatos
  const nombre    = sanitizeText(clienteDatos.nombre,    120);
  const telefono  = sanitizePhone(clienteDatos.telefono);
  const direccion = sanitizeText(clienteDatos.direccion, 300);
  const notas     = sanitizeText(clienteDatos.notas,     500);

  if (!nombre || !telefono) {
    return { success: false, error: 'Nombre y teléfono requeridos.' };
  }
  if (!items.length || items.length > 100) {
    return { success: false, error: 'El carrito está vacío o tiene demasiados items.' };
  }
  if (typeof total !== 'number' || total <= 0 || total > 1_000_000) {
    return { success: false, error: 'Total inválido.' };
  }

  const sanitizedDatos: ClienteDatos = {
    ...clienteDatos,
    nombre,
    telefono,
    direccion,
    notas,
  };

  try {
    const supabase = await createSupabaseServerClient();

    const nota_promo = promo
      ? `Descuento ${sanitizePromoCode(promo.codigo)} (${promo.descuento_porcentaje}%)`
      : undefined;

    const datos = nota_promo
      ? { ...sanitizedDatos, notas: [sanitizedDatos.notas, nota_promo].filter(Boolean).join(' | ') }
      : sanitizedDatos;

    const row: Record<string, unknown> = { cliente_datos: datos, items, total, estado: 'pendiente' };
    if (idempotencyKey) row.idempotency_key = idempotencyKey;

    const { data, error } = await supabase
      .from('pedidos')
      .insert(row)
      .select('id')
      .single();

    // Unique violation on idempotency_key → return the already-created order.
    if (error?.code === '23505' && idempotencyKey) {
      const { data: existing } = await supabase
        .from('pedidos')
        .select('id')
        .eq('idempotency_key', idempotencyKey)
        .single();
      if (existing) return { success: true, data: { id: existing.id } };
    }

    if (error) return { success: false, error: error.message };
    return { success: true, data: { id: data.id } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

// ── Subir comprobante de pago ─────────────────────────────────────────────────

export async function subirComprobante(
  pedidoId: string,
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const ip = getIpFromHeaders(await headers());
  if (!rateLimit(`comprobante:${ip}`, 5, 60 * 60 * 1000)) {
    return { success: false, error: 'Demasiados intentos.' };
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pedidoId)) {
    return { success: false, error: 'ID de pedido inválido.' };
  }

  const file = formData.get('comprobante') as File | null;
  if (!file || file.size === 0) return { success: false, error: 'Archivo requerido.' };
  if (file.size > 10 * 1024 * 1024) return { success: false, error: 'Archivo muy grande (máx. 10 MB).' };
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
    return { success: false, error: 'Solo imágenes (PNG, JPG, WEBP).' };
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data: pedido } = await supabase
      .from('pedidos')
      .select('id, comprobante_url')
      .eq('id', pedidoId)
      .single();

    if (!pedido) return { success: false, error: 'Pedido no encontrado.' };
    if (pedido.comprobante_url) return { success: true, data: { url: pedido.comprobante_url } };

    const service = createSupabaseServiceClient();
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `comprobantes/${pedidoId}.${ext}`;

    const { error: uploadError } = await service.storage
      .from('product-images')
      .upload(path, file, { upsert: true });

    if (uploadError) return { success: false, error: `Error al subir: ${uploadError.message}` };

    const { data: { publicUrl } } = service.storage.from('product-images').getPublicUrl(path);

    const { error: dbError } = await supabase
      .from('pedidos')
      .update({ comprobante_url: publicUrl })
      .eq('id', pedidoId);

    if (dbError) return { success: false, error: dbError.message };

    return { success: true, data: { url: publicUrl } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
