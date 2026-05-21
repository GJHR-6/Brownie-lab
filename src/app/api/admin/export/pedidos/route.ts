import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Pedido, PedidoItem, ClienteDatos } from '@/types/database';

export async function GET(): Promise<Response> {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('No autorizado', { status: 401 });

  const { data: adminRecord } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  if (!adminRecord) return new Response('No autorizado', { status: 403 });

  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return new Response(error.message, { status: 500 });

  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;

  const headers = ['ID', 'Fecha', 'Cliente', 'Telefono', 'Notas', 'Productos', 'Total HNL', 'Estado'];

  const rows = (data as Pedido[]).map((p) => {
    const cd = p.cliente_datos as ClienteDatos;
    const items = p.items
      ? (p.items as PedidoItem[]).map((i) => `${i.cantidad}x ${i.nombre}`).join(' | ')
      : '';
    return [
      p.id.slice(0, 8).toUpperCase(),
      new Date(p.created_at).toLocaleString('es-HN'),
      cd.nombre,
      cd.telefono,
      cd.notas ?? '',
      items,
      Number(p.total).toFixed(2),
      p.estado,
    ].map((v) => esc(String(v))).join(',');
  });

  const csv = '﻿' + [headers.join(','), ...rows].join('\r\n');
  const fecha = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pedidos-${fecha}.csv"`,
    },
  });
}
