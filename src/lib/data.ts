import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import type { Producto, Especial, Banner, Configuracion, Categoria, Testimonio } from '@/types/database';

const PRODUCTO_SELECT = '*, categorias!categoria_id(slug, nombre)';

function normalizeProducto(p: Record<string, unknown>): Producto {
  const cat = p.categorias as { slug?: string } | null;
  return {
    ...p,
    categoria_id:          (p.categoria_id as string) ?? '',
    categoria:             cat?.slug ?? '',
    imagenes:              Array.isArray(p.imagenes) ? p.imagenes : [],
    stock_alerta:          (p.stock_alerta as number) ?? 5,
    alergenos:             Array.isArray(p.alergenos) ? p.alergenos : [],
    etiquetas:             Array.isArray(p.etiquetas) ? p.etiquetas : [],
    tiempo_preparacion:    (p.tiempo_preparacion as string | null) ?? null,
    sku:                   (p.sku as string | null) ?? null,
    destacado_capricho:    Boolean(p.destacado_capricho),
    disponible_personaliza: Boolean(p.disponible_personaliza),
  } as Producto;
}

// Usada en generateStaticParams (sin cookies — service client)
export async function getProductoIdsEstaticos(): Promise<string[]> {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase.from('productos').select('id').eq('disponible', true);
  return (data ?? []).map((p: { id: string }) => p.id);
}

export const getProductosPublicos = cache(async (): Promise<Producto[]> => {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('productos')
    .select(PRODUCTO_SELECT)
    .eq('disponible', true)
    .or(`disponible_desde.is.null,disponible_desde.lte.${today}`)
    .or(`disponible_hasta.is.null,disponible_hasta.gte.${today}`)
    .order('nombre');
  if (error) {
    console.error('getProductosPublicos:', error.message);
    return [];
  }
  return (data ?? []).map(normalizeProducto);
});

export const getProductoPublicoById = cache(async (id: string): Promise<Producto | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('productos')
    .select(PRODUCTO_SELECT)
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return normalizeProducto(data);
});

export async function getProductosDestacados(): Promise<Producto[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('productos')
    .select(PRODUCTO_SELECT)
    .eq('disponible', true)
    .eq('destacado_capricho', true)
    .order('nombre');
  if (error) { console.error('getProductosDestacados:', error.message); return []; }
  return (data ?? []).map(normalizeProducto);
}

export async function getTestimoniosAprobados(): Promise<Testimonio[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('testimonios')
    .select('id, autor, texto, estrellas, created_at')
    .eq('aprobado', true)
    .order('created_at', { ascending: false })
    .limit(6);
  if (error) { console.error('getTestimoniosAprobados:', error.message); return []; }
  return (data ?? []) as Testimonio[];
}

export async function getToppingsDinamicos(): Promise<{ id: string; nombre: string; precio_extra: number; imagen_url: string | null }[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('ingredientes')
    .select('id, nombre, precio_extra, imagen_url')
    .eq('es_topping', true)
    .eq('activo', true)
    .order('nombre');
  if (error) { console.error('getToppingsDinamicos:', error.message); return []; }
  return (data ?? []).map(d => ({
    id:          d.id as string,
    nombre:      d.nombre as string,
    precio_extra: Number(d.precio_extra ?? 0),
    imagen_url:  (d.imagen_url as string | null) ?? null,
  }));
}

export async function getProductosSimilares(categoriaSlug: string, excludeId: string): Promise<Producto[]> {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('productos')
    .select(PRODUCTO_SELECT)
    .eq('disponible', true)
    .neq('id', excludeId)
    .or(`disponible_desde.is.null,disponible_desde.lte.${today}`)
    .or(`disponible_hasta.is.null,disponible_hasta.gte.${today}`)
    .limit(4);
  const all = (data ?? []).map(normalizeProducto);
  // Prioritize same category
  const same = all.filter(p => p.categoria === categoriaSlug);
  const others = all.filter(p => p.categoria !== categoriaSlug);
  return [...same, ...others].slice(0, 4);
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

export const getEspecialesActivos = cache(async (): Promise<Especial[]> => {
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
});

export const getBannersActivos = cache(async (): Promise<Banner[]> => {
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
});

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
