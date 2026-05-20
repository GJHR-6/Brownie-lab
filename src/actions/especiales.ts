'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Especial } from '@/types/database';
import type { ActionResult } from '@/types/actions';

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');
  return { supabase };
}

export async function getEspeciales(): Promise<Especial[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from('especiales')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createEspecial(
  _prevState: ActionResult<Especial> | null,
  formData: FormData
): Promise<ActionResult<Especial>> {
  try {
    const { supabase } = await requireAdmin();
    const nombre = (formData.get('nombre') as string).trim();
    const descripcion = (formData.get('descripcion') as string).trim();
    const emoji = (formData.get('emoji') as string).trim() || '🍪';
    const fecha_inicio = (formData.get('fecha_inicio') as string) || new Date().toISOString().split('T')[0];
    const duracion_dias = parseInt(formData.get('duracion_dias') as string, 10);

    if (!nombre || !descripcion || isNaN(duracion_dias) || duracion_dias < 1) {
      return { success: false, error: 'Nombre, descripción y duración son requeridos.' };
    }

    const { data, error } = await supabase
      .from('especiales')
      .insert({ nombre, descripcion, emoji, fecha_inicio, duracion_dias })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/especiales');
    revalidatePath('/');
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function toggleEspecial(id: string, activo: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from('especiales')
      .update({ activo })
      .eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/especiales');
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function deleteEspecial(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('especiales').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/especiales');
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
