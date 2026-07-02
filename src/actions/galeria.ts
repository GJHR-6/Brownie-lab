'use server';

import { requireAdmin } from '@/lib/adminAuth';
import { revalidatePath } from 'next/cache';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function subirImagenGaleria(
  _: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const service = createSupabaseServiceClient();
    const files = formData.getAll('files') as File[];

    const errors: string[] = [];
    for (const file of files) {
      if (!file || file.size === 0) continue;
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await service.storage.from('product-images').upload(fileName, file, { upsert: false });
      if (error) errors.push(file.name);
    }

    if (errors.length > 0) return { success: false, error: `No se pudieron subir: ${errors.join(', ')}` };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' };
  }
}

const SITE_SLOT_STORAGE_NAMES: Record<string, string> = {
  hero_imagen_url: 'hero-inicio',
  nosotros_imagen_url: 'nosotros-historia',
  personalizador_imagen_url: 'personalizador-postre',
};

const SITE_SLOT_COLUMNS: Record<string, string> = {
  hero_imagen_url: 'hero_imagen_url',
  nosotros_imagen_url: 'nosotros_imagen_url',
  personalizador_imagen_url: 'personalizador_imagen_url',
};

export async function actualizarImagenSitio(
  _: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const slotKey = formData.get('slotKey') as string | null;
    const file = formData.get('file') as File | null;
    const storageName = slotKey ? SITE_SLOT_STORAGE_NAMES[slotKey] : undefined;
    const column = slotKey ? SITE_SLOT_COLUMNS[slotKey] : undefined;
    if (!storageName || !column) return { success: false, error: 'Slot inválido.' };
    if (!file || file.size === 0) return { success: false, error: 'Archivo inválido.' };

    const service = createSupabaseServiceClient();
    const { data: configRow } = await service.from('configuracion').select(column).eq('id', 1).single();
    const oldUrl = (configRow as Record<string, string | null> | null)?.[column] ?? null;

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    // Unique filename per upload so the public URL changes — a fixed name with upsert
    // would keep serving the stale cached image since the URL never changes.
    const fileName = `${storageName}-${Date.now()}.${ext}`;
    const { error: uploadError } = await service.storage.from('product-images').upload(fileName, file, { upsert: false });
    if (uploadError) return { success: false, error: uploadError.message };

    const publicUrl = service.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
    const { error: dbError } = await service.from('configuracion').update({ [column]: publicUrl }).eq('id', 1);
    if (dbError) return { success: false, error: dbError.message };

    if (oldUrl) {
      const oldName = oldUrl.split('/').pop();
      if (oldName) await service.storage.from('product-images').remove([oldName]);
    }

    revalidatePath('/', 'layout');
    revalidatePath('/contact');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' };
  }
}

export async function eliminarImagenGaleria(
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const service = createSupabaseServiceClient();
    const { error } = await service.storage.from('product-images').remove([name]);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' };
  }
}
