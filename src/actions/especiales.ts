'use server';

import { requireAdmin } from '@/lib/adminAuth';
import { revalidatePath } from 'next/cache';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import type { Especial } from '@/types/database';
import type { ActionResult } from '@/types/actions';

async function uploadEspecialImage(file: File, slug: string): Promise<string> {
  const service = createSupabaseServiceClient();
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const fileName = `especiales/${slug}.${ext}`;
  const { error } = await service.storage.from('product-images').upload(fileName, file, { upsert: true });
  if (error) throw new Error(error.message);
  return service.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
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

    // Insert first to get the ID
    const { data, error } = await supabase
      .from('especiales')
      .insert({ nombre, descripcion, emoji, fecha_inicio, duracion_dias })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // Upload image if provided
    const imageFile = formData.get('imagen') as File | null;
    if (imageFile && imageFile.size > 0) {
      const imagen_url = await uploadEspecialImage(imageFile, data.id);
      await supabase.from('especiales').update({ imagen_url }).eq('id', data.id);
      data.imagen_url = imagen_url;
    }

    revalidatePath('/admin/especiales');
    revalidatePath('/');
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function addEspecialImagen(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const imageFile = formData.get('imagen') as File | null;
    if (!imageFile || imageFile.size === 0) return { success: false, error: 'No se proporcionó imagen.' };

    const slug = `${id}-${Date.now()}`;
    const url = await uploadEspecialImage(imageFile, slug);

    const { data: current } = await supabase
      .from('especiales').select('imagen_url, imagenes').eq('id', id).single();

    if (!current?.imagen_url) {
      await supabase.from('especiales').update({ imagen_url: url }).eq('id', id);
    } else {
      const extras = Array.isArray(current.imagenes) ? current.imagenes : [];
      await supabase.from('especiales').update({ imagenes: [...extras, url] }).eq('id', id);
    }

    revalidatePath('/admin/especiales');
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function removeEspecialImagen(id: string, url: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { data: current } = await supabase
      .from('especiales').select('imagen_url, imagenes').eq('id', id).single();

    const extras: string[] = Array.isArray(current?.imagenes) ? current.imagenes : [];
    const updates: Record<string, unknown> = {};

    if (current?.imagen_url === url) {
      // Promover la primera imagen extra como principal
      const [newMain, ...rest] = extras;
      updates.imagen_url = newMain ?? null;
      updates.imagenes = rest;
    } else {
      updates.imagenes = extras.filter((u) => u !== url);
    }

    const { error } = await supabase.from('especiales').update(updates).eq('id', id);
    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/especiales');
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function toggleEspecial(id: string, activo: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('especiales').update({ activo }).eq('id', id);
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
