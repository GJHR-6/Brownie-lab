'use server';

import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');
  const { data } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).single();
  if (!data) throw new Error('No autorizado');
}

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
