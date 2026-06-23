'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { sanitizeText } from '@/lib/sanitize';
import type { ActionResult } from '@/types/actions';
import type { DeliveryZone } from '@/types/database';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');
  return supabase;
}

// ── Lectura pública ──────────────────────────────────────────────────────────

export async function getDeliveryZonesPublicas(): Promise<DeliveryZone[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('activa', true)
    .order('orden', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export async function getDeliveryZonesAdmin(): Promise<DeliveryZone[]> {
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from('delivery_zones')
    .select('*')
    .order('orden', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function crearDeliveryZone(input: {
  nombre: string;
  descripcion?: string;
  tarifa: number;
  orden?: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const nombre = sanitizeText(input.nombre, 80);
    const descripcion = sanitizeText(input.descripcion, 300) || null;
    if (!nombre) return { success: false, error: 'Nombre requerido.' };
    if (!Number.isFinite(input.tarifa) || input.tarifa < 0) return { success: false, error: 'Tarifa inválida.' };

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from('delivery_zones')
      .insert({ nombre, descripcion, tarifa: input.tarifa, orden: input.orden ?? 0 })
      .select('id')
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/zonas-envio');
    return { success: true, data: { id: data.id } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function actualizarDeliveryZone(
  id: string,
  input: Partial<{ nombre: string; descripcion: string; tarifa: number; activa: boolean; orden: number }>
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createSupabaseServiceClient();
    const updates: Record<string, unknown> = {};
    if (input.nombre !== undefined) updates.nombre = sanitizeText(input.nombre, 80);
    if (input.descripcion !== undefined) updates.descripcion = sanitizeText(input.descripcion, 300) || null;
    if (input.tarifa !== undefined) {
      if (!Number.isFinite(input.tarifa) || input.tarifa < 0) return { success: false, error: 'Tarifa inválida.' };
      updates.tarifa = input.tarifa;
    }
    if (input.activa !== undefined) updates.activa = input.activa;
    if (input.orden !== undefined) updates.orden = input.orden;

    const { error } = await supabase.from('delivery_zones').update(updates).eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/zonas-envio');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function eliminarDeliveryZone(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from('delivery_zones').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/zonas-envio');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
