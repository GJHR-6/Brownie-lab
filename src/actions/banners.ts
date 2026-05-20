'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Banner } from '@/types/database';
import type { ActionResult } from '@/types/actions';

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');
  return { supabase };
}

export async function getBanners(): Promise<Banner[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('orden');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createBanner(
  _prevState: ActionResult<Banner> | null,
  formData: FormData
): Promise<ActionResult<Banner>> {
  try {
    const { supabase } = await requireAdmin();
    const mensaje = (formData.get('mensaje') as string).trim();
    const orden = parseInt(formData.get('orden') as string, 10) || 0;

    if (!mensaje) return { success: false, error: 'El mensaje es requerido.' };

    const { data, error } = await supabase
      .from('banners')
      .insert({ mensaje, orden })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath('/', 'layout');
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function updateBanner(
  id: string,
  _prevState: ActionResult<Banner> | null,
  formData: FormData
): Promise<ActionResult<Banner>> {
  try {
    const { supabase } = await requireAdmin();
    const mensaje = (formData.get('mensaje') as string).trim();
    const orden = parseInt(formData.get('orden') as string, 10) || 0;

    if (!mensaje) return { success: false, error: 'El mensaje es requerido.' };

    const { data, error } = await supabase
      .from('banners')
      .update({ mensaje, orden })
      .eq('id', id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath('/', 'layout');
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function toggleBanner(id: string, activo: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('banners').update({ activo }).eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/', 'layout');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/', 'layout');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
