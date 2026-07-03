import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DashboardPeriodTabs from "../DashboardPeriodTabs";
import ExportCsvRange from "./ExportCsvRange";
import { storeConfig } from "@/config/store";
import type { ClienteDatos } from "@/types/database";

const PERIODOS: Record<string, string> = { hoy: 'Hoy', semana: 'Esta semana', mes: 'Este mes', todo: 'Todo' };

const METODO_CFG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  efectivo:      { label: "Efectivo",       icon: "💵", color: "var(--green)",      bg: "rgba(31,138,91,.1)" },
  transferencia: { label: "Transferencia",  icon: "🏦", color: "#1d5fb8",           bg: "rgba(29,95,184,.1)" },
  otro:          { label: "Sin especificar", icon: "❔", color: "var(--ink-soft)",  bg: "var(--cream-200)" },
};

interface PedidoRow {
  id: string;
  total: number;
  estado: string;
  cliente_datos: ClienteDatos;
  metodo_pago: string | null;
  created_at: string;
  pedido_items: Array<{ producto_id: string | null; nombre_producto: string; precio_unitario: number; cantidad: number; subtotal: number }> | null;
}

function getPeriodoStart(periodo: string): Date | null {
  const now = new Date();
  if (periodo === 'hoy') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (periodo === 'semana') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (periodo === 'mes') return new Date(now.getFullYear(), now.getMonth(), 1);
  return null;
}

// Columna real primero; fallback al JSON para pedidos viejos sin backfill.
function metodoKey(p: PedidoRow): string {
  const m = (p.metodo_pago ?? p.cliente_datos?.metodo_pago ?? '').toLowerCase();
  return m === 'efectivo' || m === 'transferencia' ? m : 'otro';
}

function fechaLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtMoney(n: number): string {
  return `${storeConfig.currencySymbol}${n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo = 'mes' } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const periodoStart = getPeriodoStart(periodo);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  let query = supabase
    .from("pedidos")
    .select("id, total, estado, cliente_datos, metodo_pago, created_at, pedido_items(producto_id, nombre_producto, precio_unitario, cantidad, subtotal)")
    .order("created_at", { ascending: false });
  if (periodoStart) query = query.gte("created_at", periodoStart.toISOString());

  let gastosQuery = supabase.from("gastos").select("categoria, monto, fecha");
  if (periodoStart) gastosQuery = gastosQuery.gte("fecha", fechaLocal(periodoStart));

  // Ventana anterior de igual longitud, terminando donde empieza la actual (para comparativa)
  const prevStart = periodoStart
    ? new Date(periodoStart.getTime() - (now.getTime() - periodoStart.getTime()))
    : null;
  const prevQuery = periodoStart && prevStart
    ? supabase.from("pedidos").select("total, estado")
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", periodoStart.toISOString())
        .neq("estado", "cancelado")
    : null;

  const [{ data }, { data: gastosData }, { data: costosData }, prevRes] = await Promise.all([
    query,
    gastosQuery,
    supabase.from("productos").select("id, costo"),
    prevQuery ?? Promise.resolve({ data: null }),
  ]);
  const pedidos = (data ?? []) as unknown as PedidoRow[];
  const gastos = (gastosData ?? []) as Array<{ categoria: string; monto: number; fecha: string }>;
  const costoMap = new Map((costosData ?? []).map((p: { id: string; costo: number | null }) => [p.id, Number(p.costo ?? 0)]));
  const ventasPrev = (prevRes.data ?? null) as Array<{ total: number; estado: string }> | null;

  const ventas = pedidos.filter(p => p.estado !== 'cancelado');
  const cancelados = pedidos.filter(p => p.estado === 'cancelado');

  /* ── KPIs ── */
  const totalVentas = ventas.reduce((s, p) => s + Number(p.total), 0);
  const ticketPromedio = ventas.length > 0 ? totalVentas / ventas.length : 0;
  const totalCancelado = cancelados.reduce((s, p) => s + Number(p.total), 0);

  /* ── Comparativa vs ventana anterior ── */
  // null = sin datos para comparar (período 'todo' o ventana anterior vacía)
  function delta(actual: number, anterior: number): number | null {
    if (ventasPrev === null || anterior === 0) return null;
    return Math.round(((actual - anterior) / anterior) * 100);
  }
  const totalVentasPrev = (ventasPrev ?? []).reduce((s, p) => s + Number(p.total), 0);
  const pedidosPrevCount = (ventasPrev ?? []).length;
  const ticketPrev = pedidosPrevCount > 0 ? totalVentasPrev / pedidosPrevCount : 0;
  const dVentas = delta(totalVentas, totalVentasPrev);
  const dPedidos = delta(ventas.length, pedidosPrevCount);
  const dTicket = delta(ticketPromedio, ticketPrev);
  const PREV_LABEL: Record<string, string> = { hoy: 'vs ayer', semana: 'vs semana anterior', mes: 'vs período anterior' };
  const prevLabel = PREV_LABEL[periodo] ?? 'vs período anterior';

  /* ── Estado de resultados (P&L simple) ── */
  // COGS: costo actual del producto × unidades vendidas (aprox. — costo histórico no se guarda)
  let cogs = 0;
  let unidadesSinCosto = 0;
  for (const p of ventas) {
    for (const item of p.pedido_items ?? []) {
      const costo = item.producto_id ? costoMap.get(item.producto_id) ?? 0 : 0;
      if (costo > 0) cogs += costo * Number(item.cantidad);
      else unidadesSinCosto += Number(item.cantidad);
    }
  }
  const totalGastos = gastos.reduce((s, g) => s + Number(g.monto), 0);
  const margenBruto = totalVentas - cogs;
  const utilidadNeta = margenBruto - totalGastos;
  const margenPct = totalVentas > 0 ? Math.round((utilidadNeta / totalVentas) * 100) : 0;

  /* ── ISV 15% (informativo) — asume precios con ISV incluido ── */
  const ISV_RATE = 0.15;
  const baseImponible = totalVentas / (1 + ISV_RATE);
  const isvIncluido = totalVentas - baseImponible;

  /* ── Desglose por método de pago ── */
  const porMetodo = ventas.reduce((acc, p) => {
    const k = metodoKey(p);
    acc[k] = acc[k] ?? { monto: 0, count: 0 };
    acc[k].monto += Number(p.total);
    acc[k].count += 1;
    return acc;
  }, {} as Record<string, { monto: number; count: number }>);

  /* ── Corte de caja — hoy (independiente del período) ── */
  const ventasHoy = ventas.filter(p => p.created_at >= startOfToday);
  // Si el período no incluye hoy (no pasa con los períodos actuales), corte queda en cero.
  const cortePorMetodo = ventasHoy.reduce((acc, p) => {
    const k = metodoKey(p);
    acc[k] = acc[k] ?? { monto: 0, count: 0 };
    acc[k].monto += Number(p.total);
    acc[k].count += 1;
    return acc;
  }, {} as Record<string, { monto: number; count: number }>);
  const totalHoy = ventasHoy.reduce((s, p) => s + Number(p.total), 0);
  const completadosHoy = ventasHoy.filter(p => p.estado === 'completado').length;

  /* ── Top productos por ingreso ── */
  const productosMap = new Map<string, { nombre: string; unidades: number; ingreso: number }>();
  for (const p of ventas) {
    for (const item of p.pedido_items ?? []) {
      const prev = productosMap.get(item.nombre_producto) ?? { nombre: item.nombre_producto, unidades: 0, ingreso: 0 };
      prev.unidades += Number(item.cantidad);
      prev.ingreso += Number(item.subtotal ?? Number(item.precio_unitario) * Number(item.cantidad));
      productosMap.set(item.nombre_producto, prev);
    }
  }
  const topProductos = [...productosMap.values()].sort((a, b) => b.ingreso - a.ingreso).slice(0, 8);
  const maxIngreso = topProductos[0]?.ingreso ?? 1;

  /* ── Entrega ── */
  const domicilio = ventas.filter(p => p.cliente_datos?.tipo_entrega === 'domicilio').length;
  const pickup = ventas.length - domicilio;

  const cardStyle: React.CSSProperties = {
    background: "var(--paper-card)",
    border: "1px solid var(--hairline)",
    boxShadow: "var(--shadow-sm)",
  };

  return (
    <div className="px-6 md:px-10 py-8 pb-16 space-y-6 max-w-[1500px] w-full">
      {/* Page head */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-[32px] font-[700] leading-tight"
            style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)", color: "var(--ink)" }}
          >
            Reportes
          </h1>
          <p className="text-[15px] mt-1.5" style={{ color: "var(--ink-soft)" }}>
            Resumen contable de ventas — {PERIODOS[periodo] ?? 'Este mes'}
          </p>
        </div>
        <ExportCsvRange />
      </div>

      {/* Period tabs */}
      <DashboardPeriodTabs periodo={periodo} periodos={PERIODOS} basePath="/admin/reportes" />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Ventas", value: fmtMoney(totalVentas), sub: `${ventas.length} pedido${ventas.length !== 1 ? 's' : ''}`, delta: dVentas },
          { label: "Ticket promedio", value: fmtMoney(ticketPromedio), sub: "por pedido", delta: dTicket },
          { label: "Pedidos", value: ventas.length, sub: `${pickup} pickup / ${domicilio} domicilio`, delta: dPedidos },
          { label: "Cancelados", value: fmtMoney(totalCancelado), sub: `${cancelados.length} pedido${cancelados.length !== 1 ? 's' : ''} no realizados`, delta: null },
        ].map(({ label, value, sub, delta: d }) => (
          <div key={label} className="p-6 rounded-[20px]" style={cardStyle}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-[700] uppercase tracking-[.08em]" style={{ color: "var(--ink-soft)" }}>{label}</p>
              {d !== null && (
                <span
                  className="text-[11.5px] font-[700] px-[9px] py-[3px] rounded-full whitespace-nowrap"
                  style={{
                    background: d >= 0 ? "rgba(31,138,91,.12)" : "rgba(158,59,70,.12)",
                    color: d >= 0 ? "var(--green)" : "var(--berry)",
                  }}
                  title={prevLabel}
                >
                  {d >= 0 ? '▲' : '▼'} {Math.abs(d)}%
                </span>
              )}
            </div>
            <p
              className="font-[700] text-[28px] leading-none mt-2.5"
              style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)", color: "var(--ink)" }}
            >
              {value}
            </p>
            <p className="text-[13px] font-[500] mt-2" style={{ color: "var(--ink-soft)" }}>{sub}</p>
          </div>
        ))}
      </div>
      {dVentas !== null && (
        <p className="text-[12.5px] -mt-3" style={{ color: "var(--ink-soft)" }}>
          Comparativa {prevLabel}: {fmtMoney(totalVentasPrev)} en {pedidosPrevCount} pedido{pedidosPrevCount !== 1 ? 's' : ''}.
        </p>
      )}

      {/* Estado de resultados */}
      <div className="rounded-[20px] p-[26px]" style={cardStyle}>
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-5">
          <h2 className="font-[700] text-[16px]" style={{ color: "var(--ink)" }}>
            Estado de resultados — {PERIODOS[periodo] ?? 'Este mes'}
          </h2>
          <Link href="/admin/gastos" className="text-[13px] font-[700]" style={{ color: "var(--orange-ink)" }}>
            Gestionar gastos →
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div>
            {[
              { label: "Ventas", value: totalVentas, sign: "" },
              { label: "Costo de producción (COGS)", value: cogs, sign: "−" },
              { label: "Margen bruto", value: margenBruto, sign: "=", strong: true },
              { label: "Gastos operativos", value: totalGastos, sign: "−" },
            ].map(({ label, value, sign, strong }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 py-[12px]"
                style={{ borderBottom: "1px dashed var(--hairline)" }}
              >
                <span className="text-[14.5px]" style={{ color: "var(--ink)", fontWeight: strong ? 700 : 500 }}>
                  {sign && <span style={{ color: "var(--ink-soft)", marginRight: 6, fontFamily: "ui-monospace,monospace" }}>{sign}</span>}
                  {label}
                </span>
                <span
                  className="font-[700] text-[16px]"
                  style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)", color: sign === "−" ? "var(--berry)" : "var(--ink)" }}
                >
                  {fmtMoney(value)}
                </span>
              </div>
            ))}
            <div
              className="flex items-center justify-between gap-3 mt-4 rounded-[14px] px-4 py-3"
              style={{ background: utilidadNeta >= 0 ? "rgba(31,138,91,.1)" : "rgba(158,59,70,.1)", border: "1px solid var(--hairline)" }}
            >
              <span className="text-[15px] font-[700]" style={{ color: "var(--ink)" }}>Utilidad neta</span>
              <span
                className="font-[700] text-[22px]"
                style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)", color: utilidadNeta >= 0 ? "var(--green)" : "var(--berry)" }}
              >
                {fmtMoney(utilidadNeta)} <span className="text-[14px]">({margenPct}%)</span>
              </span>
            </div>
          </div>
          <div className="text-[13.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            <p className="font-[700] text-[13px] uppercase tracking-[.08em] mb-2" style={{ color: "var(--ink-soft)" }}>Cómo se calcula</p>
            <p>COGS = costo de producción por unidad (definido en cada producto del inventario) × unidades vendidas en el período. Gastos = registros de la sección Gastos cuya fecha cae en el período.</p>

            {/* ISV informativo */}
            <div className="mt-4 rounded-[14px] px-4 py-3" style={{ background: "var(--cream)", border: "1px solid var(--hairline)" }}>
              <p className="font-[700] text-[13px] uppercase tracking-[.08em] mb-2" style={{ color: "var(--ink-soft)" }}>ISV 15% — informativo</p>
              <div className="flex justify-between py-[5px]" style={{ borderBottom: "1px dashed var(--hairline)" }}>
                <span>Base imponible</span>
                <span className="font-[700]" style={{ color: "var(--ink)" }}>{fmtMoney(baseImponible)}</span>
              </div>
              <div className="flex justify-between py-[5px]">
                <span>ISV incluido en ventas</span>
                <span className="font-[700]" style={{ color: "var(--ink)" }}>{fmtMoney(isvIncluido)}</span>
              </div>
              <p className="text-[12px] mt-2" style={{ color: "var(--ink-soft)" }}>
                Asume precios con ISV incluido. Ignora este bloque si no facturás con ISV.
              </p>
            </div>
            {unidadesSinCosto > 0 && (
              <p
                className="mt-3 rounded-[12px] px-4 py-3"
                style={{ background: "#fdf4dc", border: "1px solid #f0dca6", color: "var(--choco-700)" }}
              >
                ⚠️ {unidadesSinCosto} unidad{unidadesSinCosto !== 1 ? 'es' : ''} vendida{unidadesSinCosto !== 1 ? 's' : ''} sin costo definido — el margen real es menor al mostrado. Define el costo en <Link href="/admin/costos" style={{ fontWeight: 700, color: "var(--orange-ink)" }}>Costos de producción</Link>.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desglose por método de pago */}
        <div className="rounded-[20px] p-[26px]" style={cardStyle}>
          <h2 className="font-[700] text-[16px] mb-5" style={{ color: "var(--ink)" }}>
            Ingresos por método de pago
          </h2>
          <div className="flex flex-col gap-4">
            {Object.entries(METODO_CFG).map(([key, cfg]) => {
              const m = porMetodo[key] ?? { monto: 0, count: 0 };
              const pct = totalVentas > 0 ? Math.round((m.monto / totalVentas) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="flex-none grid place-items-center rounded-[10px] text-[16px]"
                      style={{ width: 36, height: 36, background: cfg.bg }}
                    >
                      {cfg.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14.5px] font-[600]" style={{ color: "var(--ink)" }}>{cfg.label}</p>
                      <p className="text-[12.5px]" style={{ color: "var(--ink-soft)" }}>{m.count} pedido{m.count !== 1 ? 's' : ''} · {pct}%</p>
                    </div>
                    <p
                      className="font-[700] text-[18px]"
                      style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)", color: cfg.color }}
                    >
                      {fmtMoney(m.monto)}
                    </p>
                  </div>
                  <div className="h-[8px] rounded-full overflow-hidden" style={{ background: "var(--cream-200)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cfg.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[13px] font-[500] mt-5 pt-[16px]" style={{ borderTop: "1px solid var(--hairline)", color: "var(--ink-soft)" }}>
            Excluye pedidos cancelados.
          </p>
        </div>

        {/* Corte de caja — hoy */}
        <div className="rounded-[20px] p-[26px]" style={cardStyle}>
          <h2 className="font-[700] text-[16px] mb-1" style={{ color: "var(--ink)" }}>
            Corte de caja — hoy
          </h2>
          <p className="text-[13px] mb-5" style={{ color: "var(--ink-soft)" }}>
            {now.toLocaleDateString("es-HN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <div className="flex flex-col">
            {Object.entries(METODO_CFG).map(([key, cfg], i, arr) => {
              const m = cortePorMetodo[key] ?? { monto: 0, count: 0 };
              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 py-[13px]"
                  style={{ borderBottom: i < arr.length - 1 ? "1px dashed var(--hairline)" : "none" }}
                >
                  <span className="text-[14.5px] font-[600]" style={{ color: "var(--ink)" }}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <span className="text-[12.5px] ml-auto mr-4" style={{ color: "var(--ink-soft)" }}>
                    {m.count} pedido{m.count !== 1 ? 's' : ''}
                  </span>
                  <span
                    className="font-[700] text-[17px]"
                    style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)", color: cfg.color }}
                  >
                    {fmtMoney(m.monto)}
                  </span>
                </div>
              );
            })}
          </div>
          <div
            className="flex items-center justify-between mt-4 pt-4 rounded-[14px] px-4 py-3"
            style={{ background: "var(--cream)", border: "1px solid var(--hairline)" }}
          >
            <span className="text-[15px] font-[700]" style={{ color: "var(--ink)" }}>Total del día</span>
            <span
              className="font-[700] text-[22px]"
              style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)", color: "var(--orange-ink)" }}
            >
              {fmtMoney(totalHoy)}
            </span>
          </div>
          <p className="text-[13px] font-[500] mt-3" style={{ color: "var(--ink-soft)" }}>
            {completadosHoy} de {ventasHoy.length} pedidos de hoy completados · incluye pedidos activos aún no entregados.
          </p>
        </div>
      </div>

      {/* Top productos */}
      <div className="rounded-[20px] p-[26px]" style={cardStyle}>
        <h2 className="font-[700] text-[16px] mb-5" style={{ color: "var(--ink)" }}>
          Top productos por ingreso — {PERIODOS[periodo] ?? 'Este mes'}
        </h2>
        {topProductos.length === 0 ? (
          <p className="text-[14px]" style={{ color: "var(--ink-soft)" }}>Sin ventas en este período.</p>
        ) : (
          <div className="flex flex-col gap-[18px]">
            {topProductos.map((prod, i) => {
              const pct = Math.round((prod.ingreso / maxIngreso) * 100);
              return (
                <div key={prod.nombre}>
                  <div className="flex items-baseline justify-between gap-3 mb-[8px]">
                    <div className="flex items-baseline gap-2.5 min-w-0">
                      <span
                        className="flex-none text-[12px] font-[700]"
                        style={{ color: i < 3 ? "var(--orange-ink)" : "var(--ink-soft)", fontFamily: "ui-monospace,monospace" }}
                      >
                        #{i + 1}
                      </span>
                      <span className="text-[14.5px] font-[600] truncate" style={{ color: "var(--ink)" }}>{prod.nombre}</span>
                      <span className="text-[12.5px] flex-none" style={{ color: "var(--ink-soft)" }}>× {prod.unidades}</span>
                    </div>
                    <span
                      className="font-[700] text-[16px] flex-none"
                      style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)", color: "var(--ink)" }}
                    >
                      {fmtMoney(prod.ingreso)}
                    </span>
                  </div>
                  <div className="h-[8px] rounded-full overflow-hidden" style={{ background: "var(--cream-200)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: i < 3 ? "var(--orange)" : "var(--choco-700)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
