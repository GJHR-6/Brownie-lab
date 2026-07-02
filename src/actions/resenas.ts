'use server';

import { requireAdmin } from '@/lib/adminAuth';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { sanitizeText } from '@/lib/sanitize';
import type { Resena } from '@/types/database';
import type { ActionResult } from '@/types/actions';

// ── Público: reseñas aprobadas de un producto ────────────────────────────────

export async function getResenasProducto(productoId: string): Promise<Resena[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('resenas')
    .select('*')
    .eq('producto_id', productoId)
    .eq('aprobado', true)
    .order('created_at', { ascending: false });
  return data ?? [];
}

// ── Público: enviar nueva reseña (queda pendiente de aprobación) ────────────

// Envía una reseña de producto o un testimonio general, según `tipo` (queda pendiente de aprobación)
export async function enviarOpinion(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const tipo = (formData.get('tipo') as string) === 'general' ? 'general' : 'producto';
    const autor = sanitizeText(formData.get('autor'), 80);
    const texto = sanitizeText(formData.get('texto'), 600);
    const estrellas = Math.min(5, Math.max(1, parseInt(formData.get('estrellas') as string, 10) || 5));

    if (!autor || !texto) return { success: false, error: 'Nombre y comentario son requeridos.' };

    const supabase = await createSupabaseServerClient();

    if (tipo === 'general') {
      const { error } = await supabase
        .from('testimonios')
        .insert({ autor, texto, estrellas, aprobado: false });
      if (error) return { success: false, error: error.message };
    } else {
      const producto_id = (formData.get('producto_id') as string ?? '').trim();
      if (!producto_id) return { success: false, error: 'Producto inválido.' };
      const { error } = await supabase
        .from('resenas')
        .insert({ producto_id, autor, texto, estrellas, aprobado: false });
      if (error) return { success: false, error: error.message };
    }

    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

// ── Admin: moderación ─────────────────────────────────────────────────────

export interface ResenaAdmin extends Resena {
  producto_nombre: string;
}

export async function getResenasAdmin(): Promise<ResenaAdmin[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from('resenas')
    .select('*, productos(nombre)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    producto_nombre: (r.productos as { nombre?: string } | null)?.nombre ?? '—',
  })) as ResenaAdmin[];
}

export async function toggleAprobadoResena(id: string, aprobado: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('resenas').update({ aprobado }).eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/resenas');
    revalidatePath('/menu');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function deleteResena(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('resenas').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/resenas');
    revalidatePath('/menu');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
