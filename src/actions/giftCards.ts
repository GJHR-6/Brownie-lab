'use server';

import { requireAdmin } from '@/lib/adminAuth';
import { headers } from 'next/headers';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { rateLimitPersistente, getIpFromHeaders } from '@/lib/rate-limit';
import { sanitizeText, sanitizePhone, isValidHonduranPhone, normalizePhone, sanitizePromoCode } from '@/lib/sanitize';
import type { ActionResult } from '@/types/actions';
import type { GiftCard } from '@/types/database';
import { revalidatePath } from 'next/cache';

function generarCodigoGiftCard(): string {
  // Formato: BL-GC-XXXX-XXXX (excluye caracteres ambiguos: 0,O,I,1)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segmento = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `BL-GC-${segmento()}-${segmento()}`;
}

// ── Compra de tarjeta de regalo ───────────────────────────────────────────────

export async function crearGiftCard(input: {
  monto: number;
  comprador_telefono: string;
  destinatario_nombre?: string;
  destinatario_telefono?: string;
  mensaje?: string;
}): Promise<ActionResult<{ codigo: string }>> {
  const ip = getIpFromHeaders(await headers());
  if (!(await rateLimitPersistente(`giftcard:create:${ip}`, 5, 60 * 60 * 1000))) {
    return { success: false, error: 'Demasiados intentos. Intenta más tarde.' };
  }

  if (!Number.isFinite(input.monto) || input.monto < 50 || input.monto > 50000) {
    return { success: false, error: 'Monto inválido.' };
  }

  const compradorPhone = sanitizePhone(input.comprador_telefono);
  if (!isValidHonduranPhone(compradorPhone)) {
    return { success: false, error: 'Ingresa un número hondureño válido para el comprador.' };
  }

  const destinatarioNombre = sanitizeText(input.destinatario_nombre, 80) || null;
  const destinatarioTelefonoRaw = sanitizePhone(input.destinatario_telefono ?? '');
  const destinatarioTelefono = destinatarioTelefonoRaw && isValidHonduranPhone(destinatarioTelefonoRaw)
    ? normalizePhone(destinatarioTelefonoRaw)
    : null;
  const mensaje = sanitizeText(input.mensaje, 300) || null;

  try {
    const supabase = createSupabaseServiceClient();

    let codigo = '';
    for (let intento = 0; intento < 5; intento++) {
      const candidato = generarCodigoGiftCard();
      const { data: existente } = await supabase
        .from('gift_cards')
        .select('id')
        .eq('codigo', candidato)
        .single();
      if (!existente) { codigo = candidato; break; }
    }
    if (!codigo) return { success: false, error: 'No se pudo generar un código único. Intenta de nuevo.' };

    const { error } = await supabase.from('gift_cards').insert({
      codigo,
      monto: input.monto,
      saldo: input.monto,
      estado: 'pendiente',
      destinatario_nombre: destinatarioNombre,
      destinatario_telefono: destinatarioTelefono,
      comprador_telefono: normalizePhone(compradorPhone),
      mensaje,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, data: { codigo } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

// ── Validación pública para preview en checkout ───────────────────────────────

export async function validarGiftCard(
  codigo: string
): Promise<ActionResult<{ codigo: string; saldo: number }>> {
  const ip = getIpFromHeaders(await headers());
  if (!(await rateLimitPersistente(`giftcard:validate:${ip}`, 15, 5 * 60 * 1000))) {
    return { success: false, error: 'Demasiados intentos. Espera unos minutos.' };
  }

  const clean = sanitizePromoCode(codigo);
  if (!clean) return { success: false, error: 'Código inválido.' };

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from('gift_cards')
      .select('codigo, saldo, estado')
      .eq('codigo', clean.toUpperCase())
      .single();

    if (error || !data) return { success: false, error: 'Tarjeta de regalo no encontrada.' };
    if (data.estado !== 'activa') return { success: false, error: 'Esta tarjeta de regalo no está activa todavía.' };
    if (Number(data.saldo) <= 0) return { success: false, error: 'Esta tarjeta de regalo no tiene saldo disponible.' };

    return { success: true, data: { codigo: data.codigo, saldo: Number(data.saldo) } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

// ── Redención server-side (llamada solo desde crearPedidoPublico) ────────────

export async function redimirGiftCard(
  codigo: string,
  monto: number
): Promise<ActionResult<{ saldo_restante: number }>> {
  const clean = sanitizePromoCode(codigo).toUpperCase();
  if (!clean || !Number.isFinite(monto) || monto <= 0) {
    return { success: false, error: 'Tarjeta de regalo inválida.' };
  }

  try {
    const supabase = createSupabaseServiceClient();

    const { data: gc, error: fetchError } = await supabase
      .from('gift_cards')
      .select('id, saldo, estado')
      .eq('codigo', clean)
      .single();

    if (fetchError || !gc) return { success: false, error: 'Tarjeta de regalo no encontrada.' };
    if (gc.estado !== 'activa') return { success: false, error: 'Tarjeta de regalo no activa.' };
    if (Number(gc.saldo) < monto) return { success: false, error: 'Saldo insuficiente en la tarjeta de regalo.' };

    const saldoRestante = Math.round((Number(gc.saldo) - monto) * 100) / 100;
    const nuevoEstado = saldoRestante <= 0 ? 'agotada' : 'activa';

    // Guard atómico: solo actualiza si el saldo sigue siendo suficiente
    // (evita doble redención por solicitudes concurrentes).
    const { data: updated, error: updateError } = await supabase
      .from('gift_cards')
      .update({ saldo: saldoRestante, estado: nuevoEstado, redeemed_at: new Date().toISOString() })
      .eq('id', gc.id)
      .gte('saldo', monto)
      .select('id')
      .single();

    if (updateError || !updated) return { success: false, error: 'No se pudo redimir la tarjeta de regalo (saldo insuficiente).' };

    return { success: true, data: { saldo_restante: saldoRestante } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

// ── Admin ──────────────────────────────────────────────────────────────────

export async function getGiftCardsAdmin(): Promise<GiftCard[]> {
  await requireAdmin();
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('gift_cards')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function confirmarPagoGiftCard(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from('gift_cards')
      .update({ estado: 'activa' })
      .eq('id', id)
      .eq('estado', 'pendiente');

    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/tarjetas-regalo');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function cancelarGiftCard(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from('gift_cards')
      .update({ estado: 'cancelada' })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/tarjetas-regalo');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
