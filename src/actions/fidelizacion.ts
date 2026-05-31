'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { actualizarGoogleWalletObject } from '@/lib/wallet/google';
import { sanitizePhone, sanitizeText } from '@/lib/sanitize';
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

function normalizarTelefono(telefono: string): string {
  const digits = telefono.replace(/\D/g, '');
  // Honduras: +504 (11 dígitos) → quitar prefijo 504 → 8 dígitos locales
  if (digits.length === 11 && digits.startsWith('504')) return digits.slice(3);
  // Con doble cero: 0504... (12 dígitos)
  if (digits.length === 12 && digits.startsWith('0504')) return digits.slice(4);
  return digits;
}

function generarCodigoCupon(): string {
  // Formato: BL-XXXX-XXXX (excluye caracteres ambiguos: 0,O,I,1)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segmento = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `BL-${segmento()}-${segmento()}`;
}

// ── Queries (anon key, lectura pública) ────────────────────────────────────────

export async function buscarCliente(
  telefono: string
): Promise<ActionResult<{ cliente: ClienteFidelizacion; cupones: CuponFidelizacion[] }>> {
  try {
    const tel = normalizarTelefono(sanitizePhone(telefono));
    if (tel.length < 7) return { success: false, error: 'Número de teléfono inválido.' };

    const supabase = await createSupabaseServerClient();

    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('telefono', tel)
      .single();

    if (error?.code === 'PGRST116' || !cliente) {
      return {
        success: false,
        error: 'Teléfono no registrado. Realiza tu primera compra para unirte al club 🍫',
      };
    }
    if (error) return { success: false, error: error.message };

    const { data: cupones } = await supabase
      .from('cupones')
      .select('*')
      .eq('telefono_cliente', tel)
      .eq('estado', 'DISPONIBLE')
      .order('created_at', { ascending: false });

    return { success: true, data: { cliente, cupones: cupones ?? [] } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

// ── Mutations (service role — llamar desde server actions protegidos) ────────────

/**
 * Llama esta función desde el action de actualización de pedidos
 * cuando el estado cambia a 'completado'.
 */
export async function registrarCompra(
  telefono: string,
  nombre?: string
): Promise<ActionResult<{ cliente: ClienteFidelizacion; cuponGenerado: CuponFidelizacion | null }>> {
  try {
    const tel = normalizarTelefono(sanitizePhone(telefono));
    if (!tel) return { success: false, error: 'Teléfono inválido.' };
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
