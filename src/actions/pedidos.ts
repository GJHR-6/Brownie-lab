'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Pedido, EstadoPedido, PedidoItem } from '@/types/database';
import { logActividad } from './actividad';
import { registrarCompra } from './fidelizacion';
import type { ActionResult } from '@/types/actions';

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function descontarStockPedido(supabase: SupabaseClient, pedidoId: string) {
  const { data: pedidoItems } = await supabase
    .from('pedido_items')
    .select('producto_id, cantidad')
    .eq('pedido_id', pedidoId)
    .not('producto_id', 'is', null);

  if (!pedidoItems?.length) return;

  const productoIds = pedidoItems.map((i: { producto_id: string; cantidad: number }) => i.producto_id);
  const { data: productos } = await supabase
    .from('productos')
    .select('id, stock')
    .in('id', productoIds);

  const stockMap = new Map((productos ?? []).map((p: { id: string; stock: number }) => [p.id, p.stock]));

  await Promise.all(
    pedidoItems.map((item: { producto_id: string; cantidad: number }) => {
      const stockActual = stockMap.get(item.producto_id) ?? 0;
      const nuevoStock = Math.max(0, stockActual - item.cantidad);
      return supabase.from('productos').update({ stock: nuevoStock }).eq('id', item.producto_id);
    })
  );
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');
  return { supabase, user };
}

// No exportar: archivos 'use server' solo permiten exportar funciones async.
// El tamaño de página viaja en el resultado (pageSize).
const PEDIDOS_PAGE_SIZE = 100;

