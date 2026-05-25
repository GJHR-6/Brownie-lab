'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types/actions';
import type { ClienteDatos, EstadoPedido, PedidoItem } from '@/types/database';

// ── Validar código de promo (decrements usos_restantes on apply) ──────────────

export async function validarPromocion(
  codigo: string
): Promise<ActionResult<{ codigo: string; descuento_porcentaje: number }>> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('promociones')
      .select('id, codigo, descuento_porcentaje, usos_restantes, activa')
      .eq('codigo', codigo.toUpperCase().trim())
      .single();

    if (error || !data) return { success: false, error: 'Código de descuento no válido.' };
    if (!data.activa)          return { success: false, error: 'Este código ya no está activo.' };
    if (data.usos_restantes <= 0) return { success: false, error: 'Este código no tiene usos disponibles.' };

    await supabase
      .from('promociones')
      .update({ usos_restantes: data.usos_restantes - 1 })
      .eq('id', data.id);

    return { success: true, data: { codigo: data.codigo, descuento_porcentaje: data.descuento_porcentaje } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

// ── Seguimiento de pedido por teléfono (pública, usa función SECURITY DEFINER) ─

export interface PedidoTracking {
  id: string;
  estado: EstadoPedido;
  total: number;
  created_at: string;
  nombre_cliente: string;
}

export async function buscarPedidosPorTelefono(
  telefono: string
): Promise<ActionResult<PedidoTracking[]>> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.rpc('get_pedidos_por_telefono', {
      telefono_input: telefono.trim(),
    });

    if (error) return { success: false, error: 'Error al buscar pedidos.' };
    return { success: true, data: (data ?? []) as PedidoTracking[] };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

// ── Datos bancarios públicos (para el carrito) ────────────────────────────────

export async function getConfiguracionBanco(): Promise<{ banco: string; titular: string; numero: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('configuracion')
      .select('banco_nombre, banco_titular, banco_numero')
      .eq('id', 1)
      .single();
    return {
      banco:   data?.banco_nombre  ?? '',
      titular: data?.banco_titular ?? '',
      numero:  data?.banco_numero  ?? '',
    };
  } catch {
    return { banco: '', titular: '', numero: '' };
  }
}

// ── Crear pedido desde checkout público (sin autenticación) ───────────────────

export async function crearPedidoPublico(
  clienteDatos: ClienteDatos,
  items: PedidoItem[],
  total: number,
  promo?: { codigo: string; descuento_porcentaje: number } | null
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!clienteDatos.nombre?.trim() || !clienteDatos.telefono?.trim()) {
      return { success: false, error: 'Nombre y teléfono requeridos.' };
    }
    if (!items.length) {
      return { success: false, error: 'El carrito está vacío.' };
    }

    const supabase = await createSupabaseServerClient();

    const nota_promo = promo
      ? `Descuento ${promo.codigo} (${promo.descuento_porcentaje}%)`
      : undefined;

    const datos = nota_promo
      ? { ...clienteDatos, notas: [clienteDatos.notas, nota_promo].filter(Boolean).join(' | ') }
      : clienteDatos;

    const { data, error } = await supabase
      .from('pedidos')
      .insert({ cliente_datos: datos, items, total, estado: 'pendiente' })
      .select('id')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: { id: data.id } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
