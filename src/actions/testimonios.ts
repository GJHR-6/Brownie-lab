'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types/actions';

export interface Testimonio {
  id: string;
  autor: string;
  texto: string;
  estrellas: number;
  aprobado: boolean;
  created_at: string;
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');
  return { supabase, user };
}

export async function getTestimonios(): Promise<Testimonio[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from('testimonios')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTestimoniosPublicos(): Promise<Testimonio[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('testimonios')
    .select('*')
    .eq('aprobado', true)
    .order('created_at', { ascending: false })
    .limit(6);
  return data ?? [];
}

export async function createTestimonio(
  _prevState: ActionResult<Testimonio> | null,
  formData: FormData
): Promise<ActionResult<Testimonio>> {
  try {
    const { supabase } = await requireAdmin();
    const autor     = (formData.get('autor')    as string).trim();
    const texto     = (formData.get('texto')    as string).trim();
    const estrellas = parseInt(formData.get('estrellas') as string, 10) || 5;

    if (!autor || !texto) return { success: false, error: 'Autor y texto son requeridos.' };

    const { data, error } = await supabase
      .from('testimonios').insert({ autor, texto, estrellas }).select().single();
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/testimonios');
    revalidatePath('/');
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function toggleAprobado(id: string, aprobado: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('testimonios').update({ aprobado }).eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/testimonios');
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function deleteTestimonio(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('testimonios').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/testimonios');
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
