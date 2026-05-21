'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types/actions';

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');
  return { supabase, user };
}

export async function enviarNotificacion(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const titulo = (formData.get('titulo') as string).trim();
    const mensaje = (formData.get('mensaje') as string).trim();

    if (!titulo || !mensaje) return { success: false, error: 'Título y mensaje son requeridos.' };

    const response = await fetch(`${process.env.SITE_URL}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': process.env.ADMIN_SECRET ?? '' },
      body: JSON.stringify({ title: titulo, body: mensaje, url: '/' }),
    });

    if (!response.ok) return { success: false, error: 'Error al enviar notificaciones.' };
    const { sent } = await response.json();
    return { success: true, data: undefined, sent } as ActionResult & { sent: number };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
