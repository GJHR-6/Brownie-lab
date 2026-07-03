'use server';

import { requireAdmin } from '@/lib/adminAuth';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { PersonalizaVariante } from '@/types/database';
import type { ActionResult } from '@/types/actions';
import { logActividad } from './actividad';

function revalidateAll() {
  revalidatePath('/admin/personaliza');
  revalidatePath('/personaliza');
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
  const base      = (formData.get('base') as string ?? '').trim();
  const slug      = sanitizeSlug(formData.get('slug') as string ?? '');
  const nombre    = (formData.get('nombre') as string ?? '').trim().slice(0, 120);
  const desc      = (formData.get('descripcion') as string ?? '').trim().slice(0, 300);
  const precio    = parseFloat(formData.get('precio') as string);
  const imagenUrl = (formData.get('imagen_url') as string ?? '').trim().slice(0, 500);
  const prox      = formData.get('proximamente') === 'true';
  const activo    = formData.get('activo') === 'true';
  const orden     = parseInt(formData.get('orden') as string, 10) || 0;
  return { base, slug, nombre, descripcion: desc, precio, imagen_url: imagenUrl, proximamente: prox, activo, orden };
}

function validate(f: ReturnType<typeof parseForm>): string | null {
  if (!['brownie', 'galleta'].includes(f.base))       return 'Base inválida.';
  if (!f.nombre)                                       return 'El nombre es requerido.';
  if (!f.slug || !/^[a-z0-9-]+$/.test(f.slug))        return 'Slug inválido (letras minúsculas, números y guiones).';
  if (isNaN(f.precio) || f.precio <= 0 || f.precio > 9999) return 'El precio debe ser mayor a 0 y menor a 9999.';
  return null;
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getVariantes(): Promise<PersonalizaVariante[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('personaliza_variantes')
    .select('*')
    .order('base')
    .order('orden');
  if (error) throw new Error(error.message);
  return (data ?? []) as PersonalizaVariante[];
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export async function createVariante(
  _prev: ActionResult<PersonalizaVariante> | null,
  formData: FormData,
): Promise<ActionResult<PersonalizaVariante>> {
  try {
    const { supabase } = await requireAdmin();
    const fields = parseForm(formData);
    const err = validate(fields);
    if (err) return { success: false, error: err };

    const { data, error } = await supabase
      .from('personaliza_variantes')
      .insert(fields)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    revalidateAll();
    await logActividad('personaliza', `Variante creada: ${fields.nombre}`, { id: data.id });
    return { success: true, data: data as PersonalizaVariante };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function updateVariante(
  id: string,
  _prev: ActionResult<PersonalizaVariante> | null,
  formData: FormData,
): Promise<ActionResult<PersonalizaVariante>> {
  try {
    const { supabase } = await requireAdmin();
    const fields = parseForm(formData);
    const err = validate(fields);
    if (err) return { success: false, error: err };

    const { data, error } = await supabase
      .from('personaliza_variantes')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    revalidateAll();
    await logActividad('personaliza', `Variante actualizada: ${fields.nombre}`, { id });
    return { success: true, data: data as PersonalizaVariante };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function deleteVariante(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('personaliza_variantes').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidateAll();
    await logActividad('personaliza', 'Variante eliminada', { id });
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function toggleVarianteProximamente(id: string, proximamente: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('personaliza_variantes').update({ proximamente }).eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidateAll();
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function toggleVarianteActivo(id: string, activo: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('personaliza_variantes').update({ activo }).eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidateAll();
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
