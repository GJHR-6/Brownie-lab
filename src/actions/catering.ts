'use server';

import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { rateLimit, getIpFromHeaders } from '@/lib/rate-limit';
import { sanitizeText, sanitizePhone, isValidHonduranPhone, normalizePhone } from '@/lib/sanitize';
import type { ActionResult } from '@/types/actions';
import type { CateringSolicitud, EstadoCatering } from '@/types/database';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');
}

export async function crearSolicitudCatering(input: {
  tipo_evento: string;
  rango_personas: string;
  fecha_evento: string;
  sede_cercana?: string;
  detalles?: string;
  cliente_nombre: string;
  cliente_telefono: string;
}): Promise<ActionResult<{ id: string }>> {
  const ip = getIpFromHeaders(await headers());
  if (!rateLimit(`catering:create:${ip}`, 5, 60 * 60 * 1000)) {
    return { success: false, error: 'Demasiados intentos. Intenta más tarde.' };
  }

  const tipoEvento = sanitizeText(input.tipo_evento, 80);
  const rangoPersonas = sanitizeText(input.rango_personas, 40);
  const sedeCercana = sanitizeText(input.sede_cercana, 80) || null;
  const detalles = sanitizeText(input.detalles, 500) || null;
  const clienteNombre = sanitizeText(input.cliente_nombre, 120);
  const clientePhone = sanitizePhone(input.cliente_telefono);

  if (!tipoEvento || !rangoPersonas) return { success: false, error: 'Completa el tipo de evento y rango de personas.' };
  if (!clienteNombre || clienteNombre.length < 2) return { success: false, error: 'Nombre requerido.' };
  if (!isValidHonduranPhone(clientePhone)) return { success: false, error: 'Ingresa un número hondureño válido.' };
  if (!input.fecha_evento || Number.isNaN(Date.parse(input.fecha_evento))) return { success: false, error: 'Fecha de evento inválida.' };

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.from('catering_solicitudes').insert({
      tipo_evento: tipoEvento,
      rango_personas: rangoPersonas,
      fecha_evento: input.fecha_evento,
      sede_cercana: sedeCercana,
      detalles,
      cliente_nombre: clienteNombre,
      cliente_telefono: normalizePhone(clientePhone),
    }).select('id').single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: { id: data.id } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function getCateringSolicitudesAdmin(): Promise<CateringSolicitud[]> {
  await requireAdmin();
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('catering_solicitudes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function actualizarEstadoCatering(id: string, estado: EstadoCatering): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from('catering_solicitudes').update({ estado }).eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/catering');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
