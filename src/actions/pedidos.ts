'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Pedido, EstadoPedido, PedidoItem } from '@/types/database';
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
    revalidatePath('/admin');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function crearPedidoManual(
  _prevState: ActionResult<Pedido> | null,
  formData: FormData
): Promise<ActionResult<Pedido>> {
  try {
    const { supabase } = await requireAdmin();

    const nombre = (formData.get('nombre') as string).trim();
    const telefono = (formData.get('telefono') as string).trim();
    const notas = (formData.get('notas') as string).trim() || undefined;
    const itemsJson = formData.get('items_json') as string;

    if (!nombre || !telefono) {
      return { success: false, error: 'Nombre y teléfono del cliente son requeridos.' };
    }

    let items: PedidoItem[] = [];
    try {
      items = JSON.parse(itemsJson);
    } catch {
      return { success: false, error: 'Error al procesar los productos seleccionados.' };
    }

    if (!items.length) {
      return { success: false, error: 'Agrega al menos un producto al pedido.' };
    }

    const total = items.reduce((sum, i) => sum + i.subtotal, 0);
    const cliente_datos = { nombre, telefono, notas };

    const { data, error } = await supabase
      .from('pedidos')
      .insert({ cliente_datos, items, total, estado: 'pendiente' })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/pedidos');
    revalidatePath('/admin');
    return { success: true, data: data as Pedido };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
