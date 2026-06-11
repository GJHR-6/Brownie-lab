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
  created_at: string;
  pedido_items: Array<{ nombre_producto: string; precio_unitario: number; cantidad: number; subtotal: number }> | null;
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

function metodoKey(cd: ClienteDatos): string {
  const m = (cd.metodo_pago ?? '').toLowerCase();
  return m === 'efectivo' || m === 'transferencia' ? m : 'otro';
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
    .select("id, total, estado, cliente_datos, created_at, pedido_items(nombre_producto, precio_unitario, cantidad, subtotal)")
    .order("created_at", { ascending: false });
  if (periodoStart) query = query.gte("created_at", periodoStart.toISOString());

  const { data } = await query;
  const pedidos = (data ?? []) as unknown as PedidoRow[];

  const ventas = pedidos.filter(p => p.estado !== 'cancelado');
  const cancelados = pedidos.filter(p => p.estado === 'cancelado');

  /* ── KPIs ── */
  const totalVentas = ventas.reduce((s, p) => s + Number(p.total), 0);
  const ticketPromedio = ventas.length > 0 ? totalVentas / ventas.length : 0;
  const totalCancelado = cancelados.reduce((s, p) => s + Number(p.total), 0);

  /* ── Desglose por método de pago ── */
  const porMetodo = ventas.reduce((acc, p) => {
    const k = metodoKey(p.cliente_datos ?? {} as ClienteDatos);
    acc[k] = acc[k] ?? { monto: 0, count: 0 };
    acc[k].monto += Number(p.total);
    acc[k].count += 1;
    return acc;
  }, {} as Record<string, { monto: number; count: number }>);

  /* ── Corte de caja — hoy (independiente del período) ── */
  const ventasHoy = ventas.filter(p => p.created_at >= startOfToday);
  // Si el período no incluye hoy (no pasa con los períodos actuales), corte queda en cero.
  const cortePorMetodo = ventasHoy.reduce((acc, p) => {
    const k = metodoKey(p.cliente_datos ?? {} as ClienteDatos);
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
          { label: "Ventas", value: fmtMoney(totalVentas), sub: `${ventas.length} pedido${ventas.length !== 1 ? 's' : ''}` },
          { label: "Ticket promedio", value: fmtMoney(ticketPromedio), sub: "por pedido" },
          { label: "Entrega", value: `${pickup} / ${domicilio}`, sub: "pickup / domicilio" },
          { label: "Cancelados", value: fmtMoney(totalCancelado), sub: `${cancelados.length} pedido${cancelados.length !== 1 ? 's' : ''} no realizados` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="p-6 rounded-[20px]" style={cardStyle}>
            <p className="text-[12px] font-[700] uppercase tracking-[.08em]" style={{ color: "var(--ink-soft)" }}>{label}</p>
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
