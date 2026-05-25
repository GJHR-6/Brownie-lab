'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types/actions';

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');
  return { supabase };
}

export async function updateConfiguracion(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();

    const nombre = (formData.get('nombre') as string).trim();
    const tagline = (formData.get('tagline') as string).trim();
    const descripcion = (formData.get('descripcion') as string).trim() || null;
    const whatsapp = (formData.get('whatsapp') as string).trim();
    const instagram = (formData.get('instagram') as string).trim();
    const facebook = (formData.get('facebook') as string).trim();
    const tiktok = (formData.get('tiktok') as string).trim();
    const banco_nombre = (formData.get('banco_nombre') as string).trim();
    const banco_titular = (formData.get('banco_titular') as string).trim();
    const banco_numero = (formData.get('banco_numero') as string).trim();

    if (!nombre || !whatsapp) {
      return { success: false, error: 'Nombre y WhatsApp son requeridos.' };
    }

    const { error } = await supabase
      .from('configuracion')
      .upsert({ id: 1, nombre, tagline, descripcion, whatsapp, instagram, facebook, tiktok, banco_nombre, banco_titular, banco_numero });

    if (error) return { success: false, error: error.message };

    revalidatePath('/', 'layout');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
