import type { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Resumen contable diario para el contador: una fila por día con ventas,
// descuentos, desglose por método de pago, costo de producción, gastos y utilidad.

const TZ_OFFSET = '-06:00'; // Honduras, sin DST

function parseFecha(raw: string | null): string | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return Number.isNaN(new Date(`${raw}T00:00:00`).getTime()) ? null : raw;
}

// Fecha local Honduras (YYYY-MM-DD) de un timestamp UTC
function diaLocal(isoUtc: string): string {
  const d = new Date(new Date(isoUtc).getTime() - 6 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

interface DiaResumen {
  pedidos: number;
  ventas: number;
  descuentos: number;
  efectivo: number;
  transferencia: number;
  sinMetodo: number;
  cogs: number;
  gastos: number;
}

const DIA_VACIO: DiaResumen = { pedidos: 0, ventas: 0, descuentos: 0, efectivo: 0, transferencia: 0, sinMetodo: 0, cogs: 0, gastos: 0 };

export async function GET(request: NextRequest): Promise<Response> {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('No autorizado', { status: 401 });

  const { data: adminRecord } = await supabase
    .from('admin_users').select('user_id').eq('user_id', user.id).single();
  if (!adminRecord) return new Response('No autorizado', { status: 403 });

  // Default: mes actual (hora Honduras)
  const hoy = diaLocal(new Date().toISOString());
  const desde = parseFecha(request.nextUrl.searchParams.get('desde')) ?? `${hoy.slice(0, 7)}-01`;
  const hasta = parseFecha(request.nextUrl.searchParams.get('hasta')) ?? hoy;

  const [pedidosRes, gastosRes, productosRes] = await Promise.all([
    supabase
      .from('pedidos')
      .select('total, descuento, estado, metodo_pago, cliente_datos, created_at, pedido_items(producto_id, cantidad)')
      .neq('estado', 'cancelado')
      .gte('created_at', `${desde}T00:00:00${TZ_OFFSET}`)
      .lte('created_at', `${hasta}T23:59:59.999${TZ_OFFSET}`)
      .order('created_at', { ascending: true }),
    supabase
      .from('gastos')
      .select('fecha, monto')
      .gte('fecha', desde)
      .lte('fecha', hasta),
    supabase.from('productos').select('id, costo'),
  ]);

  if (pedidosRes.error) return new Response(pedidosRes.error.message, { status: 500 });
  if (gastosRes.error) return new Response(gastosRes.error.message, { status: 500 });

  const costoMap = new Map(
    (productosRes.data ?? []).map((p: { id: string; costo: number | null }) => [p.id, Number(p.costo ?? 0)])
  );

  const dias = new Map<string, DiaResumen>();
  const getDia = (key: string): DiaResumen => {
    const d = dias.get(key) ?? { ...DIA_VACIO };
    dias.set(key, d);
    return d;
  };

  type PedidoExport = {
    total: number; descuento: number | null; metodo_pago: string | null;
    cliente_datos: { metodo_pago?: string } | null; created_at: string;
    pedido_items: Array<{ producto_id: string | null; cantidad: number }> | null;
  };

  for (const p of (pedidosRes.data ?? []) as PedidoExport[]) {
    const d = getDia(diaLocal(p.created_at));
    const total = Number(p.total);
    d.pedidos += 1;
    d.ventas += total;
    d.descuentos += Number(p.descuento ?? 0);

    const metodo = p.metodo_pago ?? p.cliente_datos?.metodo_pago ?? '';
    if (metodo === 'efectivo') d.efectivo += total;
    else if (metodo === 'transferencia') d.transferencia += total;
    else d.sinMetodo += total;

    for (const item of p.pedido_items ?? []) {
      if (item.producto_id) d.cogs += (costoMap.get(item.producto_id) ?? 0) * Number(item.cantidad);
    }
  }

  for (const g of gastosRes.data ?? []) {
    getDia(g.fecha as string).gastos += Number(g.monto);
  }

  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const num = (n: number) => n.toFixed(2);

  const headerRow = [
    'Fecha', 'Pedidos', 'Ventas HNL', 'Descuentos HNL', 'Efectivo HNL', 'Transferencia HNL',
    'Sin método HNL', 'Costo producción HNL', 'Gastos HNL', 'Utilidad del día HNL',
  ];

  const fechasOrdenadas = [...dias.keys()].sort();
  const totales = { ...DIA_VACIO };

  const rows = fechasOrdenadas.map(fecha => {
    const d = dias.get(fecha)!;
    totales.pedidos += d.pedidos;
    totales.ventas += d.ventas;
    totales.descuentos += d.descuentos;
    totales.efectivo += d.efectivo;
    totales.transferencia += d.transferencia;
    totales.sinMetodo += d.sinMetodo;
    totales.cogs += d.cogs;
    totales.gastos += d.gastos;
    const utilidad = d.ventas - d.cogs - d.gastos;
    return [fecha, d.pedidos, num(d.ventas), num(d.descuentos), num(d.efectivo), num(d.transferencia), num(d.sinMetodo), num(d.cogs), num(d.gastos), num(utilidad)]
      .map(esc).join(',');
  });

  const utilidadTotal = totales.ventas - totales.cogs - totales.gastos;
  const totalRow = [
    'TOTALES', totales.pedidos, num(totales.ventas), num(totales.descuentos), num(totales.efectivo),
    num(totales.transferencia), num(totales.sinMetodo), num(totales.cogs), num(totales.gastos), num(utilidadTotal),
  ].map(esc).join(',');

  const meta = [
    esc(`Brownie Lab — Reporte contable diario`),
    esc(`Período: ${desde} a ${hasta}`),
    esc(`Generado: ${new Date().toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' })}`),
    esc(`Nota: excluye pedidos cancelados. Ventas ya incluyen descuento aplicado. Costo producción según costo actual del producto.`),
  ];

  const csv = '﻿' + [...meta, '', headerRow.map(esc).join(','), ...rows, totalRow].join('\r\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="contable-${desde}_a_${hasta}.csv"`,
    },
  });
}
