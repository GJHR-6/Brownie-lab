import type { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ClienteDatos } from '@/types/database';

// Valida YYYY-MM-DD y que sea una fecha real.
function parseFecha(raw: string | null): string | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return Number.isNaN(new Date(`${raw}T00:00:00`).getTime()) ? null : raw;
}

export async function GET(request: NextRequest): Promise<Response> {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('No autorizado', { status: 401 });

  const { data: adminRecord } = await supabase
    .from('admin_users').select('user_id').eq('user_id', user.id).single();
  if (!adminRecord) return new Response('No autorizado', { status: 403 });

  const desde = parseFecha(request.nextUrl.searchParams.get('desde'));
  const hasta = parseFecha(request.nextUrl.searchParams.get('hasta'));

  let query = supabase
    .from('pedidos')
    .select('*, pedido_items(nombre_producto, precio_unitario, cantidad)')
    .order('created_at', { ascending: false });

  // Honduras UTC-6 (sin DST) — el día contable corta a medianoche local.
  if (desde) query = query.gte('created_at', `${desde}T00:00:00-06:00`);
  if (hasta) query = query.lte('created_at', `${hasta}T23:59:59.999-06:00`);

  const { data, error } = await query;

  if (error) return new Response(error.message, { status: 500 });

  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;

  const headerRow = ['ID', 'Fecha', 'Cliente', 'Teléfono', 'Entrega', 'Método pago', 'Notas', 'Productos', 'Total HNL', 'Estado'];

  const rows = (data ?? []).map((p) => {
    const cd = (p.cliente_datos ?? {}) as ClienteDatos;
    const items = ((p.pedido_items ?? []) as Array<{ nombre_producto: string; cantidad: number }>)
      .map((i) => `${i.cantidad}x ${i.nombre_producto}`)
      .join(' | ');
    return [
      p.id.slice(0, 8).toUpperCase(),
      new Date(p.created_at).toLocaleString('es-HN'),
      cd.nombre ?? '',
      cd.telefono ?? '',
      cd.tipo_entrega === 'domicilio' ? `Domicilio: ${cd.direccion ?? ''}` : 'Pickup',
      cd.metodo_pago ?? '',
      cd.notas ?? '',
      items,
      Number(p.total).toFixed(2),
      p.estado,
    ].map(esc).join(',');
  });

  const csv = '﻿' + [headerRow.join(','), ...rows].join('\r\n');
  const sufijo = desde || hasta
    ? `${desde ?? 'inicio'}_a_${hasta ?? 'hoy'}`
    : new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pedidos-${sufijo}.csv"`,
    },
  });
}
