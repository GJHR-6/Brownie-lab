'use server';

import { requireAdmin } from '@/lib/adminAuth';
import { revalidatePath } from 'next/cache';
import type { Gasto, GastoCategoria } from '@/types/database';
import type { ActionResult } from '@/types/actions';
import { logActividad } from './actividad';

const CATEGORIAS_GASTO: ReadonlySet<string> = new Set([
  'ingredientes', 'empaque', 'delivery', 'servicios', 'equipo', 'marketing', 'otros',
]);

export async function getGastos(desde?: string, hasta?: string): Promise<Gasto[]> {
  const { supabase } = await requireAdmin();

  let query = supabase
    .from('gastos')
    .select('*')
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });

  if (desde) query = query.gte('fecha', desde);
  if (hasta) query = query.lte('fecha', hasta);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(g => ({ ...g, monto: Number(g.monto) })) as Gasto[];
}

export async function crearGasto(
  _prevState: ActionResult<Gasto> | null,
  formData: FormData
): Promise<ActionResult<Gasto>> {
  try {
    const { supabase } = await requireAdmin();

    const fecha = (formData.get('fecha') as string)?.trim();
    const categoria = (formData.get('categoria') as string)?.trim();
    const monto = parseFloat(formData.get('monto') as string);
    const nota = (formData.get('nota') as string | null)?.trim() || null;

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return { success: false, error: 'Fecha inválida.' };
    }
    if (!CATEGORIAS_GASTO.has(categoria)) {
      return { success: false, error: 'Categoría inválida.' };
    }
    if (isNaN(monto) || monto <= 0 || monto > 1_000_000) {
      return { success: false, error: 'Monto inválido (debe ser mayor a 0).' };
    }

    const { data, error } = await supabase
      .from('gastos')
      .insert({ fecha, categoria: categoria as GastoCategoria, monto, nota })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/gastos');
    revalidatePath('/admin/reportes');
    await logActividad('gasto', `Gasto registrado: ${categoria} L.${monto.toFixed(2)}`, { id: data.id });
    return { success: true, data: { ...data, monto: Number(data.monto) } as Gasto };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function eliminarGasto(id: string): Promise<ActionResult<null>> {
  try {
    const { supabase } = await requireAdmin();

    const { error } = await supabase.from('gastos').delete().eq('id', id);
    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/gastos');
    revalidatePath('/admin/reportes');
    await logActividad('gasto', `Gasto eliminado`, { id });
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