export interface PedidosPaginados {
  pedidos: Pedido[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getPedidos(page = 1): Promise<PedidosPaginados> {
  const { supabase } = await requireAdmin();

  const safePage = Math.max(1, Math.floor(page) || 1);
  const from = (safePage - 1) * PEDIDOS_PAGE_SIZE;

  const { data, error, count } = await supabase
    .from('pedidos')
    .select('*, pedido_items(id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PEDIDOS_PAGE_SIZE - 1);

  if (error) throw new Error(error.message);
  return {
    pedidos: (data ?? []).map(normalizePedido),
    total: count ?? 0,
    page: safePage,
    pageSize: PEDIDOS_PAGE_SIZE,
  };
}

function normalizePedido(p: Record<string, unknown>): Pedido {
  const rawItems = (p.pedido_items ?? []) as Array<Record<string, unknown>>;
  return {
    ...p,
    items: rawItems.map(i => ({
      producto_id: (i.producto_id as string | null) ?? null,
      nombre:      (i.nombre_producto as string) ?? '',
      precio:      Number(i.precio_unitario ?? 0),
      cantidad:    Number(i.cantidad ?? 0),
      subtotal:    Number(i.subtotal ?? 0),
    })),
  } as Pedido;
}

export async function actualizarEstadoPedido(
  id: string,
  estado: EstadoPedido
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();

    // Fetch datos necesarios antes del update
    let clienteDatos: { telefono?: string; nombre?: string } | null = null;
    if (estado === 'completado') {
      const { data } = await supabase
        .from('pedidos')
        .select('cliente_datos')
        .eq('id', id)
        .single();
      clienteDatos = data?.cliente_datos ?? null;
    }

    const { error } = await supabase
      .from('pedidos')
      .update({ estado })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    if (estado === 'completado') {
      // Descontar stock de cada producto del pedido
      try {
        await descontarStockPedido(supabase, id);
      } catch (err) {
        console.error('[Stock] Error descontando stock:', err);
      }

      // Registrar sello de fidelización
      if (clienteDatos?.telefono) {
        try {
          await registrarCompra(clienteDatos.telefono, clienteDatos.nombre);
        } catch (err) {
          console.error('[Fidelización] Error registrando compra:', err);
        }
      }
    }

    await logActividad('pedido', `Pedido ${id.slice(0,8).toUpperCase()} → ${estado}`, { id, estado });
    revalidatePath('/admin/pedidos');
    revalidatePath('/admin');
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function marcarPedidosCompletados(ids: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();

    // Fetch cliente_datos before bulk update to register loyalty stamps
    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('id, cliente_datos')
      .in('id', ids)
      .neq('estado', 'completado');

    const { error } = await supabase.from('pedidos').update({ estado: 'completado' }).in('id', ids);
    if (error) return { success: false, error: error.message };

    // Descontar stock + registrar fidelización para cada pedido completado
    await Promise.all(
      (pedidos ?? []).map(async (pedido) => {
        try { await descontarStockPedido(supabase, pedido.id); }
        catch (err) { console.error('[Stock] Error:', err); }
        const cd = pedido.cliente_datos as { telefono?: string; nombre?: string } | null;
        if (cd?.telefono) {
          try { await registrarCompra(cd.telefono, cd.nombre); }
          catch (err) { console.error('[Fidelización] Error:', err); }
        }
      })
    );

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
    const metodoPagoRaw = (formData.get('metodo_pago') as string | null)?.trim();
    const metodo_pago = metodoPagoRaw === 'efectivo' || metodoPagoRaw === 'transferencia' ? metodoPagoRaw : null;
    const tipoEntregaRaw = (formData.get('tipo_entrega') as string | null)?.trim();
    const tipo_entrega = tipoEntregaRaw === 'pickup' || tipoEntregaRaw === 'domicilio' ? tipoEntregaRaw : undefined;
    const direccion = (formData.get('direccion') as string | null)?.trim().slice(0, 300) || undefined;
    const fechaRaw = (formData.get('fecha_entrega') as string | null)?.trim();
    const fecha_entrega = fechaRaw && /^\d{4}-\d{2}-\d{2}$/.test(fechaRaw) ? fechaRaw : undefined;
    const hora_entrega = (formData.get('hora_entrega') as string | null)?.trim().slice(0, 20) || undefined;
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
    const cliente_datos = {
      nombre, telefono, notas,
      ...(metodo_pago ? { metodo_pago } : {}),
      ...(tipo_entrega ? { tipo_entrega } : {}),
      ...(tipo_entrega === 'domicilio' && direccion ? { direccion } : {}),
      ...(fecha_entrega ? { fecha_entrega } : {}),
      ...(hora_entrega ? { hora_entrega } : {}),
    };

    await supabase.from('clientes').upsert(
      { telefono, nombre },
      { onConflict: 'telefono', ignoreDuplicates: false }
    );

    const { data, error } = await supabase
      .from('pedidos')
      .insert({ cliente_datos, total, estado: 'pendiente', telefono_cliente: telefono, metodo_pago })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await supabase.from('pedido_items').insert(
      items.map(item => ({
        pedido_id:       data.id,
        producto_id:     item.producto_id || null,
        nombre_producto: item.nombre,
        precio_unitario: item.precio,
        cantidad:        item.cantidad,
      }))
    );

    revalidatePath('/admin/pedidos');
    revalidatePath('/admin');
    return { success: true, data: data as Pedido };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

// ── Editar pedido existente (cliente se equivocó) ────────────────────────────

export async function actualizarPedidoManual(
  pedidoId: string,
  _prevState: ActionResult<Pedido> | null,
  formData: FormData
): Promise<ActionResult<Pedido>> {
  try {
    const { supabase } = await requireAdmin();

    const { data: existente } = await supabase
      .from('pedidos')
      .select('id, cliente_datos, costo_envio, estado')
      .eq('id', pedidoId)
      .single();
    if (!existente) return { success: false, error: 'Pedido no encontrado.' };

    const nombre = (formData.get('nombre') as string ?? '').trim();
    const telefono = (formData.get('telefono') as string ?? '').trim();
    const notas = (formData.get('notas') as string ?? '').trim() || undefined;
    const metodoPagoRaw = (formData.get('metodo_pago') as string | null)?.trim();
    const metodo_pago = metodoPagoRaw === 'efectivo' || metodoPagoRaw === 'transferencia' ? metodoPagoRaw : null;
    const tipoEntregaRaw = (formData.get('tipo_entrega') as string | null)?.trim();
    const tipo_entrega = tipoEntregaRaw === 'pickup' || tipoEntregaRaw === 'domicilio' ? tipoEntregaRaw : undefined;
    const direccion = (formData.get('direccion') as string | null)?.trim().slice(0, 300) || undefined;
    const fechaRaw = (formData.get('fecha_entrega') as string | null)?.trim();
    const fecha_entrega = fechaRaw && /^\d{4}-\d{2}-\d{2}$/.test(fechaRaw) ? fechaRaw : undefined;
    const hora_entrega = (formData.get('hora_entrega') as string | null)?.trim().slice(0, 20) || undefined;
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
      return { success: false, error: 'El pedido debe tener al menos un producto.' };
    }

    // Total = items nuevos + envío que ya tenía el pedido (no se recalcula aquí)
    const costoEnvio = Number(existente.costo_envio ?? 0);
    const total = Math.round((items.reduce((s, i) => s + i.subtotal, 0) + costoEnvio) * 100) / 100;

    // Conserva datos no editables del JSON original (ej. detalle de envío)
    const datosPrevios = (existente.cliente_datos ?? {}) as Record<string, unknown>;
    const cliente_datos = {
      ...datosPrevios,
      nombre, telefono, notas,
      metodo_pago: metodo_pago ?? undefined,
      tipo_entrega,
      direccion: tipo_entrega === 'domicilio' ? direccion : undefined,
      fecha_entrega,
      hora_entrega,
    };

    const { data, error } = await supabase
      .from('pedidos')
      .update({ cliente_datos, total, telefono_cliente: telefono, metodo_pago })
      .eq('id', pedidoId)
      .select()
      .single();
    if (error) return { success: false, error: error.message };

    // Reemplaza las líneas del pedido
    await supabase.from('pedido_items').delete().eq('pedido_id', pedidoId);
    const { error: itemsError } = await supabase.from('pedido_items').insert(
      items.map(item => ({
        pedido_id:       pedidoId,
        producto_id:     item.producto_id || null,
        nombre_producto: item.nombre,
        precio_unitario: item.precio,
        cantidad:        item.cantidad,
      }))
    );
    if (itemsError) return { success: false, error: `Pedido actualizado pero falló al guardar productos: ${itemsError.message}` };

    await logActividad('pedido', `Pedido #${pedidoId.slice(0, 8).toUpperCase()} editado`, { id: pedidoId });
    revalidatePath('/admin/pedidos');
    revalidatePath('/admin');
    return { success: true, data: data as Pedido };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function getPedidosPorTelefono(telefono: string): Promise<Pedido[]> {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from('pedidos')
    .select('*, pedido_items(id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal)')
    .eq('telefono_cliente', telefono)
    .order('created_at', { ascending: false })
    .limit(10);
  return (data ?? []).map(normalizePedido);
}
