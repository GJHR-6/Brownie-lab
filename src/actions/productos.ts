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
  return data ?? [];
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export async function createProducto(
  _prevState: ActionResult<Producto> | null,
  formData: FormData
): Promise<ActionResult<Producto>> {
  try {
    const { supabase } = await requireAdmin();

    const nombre = (formData.get('nombre') as string).trim();
    const descripcion = (formData.get('descripcion') as string).trim() || null;
    const precio = parseFloat(formData.get('precio') as string);
    const stock = parseInt(formData.get('stock') as string, 10);
    const categoria = (formData.get('categoria') as string) || 'clasicas';
    const emoji = (formData.get('emoji') as string).trim() || null;
    const imagenFile = formData.get('imagen') as File | null;

    if (!nombre || isNaN(precio) || precio <= 0 || isNaN(stock) || stock < 0) {
      return { success: false, error: 'Nombre, precio (> 0) y stock (≥ 0) son requeridos.' };
    }

    let imagen_url: string | null = null;

    if (imagenFile && imagenFile.size > 0) {
      const ext = imagenFile.name.split('.').pop() ?? 'jpg';
      const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(storagePath, imagenFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        return { success: false, error: `Error al subir imagen: ${uploadError.message}` };
      }

      imagen_url = supabase.storage
        .from('product-images')
        .getPublicUrl(storagePath).data.publicUrl;
    }

    const { data, error } = await supabase
      .from('productos')
      .insert({ nombre, descripcion, precio, stock, categoria, emoji, imagen_url })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/inventario');
    return { success: true, data };
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
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
