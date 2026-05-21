import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Producto, Especial, Banner, Configuracion, Categoria } from '@/types/database';

export async function getProductosPublicos(): Promise<Producto[]> {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('disponible', true)
    .or(`disponible_desde.is.null,disponible_desde.lte.${today}`)
    .or(`disponible_hasta.is.null,disponible_hasta.gte.${today}`)
    .order('categoria')
    .order('nombre');
  if (error) {
    console.error('getProductosPublicos:', error.message);
    return [];
  }
  return data ?? [];
}

export async function getCategoriasPublicas(): Promise<Categoria[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('orden');
  if (error) {
    console.error('getCategoriasPublicas:', error.message);
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

export async function getBannersActivos(): Promise<Banner[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('activo', true)
    .order('orden');
  if (error) {
    console.error('getBannersActivos:', error.message);
    return [];
  }
  return data ?? [];
}

// cache() deduplicates DB calls dentro del mismo request render tree
export const getConfiguracion = cache(async (): Promise<Configuracion | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('configuracion')
    .select('*')
    .single();
  if (error) {
    console.error('getConfiguracion:', error.message);
    return null;
  }
  return data;
});
