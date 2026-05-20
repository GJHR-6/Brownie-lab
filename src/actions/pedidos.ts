'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Pedido, EstadoPedido } from '@/types/database';
import type { ActionResult } from '@/types/actions';

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');
  return { supabase, user };
}

export async function getPedidos(): Promise<Pedido[]> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Pedido[];
}

export async function actualizarEstadoPedido(
  id: string,
  estado: EstadoPedido
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from('pedidos')
      .update({ estado })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/pedidos');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
