import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Producto, Especial } from '@/types/database';

export async function getProductosPublicos(): Promise<Producto[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('disponible', true)
    .order('categoria')
    .order('nombre');
  if (error) {
    console.error('getProductosPublicos:', error.message);
    return [];
  }
  return data ?? [];
}

export async function getEspecialesActivos(): Promise<Especial[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('especiales')
    .select('*')
    .eq('activo', true)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getEspecialesActivos:', error.message);
    return [];
  }
  return data ?? [];
}
