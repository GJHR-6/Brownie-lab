'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types/actions';

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');
  return { supabase, user };
}

export async function updateConfiguracion(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();

    const nombre = (formData.get('nombre') as string ?? '').trim();
    const whatsapp = (formData.get('whatsapp') as string ?? '').trim();

    if (!nombre || !whatsapp) {
      return { success: false, error: 'Nombre y WhatsApp son requeridos.' };
    }

    const correo              = (formData.get('correo') as string ?? '').trim();
    const ubicacion           = (formData.get('ubicacion') as string ?? '').trim();
    const instagram           = (formData.get('instagram') as string ?? '').trim();
    const facebook            = (formData.get('facebook') as string ?? '').trim();
    const tiktok              = (formData.get('tiktok') as string ?? '').trim();
    const envio_gratis_desde  = (formData.get('envio_gratis_desde') as string ?? '').trim();
    const anticipacion_minima = (formData.get('anticipacion_minima') as string ?? '').trim();
    const horario_atencion    = (formData.get('horario_atencion') as string ?? '').trim();
    const aviso_barra_superior = (formData.get('aviso_barra_superior') as string ?? '').trim();
    const mensaje_bienvenida  = (formData.get('mensaje_bienvenida') as string ?? '').trim();
    // Legacy fields kept for backwards compat
    const tagline       = (formData.get('tagline') as string ?? '').trim();
    const descripcion   = (formData.get('descripcion') as string ?? '').trim() || null;
    const banco_nombre  = (formData.get('banco_nombre') as string ?? '').trim();
    const banco_titular = (formData.get('banco_titular') as string ?? '').trim();
    const banco_numero  = (formData.get('banco_numero') as string ?? '').trim();

    // Logo upload
    const logoFile = formData.get('logo') as File | null;
    let logo_url: string | null | undefined = undefined;

    if (logoFile && logoFile.size > 0) {
      const ext = logoFile.name.split('.').pop()?.toLowerCase() ?? 'png';
      const fileName = `logo.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(fileName, logoFile, { upsert: true });
      if (uploadErr) return { success: false, error: `Error subiendo logo: ${uploadErr.message}` };
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
      logo_url = publicUrl;
    }

    const payload: Record<string, unknown> = {
      id: 1, nombre, whatsapp, correo, ubicacion,
      instagram, facebook, tiktok,
      envio_gratis_desde, anticipacion_minima, horario_atencion,
      aviso_barra_superior, mensaje_bienvenida,
      tagline, descripcion, banco_nombre, banco_titular, banco_numero,
    };
    if (logo_url !== undefined) payload.logo_url = logo_url;

    const { error } = await supabase.from('configuracion').upsert(payload);
    if (error) return { success: false, error: error.message };

    revalidatePath('/', 'layout');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
