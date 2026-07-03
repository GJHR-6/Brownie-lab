'use server';

import { requireAdmin } from '@/lib/adminAuth';
import { revalidatePath } from 'next/cache';
import type { Promocion } from '@/types/database';
import type { ActionResult } from '@/types/actions';

export async function getPromociones(): Promise<Promocion[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from('promociones')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createPromocion(
  _prevState: ActionResult<Promocion> | null,
  formData: FormData
): Promise<ActionResult<Promocion>> {
  try {
    const { supabase } = await requireAdmin();
    const codigo = (formData.get('codigo') as string).trim().toUpperCase();
    const descuento_porcentaje = parseInt(formData.get('descuento_porcentaje') as string, 10);
    const usos_restantes = parseInt(formData.get('usos_restantes') as string, 10);

    if (!codigo) return { success: false, error: 'El código es requerido.' };
    if (isNaN(descuento_porcentaje) || descuento_porcentaje < 1 || descuento_porcentaje > 100) {
      return { success: false, error: 'El descuento debe ser entre 1 y 100.' };
    }
    if (isNaN(usos_restantes) || usos_restantes < 1) {
      return { success: false, error: 'Los usos deben ser al menos 1.' };
    }

    const { data, error } = await supabase
      .from('promociones')
      .insert({ codigo, descuento_porcentaje, usos_restantes })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return { success: false, error: `El código "${codigo}" ya existe.` };
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/promociones');
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function togglePromocion(id: string, activa: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('promociones').update({ activa }).eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/promociones');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function deletePromocion(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('promociones').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/promociones');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
