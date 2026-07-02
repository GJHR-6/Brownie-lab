'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { actualizarGoogleWalletObject } from '@/lib/wallet/google';
import { sanitizePhone, sanitizeText, normalizePhone } from '@/lib/sanitize';
import type { ActionResult } from '@/types/actions';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ClienteFidelizacion {
  telefono: string;
  nombre: string;
  compras_actuales: number;
  compras_totales: number;
  created_at: string;
  updated_at: string;
}

export interface CuponFidelizacion {
  id: string;
  telefono_cliente: string;
  codigo_unico: string;
  estado: 'DISPONIBLE' | 'UTILIZADO';
  created_at: string;
  used_at: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generarCodigoCupon(): string {
  // Formato: BL-XXXX-XXXX (excluye caracteres ambiguos: 0,O,I,1)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segmento = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `BL-${segmento()}-${segmento()}`;
}

// ── Queries (anon key, lectura pública) ────────────────────────────────────────

export type BuscarClienteResult =
  | { success: true; data: { cliente: ClienteFidelizacion; cupones: CuponFidelizacion[] } }
  | { success: false; error: string; similares: ClienteFidelizacion[] };

export async function buscarCliente(
  telefono: string
): Promise<BuscarClienteResult> {
  try {
    const tel = normalizePhone(sanitizePhone(telefono));
    if (tel.length < 7) return { success: false, error: 'Número de teléfono inválido.', similares: [] };

    const supabase = await createSupabaseServerClient();

    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('telefono', tel)
      .single();

    if (error?.code === 'PGRST116' || !cliente) {
      // Buscar números similares (últimos 6 dígitos coinciden)
      const patron = tel.slice(-6);
      const { data: similares } = await supabase
        .from('clientes')
        .select('*')
        .ilike('telefono', `%${patron}%`)
        .neq('telefono', tel)
        .limit(5);

      return {
        success: false,
        error: 'Teléfono no registrado. Realiza tu primera compra para unirte al club 🍫',
        similares: similares ?? [],
      };
    }
    if (error) return { success: false, error: error.message, similares: [] };

    const { data: cupones } = await supabase
      .from('cupones')
      .select('*')
      .eq('telefono_cliente', tel)
      .eq('estado', 'DISPONIBLE')
      .order('created_at', { ascending: false });

    return { success: true, data: { cliente, cupones: cupones ?? [] } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.', similares: [] };
  }
}

// ── Admin: fusionar dos clientes ──────────────────────────────────────────────

export async function fusionarClientes(
  telefonoOrigen: string,
  telefonoDestino: string
): Promise<ActionResult<{ cliente: ClienteFidelizacion }>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado.' };

    const telOrigen  = normalizePhone(sanitizePhone(telefonoOrigen));
    const telDestino = normalizePhone(sanitizePhone(telefonoDestino));

    if (!telOrigen || !telDestino) return { success: false, error: 'Teléfono inválido.' };
    if (telOrigen === telDestino) return { success: false, error: 'Los números son iguales.' };

    const service = createSupabaseServiceClient();

    const [{ data: origen }, { data: destino }] = await Promise.all([
      service.from('clientes').select('*').eq('telefono', telOrigen).single(),
      service.from('clientes').select('*').eq('telefono', telDestino).single(),
    ]);

    if (!origen) return { success: false, error: `Número origen (${telOrigen}) no encontrado.` };
    if (!destino) return { success: false, error: `Número destino (${telDestino}) no encontrado.` };

    const nuevasActuales = Math.min(origen.compras_actuales + destino.compras_actuales, 10);
    const nuevasTotales  = origen.compras_totales + destino.compras_totales;

    // Reasignar cupones del origen al destino
    await service.from('cupones').update({ telefono_cliente: telDestino }).eq('telefono_cliente', telOrigen);

    // Actualizar destino
    const { data: clienteActualizado, error } = await service
      .from('clientes')
      .update({ compras_actuales: nuevasActuales, compras_totales: nuevasTotales })
      .eq('telefono', telDestino)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // Eliminar origen
    await service.from('clientes').delete().eq('telefono', telOrigen);

    actualizarGoogleWalletObject(clienteActualizado).catch((err) =>
      console.error('[Google Wallet] Error actualizando objeto tras fusión:', err)
    );

    return { success: true, data: { cliente: clienteActualizado } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

// ── Admin: ajuste manual de sellos ────────────────────────────────────────────

export async function registrarCompraAdmin(
  telefono: string
): Promise<ActionResult<{ cliente: ClienteFidelizacion; cuponGenerado: CuponFidelizacion | null }>> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado.' };
  return registrarCompra(telefono);
}

// ── Mutations (service role — llamar desde server actions protegidos) ────────────

/**
 * Llama esta función desde el action de actualización de pedidos
 * cuando el estado cambia a 'completado'.
 */
export async function registrarCompra(
  telefono: string,
  nombre?: string,
  total?: number
): Promise<ActionResult<{ cliente: ClienteFidelizacion; cuponGenerado: CuponFidelizacion | null }>> {
  try {
    const tel = normalizePhone(sanitizePhone(telefono));
    if (!tel) return { success: false, error: 'Teléfono inválido.' };

    // Mínimo L.100 para acumular sello (solo si se pasa total; admin omite este check)
    if (total !== undefined && total < 100) {
      return { success: false, error: `Compra de L.${total.toFixed(2)} no alcanza el mínimo de L.100 para acumular sello.` };
    }
    const nombreLimpio = sanitizeText(nombre, 80);

    const supabase = createSupabaseServiceClient();

    // Leer estado actual
    const { data: actual } = await supabase
      .from('clientes')
      .select('compras_actuales, compras_totales, nombre')
      .eq('telefono', tel)
      .single();

    const comprasActuales = actual?.compras_actuales ?? 0;
    const llego10 = comprasActuales + 1 >= 10;

    // Upsert cliente
    const { data: cliente, error } = await supabase
      .from('clientes')
      .upsert(
        {
          telefono: tel,
          nombre: nombreLimpio || actual?.nombre || '',
          compras_actuales: llego10 ? 0 : comprasActuales + 1,
          compras_totales: (actual?.compras_totales ?? 0) + 1,
        },
        { onConflict: 'telefono' }
      )
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // Sync Google Wallet pass — fallo no bloquea el flujo
    actualizarGoogleWalletObject(cliente).catch((err) =>
      console.error('[Google Wallet] Error actualizando objeto:', err)
    );

    let cuponGenerado: CuponFidelizacion | null = null;

    if (llego10) {
      // Garantizar código único (reintento en colisión improbable)
      let codigo = '';
      for (let intento = 0; intento < 5; intento++) {
        const candidato = generarCodigoCupon();
        const { data: existente } = await supabase
          .from('cupones')
          .select('id')
          .eq('codigo_unico', candidato)
          .single();
        if (!existente) { codigo = candidato; break; }
      }

      if (codigo) {
        const { data: cupon } = await supabase
          .from('cupones')
          .insert({ telefono_cliente: tel, codigo_unico: codigo })
          .select()
          .single();
        cuponGenerado = cupon ?? null;
      }
    }

    return { success: true, data: { cliente, cuponGenerado } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
