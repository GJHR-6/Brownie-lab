'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Producto } from '@/types/database';
import type { ActionResult } from '@/types/actions';

// ── Auth guard reutilizable ────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');
  return { supabase, user };
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getProductos(): Promise<Producto[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeProducto);
}

export async function getProductoById(id: string): Promise<Producto | null> {
  const supabase = await createSupabaseServerClient();
  const [{ data: p }, { data: ing }] = await Promise.all([
    supabase.from('productos').select('*').eq('id', id).single(),
    supabase.from('producto_ingredientes').select('ingrediente_id').eq('producto_id', id),
  ]);
  if (!p) return null;
  return { ...normalizeProducto(p), ingredientes: (ing ?? []).map((r: { ingrediente_id: string }) => r.ingrediente_id) };
}

function normalizeProducto(p: Record<string, unknown>): Producto {
  return {
    ...p,
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

// ── Mutations ──────────────────────────────────────────────────────────────────

async function uploadImageFile(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(storagePath, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error(`Error al subir imagen: ${error.message}`);
  return supabase.storage.from('product-images').getPublicUrl(storagePath).data.publicUrl;
}

function parseProductoFormData(formData: FormData) {
  return {
    nombre:                 (formData.get('nombre') as string).trim(),
    descripcion:            (formData.get('descripcion') as string | null)?.trim() || null,
    precio:                 parseFloat(formData.get('precio') as string),
    stock:                  parseInt(formData.get('stock') as string, 10),
    stock_alerta:           parseInt(formData.get('stock_alerta') as string, 10) || 5,
    categoria:              (formData.get('categoria') as string) || 'clasicas',
    emoji:                  (formData.get('emoji') as string | null)?.trim() || null,
    tiempo_preparacion:     (formData.get('tiempo_preparacion') as string | null)?.trim() || null,
    sku:                    (formData.get('sku') as string | null)?.trim() || null,
    disponible:             formData.get('disponible') === 'true',
    destacado_capricho:     formData.get('destacado_capricho') === 'true',
    disponible_personaliza: formData.get('disponible_personaliza') === 'true',
    etiquetas:              (formData.get('etiquetas') as string | null)?.split(',').filter(Boolean) ?? [],
    ingredientes_ids:       (formData.get('ingredientes_ids') as string | null)?.split(',').filter(Boolean) ?? [],
    disponible_desde:       (formData.get('disponible_desde') as string) || null,
    disponible_hasta:       (formData.get('disponible_hasta') as string) || null,
  };
}

export async function createProducto(
  _prevState: ActionResult<Producto> | null,
  formData: FormData
): Promise<ActionResult<Producto>> {
  try {
    const { supabase } = await requireAdmin();
    const fields = parseProductoFormData(formData);

    if (!fields.nombre || isNaN(fields.precio) || fields.precio <= 0 || isNaN(fields.stock) || fields.stock < 0) {
      return { success: false, error: 'Nombre, precio (> 0) y stock (≥ 0) son requeridos.' };
    }

    // Upload images
    let imagen_url: string | null = null;
    const imagenes: string[] = [];
    for (let i = 1; i <= 4; i++) {
      const file = formData.get(`imagen_${i}`) as File | null;
      if (file && file.size > 0) {
        const url = await uploadImageFile(supabase, file);
        if (i === 1) imagen_url = url;
        else imagenes.push(url);
      }
    }

    const { data, error } = await supabase
      .from('productos')
      .insert({
        nombre: fields.nombre, descripcion: fields.descripcion, precio: fields.precio,
        stock: fields.stock, stock_alerta: fields.stock_alerta, categoria: fields.categoria,
        emoji: fields.emoji, imagen_url, imagenes, tiempo_preparacion: fields.tiempo_preparacion,
        sku: fields.sku, disponible: fields.disponible, destacado_capricho: fields.destacado_capricho,
        disponible_personaliza: fields.disponible_personaliza, etiquetas: fields.etiquetas,
        disponible_desde: fields.disponible_desde, disponible_hasta: fields.disponible_hasta,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    if (fields.ingredientes_ids.length > 0) {
      await supabase.from('producto_ingredientes').insert(
        fields.ingredientes_ids.map(id => ({ producto_id: data.id, ingrediente_id: id }))
      );
    }

    revalidatePath('/admin/inventario');
    revalidatePath('/');
    revalidatePath('/menu');
    return { success: true, data: normalizeProducto(data) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function updateProducto(
  id: string,
  _prevState: ActionResult<Producto> | null,
  formData: FormData
): Promise<ActionResult<Producto>> {
  try {
    const { supabase } = await requireAdmin();
    const fields = parseProductoFormData(formData);

    if (!fields.nombre || isNaN(fields.precio) || fields.precio <= 0 || isNaN(fields.stock) || fields.stock < 0) {
      return { success: false, error: 'Nombre, precio (> 0) y stock (≥ 0) son requeridos.' };
    }

    // Resolve images: use existing URLs unless a new file was uploaded for that slot
    let imagen_url: string | null = (formData.get('imagen_url_1') as string) || null;
    const imagenes: string[] = [];
    for (let i = 1; i <= 4; i++) {
      const file = formData.get(`imagen_${i}`) as File | null;
      const existing = (formData.get(`imagen_url_${i}`) as string) || null;
      const url = file && file.size > 0 ? await uploadImageFile(supabase, file) : existing;
      if (i === 1) imagen_url = url;
      else if (url) imagenes.push(url);
    }

    const { data, error } = await supabase
      .from('productos')
      .update({
        nombre: fields.nombre, descripcion: fields.descripcion, precio: fields.precio,
        stock: fields.stock, stock_alerta: fields.stock_alerta, categoria: fields.categoria,
        emoji: fields.emoji, imagen_url, imagenes, tiempo_preparacion: fields.tiempo_preparacion,
        sku: fields.sku, disponible: fields.disponible, destacado_capricho: fields.destacado_capricho,
        disponible_personaliza: fields.disponible_personaliza, etiquetas: fields.etiquetas,
        disponible_desde: fields.disponible_desde, disponible_hasta: fields.disponible_hasta,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // Sync ingredientes
    await supabase.from('producto_ingredientes').delete().eq('producto_id', id);
    if (fields.ingredientes_ids.length > 0) {
      await supabase.from('producto_ingredientes').insert(
        fields.ingredientes_ids.map(ingId => ({ producto_id: id, ingrediente_id: ingId }))
      );
    }

    revalidatePath('/admin/inventario');
    revalidatePath(`/admin/inventario/${id}`);
    revalidatePath('/');
    revalidatePath('/menu');
    return { success: true, data: normalizeProducto(data) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function toggleDisponible(
  id: string,
  disponible: boolean
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from('productos')
      .update({ disponible })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/inventario');
    revalidatePath('/');
    revalidatePath('/menu');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function deleteProducto(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();

    // Obtener imagen_url antes de eliminar para limpiar Storage
    const { data: producto } = await supabase
      .from('productos')
      .select('imagen_url')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) return { success: false, error: error.message };

    // Limpiar imagen de Storage si existe
    if (producto?.imagen_url) {
      const url = new URL(producto.imagen_url);
      const storagePath = url.pathname.split('/product-images/')[1];
      if (storagePath) {
        await supabase.storage.from('product-images').remove([storagePath]);
      }
    }

    revalidatePath('/admin/inventario');
    revalidatePath('/');
    revalidatePath('/menu');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
