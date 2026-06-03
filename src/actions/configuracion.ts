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

    // File uploads helper
    async function uploadFile(fieldName: string, storageName: string): Promise<string | null | undefined> {
      const file = formData.get(fieldName) as File | null;
      if (!file || file.size === 0) return undefined;
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const fileName = `${storageName}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: true });
      if (error) throw new Error(`Error subiendo ${fieldName}: ${error.message}`);
      return supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
    }

    const logo_url                  = await uploadFile('logo', 'logo');
    const hero_imagen_url           = await uploadFile('hero_imagen', 'hero-inicio');
    const nosotros_imagen_url       = await uploadFile('nosotros_imagen', 'nosotros-historia');
    const personalizador_imagen_url = await uploadFile('personalizador_imagen', 'personalizador-postre');

    const payload: Record<string, unknown> = {
      id: 1, nombre, whatsapp, correo, ubicacion,
      instagram, facebook, tiktok,
      envio_gratis_desde, anticipacion_minima, horario_atencion,
      aviso_barra_superior, mensaje_bienvenida,
      tagline, descripcion, banco_nombre, banco_titular, banco_numero,
    };
    if (logo_url !== undefined)                  payload.logo_url = logo_url;
    if (hero_imagen_url !== undefined)           payload.hero_imagen_url = hero_imagen_url;
    if (nosotros_imagen_url !== undefined)       payload.nosotros_imagen_url = nosotros_imagen_url;
    if (personalizador_imagen_url !== undefined) payload.personalizador_imagen_url = personalizador_imagen_url;

    const { error } = await supabase.from('configuracion').upsert(payload);
    if (error) return { success: false, error: error.message };

    revalidatePath('/', 'layout');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
