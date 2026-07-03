'use server';

import { requireAdmin } from '@/lib/adminAuth';
import { revalidatePath } from 'next/cache';
import type { Categoria } from '@/types/database';
import type { ActionResult } from '@/types/actions';

export async function getCategorias(): Promise<Categoria[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('orden');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCategoria(
  _prevState: ActionResult<Categoria> | null,
  formData: FormData
): Promise<ActionResult<Categoria>> {
  try {
    const { supabase } = await requireAdmin();
    const nombre = (formData.get('nombre') as string).trim();
    const slug   = (formData.get('slug')   as string).trim().toLowerCase().replace(/\s+/g, '-');
    const orden  = parseInt(formData.get('orden') as string, 10) || 0;

    if (!nombre || !slug) return { success: false, error: 'Nombre y slug son requeridos.' };

    const { data, error } = await supabase
      .from('categorias')
      .insert({ nombre, slug, orden })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return { success: false, error: `El slug "${slug}" ya existe.` };
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/categorias');
    revalidatePath('/menu');
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function updateCategoria(
  id: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const nombre = (formData.get('nombre') as string).trim();
    const orden  = parseInt(formData.get('orden') as string, 10) || 0;

    if (!nombre) return { success: false, error: 'El nombre es requerido.' };

    const { error } = await supabase
      .from('categorias')
      .update({ nombre, orden })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/categorias');
    revalidatePath('/menu');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function deleteCategoria(id: string, slug: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();

    const { count } = await supabase
      .from('productos')
      .select('id', { count: 'exact', head: true })
      .eq('categoria', slug);

    if (count && count > 0) {
      return { success: false, error: `No se puede eliminar: ${count} producto(s) usan esta categoría.` };
    }

    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/categorias');
    revalidatePath('/menu');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
