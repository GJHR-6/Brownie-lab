'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Ingrediente } from '@/types/database';
import type { ActionResult } from '@/types/actions';

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');
  return { supabase, user };
}

export async function getIngredientes(): Promise<Ingrediente[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('ingredientes')
    .select('*')
    .order('es_topping', { ascending: true })
    .order('nombre', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createIngrediente(
  _prevState: ActionResult<Ingrediente> | null,
  formData: FormData
): Promise<ActionResult<Ingrediente>> {
  try {
    const { supabase } = await requireAdmin();

    const nombre = (formData.get('nombre') as string).trim();
    const descripcion_paquete = (formData.get('descripcion_paquete') as string).trim() || null;
    const unidad = (formData.get('unidad') as string) || 'g';
    const tamano_paquete = parseFloat(formData.get('tamano_paquete') as string);
    const costo_paquete = parseFloat(formData.get('costo_paquete') as string);
    const cantidad_por_bandeja = formData.get('cantidad_por_bandeja') ? parseFloat(formData.get('cantidad_por_bandeja') as string) : null;
    const costo_por_bandeja = formData.get('costo_por_bandeja') ? parseFloat(formData.get('costo_por_bandeja') as string) : null;
    const stock_paquetes = parseFloat(formData.get('stock_paquetes') as string) || 0;
    const precio_extra = parseFloat(formData.get('precio_extra') as string) || 0;
    const es_topping = formData.get('es_topping') === 'true';
    const activo = formData.get('activo') === 'true';
    const notas = (formData.get('notas') as string).trim() || null;

    if (!nombre || isNaN(tamano_paquete) || tamano_paquete <= 0 || isNaN(costo_paquete) || costo_paquete < 0) {
      return { success: false, error: 'Nombre, tamaño de paquete (> 0) y costo (≥ 0) son requeridos.' };
    }

    const { data, error } = await supabase
      .from('ingredientes')
      .insert({ nombre, descripcion_paquete, unidad, tamano_paquete, costo_paquete, cantidad_por_bandeja, costo_por_bandeja, stock_paquetes, precio_extra, es_topping, activo, notas })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/ingredientes');
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function updateIngrediente(
  id: string,
  _prevState: ActionResult<Ingrediente> | null,
  formData: FormData
): Promise<ActionResult<Ingrediente>> {
  try {
    const { supabase } = await requireAdmin();

    const nombre = (formData.get('nombre') as string).trim();
    const descripcion_paquete = (formData.get('descripcion_paquete') as string).trim() || null;
    const unidad = (formData.get('unidad') as string) || 'g';
    const tamano_paquete = parseFloat(formData.get('tamano_paquete') as string);
    const costo_paquete = parseFloat(formData.get('costo_paquete') as string);
    const cantidad_por_bandeja = formData.get('cantidad_por_bandeja') ? parseFloat(formData.get('cantidad_por_bandeja') as string) : null;
    const costo_por_bandeja = formData.get('costo_por_bandeja') ? parseFloat(formData.get('costo_por_bandeja') as string) : null;
    const stock_paquetes = parseFloat(formData.get('stock_paquetes') as string) || 0;
    const precio_extra = parseFloat(formData.get('precio_extra') as string) || 0;
    const es_topping = formData.get('es_topping') === 'true';
    const activo = formData.get('activo') === 'true';
    const notas = (formData.get('notas') as string).trim() || null;

    if (!nombre || isNaN(tamano_paquete) || tamano_paquete <= 0 || isNaN(costo_paquete) || costo_paquete < 0) {
      return { success: false, error: 'Nombre, tamaño de paquete (> 0) y costo (≥ 0) son requeridos.' };
    }

    const { data, error } = await supabase
      .from('ingredientes')
      .update({ nombre, descripcion_paquete, unidad, tamano_paquete, costo_paquete, cantidad_por_bandeja, costo_por_bandeja, stock_paquetes, precio_extra, es_topping, activo, notas })
      .eq('id', id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/ingredientes');
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function deleteIngrediente(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('ingredientes').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/ingredientes');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function toggleIngredienteActivo(id: string, activo: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('ingredientes').update({ activo }).eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/ingredientes');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function updateStockIngrediente(id: string, stock_paquetes: number): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('ingredientes').update({ stock_paquetes }).eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/ingredientes');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
