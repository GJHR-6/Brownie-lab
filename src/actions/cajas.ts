'use server';

import { requireAdmin } from '@/lib/adminAuth';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Caja } from '@/types/database';
import type { ActionResult } from '@/types/actions';
import { logActividad } from './actividad';

function revalidateAll() {
  revalidatePath('/admin/personaliza');
  revalidatePath('/cajas');
}

function sanitizeSlug(raw: string): string {
  return raw.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function parseForm(formData: FormData) {
  const slug          = sanitizeSlug(formData.get('slug') as string ?? '');
  const nombre        = (formData.get('nombre') as string ?? '').trim().slice(0, 120);
  const descripcion   = (formData.get('descripcion') as string ?? '').trim().slice(0, 300);
  const tamano        = parseInt(formData.get('tamano') as string, 10);
  const descuento_pct = parseFloat(formData.get('descuento_pct') as string);
  const imagen_url    = (formData.get('imagen_url') as string ?? '').trim().slice(0, 500);
  const activo        = formData.get('activo') === 'true';
  const orden         = parseInt(formData.get('orden') as string, 10) || 0;
  return { slug, nombre, descripcion, tamano, descuento_pct, imagen_url, activo, orden };
}

function validate(f: ReturnType<typeof parseForm>): string | null {
  if (!f.nombre)                                      return 'El nombre es requerido.';
  if (!f.slug || !/^[a-z0-9-]+$/.test(f.slug))        return 'Slug inválido (letras minúsculas, números y guiones).';
  if (isNaN(f.tamano) || f.tamano < 2 || f.tamano > 24) return 'El tamaño debe ser entre 2 y 24 postres.';
  if (isNaN(f.descuento_pct) || f.descuento_pct < 0 || f.descuento_pct >= 100) return 'El descuento debe ser entre 0 y 99.99%.';
  return null;
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getCajasAdmin(): Promise<Caja[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('cajas')
    .select('*')
    .order('orden');
  if (error) throw new Error(error.message);
  return (data ?? []) as Caja[];
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export async function createCaja(
  _prev: ActionResult<Caja> | null,
  formData: FormData,
): Promise<ActionResult<Caja>> {
  try {
    const { supabase } = await requireAdmin();
    const fields = parseForm(formData);
    const err = validate(fields);
    if (err) return { success: false, error: err };

    const { data, error } = await supabase
      .from('cajas')
      .insert(fields)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    revalidateAll();
    await logActividad('cajas', `Caja creada: ${fields.nombre}`, { id: data.id });
    return { success: true, data: data as Caja };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function updateCaja(
  id: string,
  _prev: ActionResult<Caja> | null,
  formData: FormData,
): Promise<ActionResult<Caja>> {
  try {
    const { supabase } = await requireAdmin();
    const fields = parseForm(formData);
    const err = validate(fields);
    if (err) return { success: false, error: err };

    const { data, error } = await supabase
      .from('cajas')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    revalidateAll();
    await logActividad('cajas', `Caja actualizada: ${fields.nombre}`, { id });
    return { success: true, data: data as Caja };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function deleteCaja(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('cajas').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidateAll();
    await logActividad('cajas', 'Caja eliminada', { id });
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function toggleCajaActivo(id: string, activo: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('cajas').update({ activo }).eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidateAll();
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
