import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import VentasChart from "@/components/admin/VentasChart";
import DashboardPeriodTabs from "./DashboardPeriodTabs";
import { storeConfig } from "@/config/store";
import type { EstadoPedido, ClienteDatos } from "@/types/database";

const ESTADO_CONFIG: Record<EstadoPedido, { label: string; fill: string; chip: string; dot: string }> = {
  pendiente:   { label: "Pendiente",   fill: "var(--amber)",    chip: "#fbeccb", dot: "#9a6a12"  },
  preparacion: { label: "Preparación", fill: "#3b82f6",         chip: "#dbeafe", dot: "#1d5fb8"  },
  listo:       { label: "Listo",       fill: "var(--green)",    chip: "#d8f0e2", dot: "#157a4d"  },
  completado:  { label: "Completado",  fill: "var(--choco-700)",chip: "#e4ded3", dot: "#6b5743"  },
  cancelado:   { label: "Cancelado",   fill: "var(--berry)",    chip: "#fce8ea", dot: "#9e3b46"  },
};

const STAT_ICONS = {
  sales: (
    <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 16.5 9 10l4 4 8-9"/><path d="M16 5.5h5v5"/>
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 8h13l-1 11.2a1.5 1.5 0 0 1-1.5 1.3H8a1.5 1.5 0 0 1-1.5-1.3z"/>
      <path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8"/>
    </svg>
  ),
  products: (
    <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5z"/>
      <path d="M3 8.5 12 14l9-5.5M12 14v7"/>
    </svg>
  ),
  today: (
    <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>
    </svg>
  ),
};

function StatCard({ type, value, label }: {
  type: "sales" | "orders" | "products" | "today";
  value: string | number;
  label: string;
}) {
  const icBg: Record<string, string> = {
    sales:    "rgba(31,138,91,.12)",
    orders:   "rgba(217,113,30,.13)",
    products: "rgba(116,58,20,.12)",
    today:    "rgba(158,59,70,.12)",
  };
  const icColor: Record<string, string> = {
    sales:    "var(--green)",
    orders:   "var(--orange-ink)",
    products: "var(--choco-700)",
    today:    "var(--berry)",
  };
  return (
    <div
      className="flex items-center gap-[18px] p-6 rounded-[20px]"
      style={{
        background: "var(--paper-card)",
        border: "1px solid var(--hairline)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <span
        className="flex-none grid place-items-center rounded-[14px]"
        style={{ width: 52, height: 52, background: icBg[type], color: icColor[type] }}
      >
        {STAT_ICONS[type]}
      </span>
      <div>
        <p
          className="font-[700] text-[30px] leading-none"
          style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)", color: "var(--ink)" }}
        >
          {value}
        </p>
        <p className="text-[13.5px] font-[500] mt-1.5" style={{ color: "var(--ink-soft)" }}>{label}</p>
      </div>
    </div>
  );
}

const PERIODOS: Record<string, string> = { hoy: 'Hoy', semana: 'Esta semana', mes: 'Este mes', todo: 'Todo' };

function getPeriodoStart(periodo: string): string | null {
  const now = new Date();
  if (periodo === 'hoy')   return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  if (periodo === 'semana') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (periodo === 'mes') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  return null;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo = 'mes' } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const periodoStart = getPeriodoStart(periodo);

  let ventasQuery = supabase.from("pedidos").select("total, estado_pago").eq("estado_pago", "pagado");
  if (periodoStart) ventasQuery = ventasQuery.gte("created_at", periodoStart);

  // Límite de 60 días para el dashboard — cubre el gráfico (30d), hoy y últimos pedidos
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 59);

  const [productosRes, pedidosRes, ventasPeriodoRes] = await Promise.all([
    supabase.from("productos").select("id, nombre, stock, disponible"),
    supabase.from("pedidos").select("id, estado, estado_pago, total, cliente_datos, created_at")
      .gte("created_at", sixtyDaysAgo.toISOString())
      .order("created_at", { ascending: false }),
    ventasQuery,
  ]);

  const productos = productosRes.data ?? [];
  const pedidos = pedidosRes.data ?? [];
  const ventasPeriodo = ventasPeriodoRes.data ?? [];

  const productosActivos = productos.filter((p) => p.disponible).length;
  const stockBajo = productos.filter((p) => p.disponible && p.stock > 0 && p.stock <= 5);
  const agotados  = productos.filter((p) => p.disponible && p.stock === 0);
  const totalVentasPeriodo = ventasPeriodo.reduce((s, p) => s + Number(p.total), 0);
  const pedidosPeriodo = ventasPeriodo.length;

  const porEstado = (["pendiente", "preparacion", "listo", "completado"] as EstadoPedido[]).reduce(
    (acc, e) => ({ ...acc, [e]: pedidos.filter((p) => p.estado === e).length }),
    {} as Record<EstadoPedido, number>
  );

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const dailyMap: Record<string, number> = {};
  pedidos.filter(p => p.estado_pago === 'pagado').forEach((p) => {
    const d = new Date(p.created_at);
    if (d >= thirtyDaysAgo) {
      const key = d.toLocaleDateString("es-HN", { day: "2-digit", month: "2-digit" });
      dailyMap[key] = (dailyMap[key] ?? 0) + Number(p.total);
    }
  });
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const fecha = d.toLocaleDateString("es-HN", { day: "2-digit", month: "2-digit" });
    return { fecha, total: dailyMap[fecha] ?? 0 };
  });
  const pedidosHoy = pedidos.filter((p) => p.created_at >= startOfToday && p.estado !== 'cancelado').length;
  const ultimosPedidos = pedidos.slice(0, 6);

  const alertIcon = (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.2"/><circle cx="12" cy="17.4" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
  const arrowIcon = (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  );

  return (
    <div className="px-6 md:px-10 py-8 pb-16 space-y-6 max-w-[1500px] w-full">
      {/* Page head */}
      <div>
        <h1
          className="text-[32px] font-[700] leading-tight"
          style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)", color: "var(--ink)" }}
        >
          Dashboard
        </h1>
        <p className="text-[15px] mt-1.5 capitalize" style={{ color: "var(--ink-soft)" }}>
          {now.toLocaleDateString("es-HN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Alerts */}
      {(agotados.length > 0 || stockBajo.length > 0) && (
        <div className="space-y-3">
          {agotados.length > 0 && (
            <div
              className="flex items-center gap-[14px] rounded-[14px] px-[22px] py-[15px]"
              style={{
                background: "#fdf4dc",
                border: "1px solid #f0dca6",
                borderLeft: "4px solid var(--berry)",
              }}
            >
              <span
                className="flex-none grid place-items-center rounded-[10px]"
                style={{ width: 38, height: 38, background: "rgba(158,59,70,.14)", color: "var(--berry)" }}
              >
                {alertIcon}
              </span>
              <p className="text-[14.5px] flex-1" style={{ color: "var(--choco-700)" }}>
                <strong className="font-[700]" style={{ color: "var(--choco-800)" }}>
                  {agotados.length} {agotados.length === 1 ? "producto agotado" : "productos agotados"}:
                </strong>{" "}
                {agotados.map((p) => p.nombre).join(", ")}
              </p>
              <Link
                href="/admin/inventario"
                className="ml-auto flex-none flex items-center gap-[7px] font-[700] text-[14px] whitespace-nowrap"
                style={{ color: "var(--berry)" }}
              >
                Ir a productos {arrowIcon}
              </Link>
            </div>
          )}
          {stockBajo.length > 0 && (
            <div
              className="flex items-center gap-[14px] rounded-[14px] px-[22px] py-[15px]"
              style={{
                background: "#fdf4dc",
                border: "1px solid #f0dca6",
                borderLeft: "4px solid var(--amber)",
              }}
            >
              <span
                className="flex-none grid place-items-center rounded-[10px]"
                style={{ width: 38, height: 38, background: "rgba(232,162,58,.18)", color: "var(--orange-ink)" }}
              >
                {alertIcon}
              </span>
              <p className="text-[14.5px] flex-1" style={{ color: "var(--choco-700)" }}>
                <strong className="font-[700]" style={{ color: "var(--choco-800)" }}>Stock bajo (≤5):</strong>{" "}
                {stockBajo.map((p) => `${p.nombre} (${p.stock})`).join(", ")}
              </p>
              <Link
                href="/admin/inventario"
                className="ml-auto flex-none flex items-center gap-[7px] font-[700] text-[14px] whitespace-nowrap"
                style={{ color: "var(--orange-ink)" }}
              >
                Ir a productos {arrowIcon}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Period tabs */}
      <DashboardPeriodTabs periodo={periodo} periodos={PERIODOS} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard type="sales"    value={`${storeConfig.currencySymbol}${totalVentasPeriodo.toFixed(2)}`} label={`Ventas pagadas — ${PERIODOS[periodo] ?? 'Este mes'}`} />
        <StatCard type="orders"   value={pedidosPeriodo}  label={`Pedidos pagados — ${PERIODOS[periodo] ?? 'Este mes'}`} />
        <StatCard type="products" value={productosActivos} label="Productos activos" />
        <StatCard type="today"    value={pedidosHoy}       label="Pedidos hoy" />
      </div>

      {/* Chart */}
      <VentasChart data={chartData} />

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos por estado */}
        <div
          className="rounded-[20px] p-[26px]"
          style={{
            background: "var(--paper-card)",
            border: "1px solid var(--hairline)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h2 className="font-[700] text-[16px] mb-5" style={{ color: "var(--ink)" }}>
            Pedidos por estado <span className="font-[500] text-[12.5px]" style={{ color: "var(--ink-soft)" }}>· últimos 60 días</span>
          </h2>
          <div className="flex flex-col gap-[22px]">
            {(Object.entries(porEstado) as [EstadoPedido, number][]).map(([estado, count]) => {
              const pct = pedidos.length > 0 ? Math.round((count / pedidos.length) * 100) : 0;
              const { label, fill } = ESTADO_CONFIG[estado];
              return (
                <div key={estado}>
                  <div className="flex justify-between items-baseline mb-[9px]">
                    <span className="text-[14.5px] font-[600]" style={{ color: "var(--ink)" }}>{label}</span>
                    <span
                      className="font-[700] text-[18px] leading-none"
                      style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)", color: "var(--ink)" }}
                    >
                      {count}
                    </span>
                  </div>
                  <div className="h-[9px] rounded-full overflow-hidden" style={{ background: "var(--cream-200)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: fill }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[13px] font-[500] mt-4 pt-[18px]"
            style={{ borderTop: "1px solid var(--hairline)", color: "var(--ink-soft)" }}>
            {pedidos.length} pedidos en los últimos 60 días
          </p>
        </div>

        {/* Últimos pedidos */}
        <div
          className="rounded-[20px] p-[26px]"
          style={{
            background: "var(--paper-card)",
            border: "1px solid var(--hairline)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h2 className="font-[700] text-[16px] mb-2" style={{ color: "var(--ink)" }}>
            Últimos pedidos
          </h2>
          {ultimosPedidos.length === 0 ? (
            <p className="text-[14px]" style={{ color: "var(--ink-soft)" }}>No hay pedidos aún.</p>
          ) : (
            <div>
              {ultimosPedidos.map((p) => {
                const estado = p.estado as EstadoPedido;
                const cfg = ESTADO_CONFIG[estado];
                const cliente = p.cliente_datos as ClienteDatos;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-[14px] py-[15px]"
                    style={{ borderBottom: "1px solid var(--hairline)" }}
                  >
                    <span
                      className="flex-none grid place-items-center rounded-[12px] font-[700] text-[16px]"
                      style={{
                        width: 42,
                        height: 42,
                        background: "var(--cream)",
                        color: "var(--orange-ink)",
                        fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
                      }}
                    >
                      {(cliente.nombre?.[0] ?? "?").toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-[600] truncate" style={{ color: "var(--ink)" }}>
                        {cliente.nombre}
                      </p>
                      <p className="text-[12.5px] mt-0.5" style={{ color: "var(--ink-soft)" }}>
                        {new Date(p.created_at).toLocaleDateString("es-HN", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                      <p
                        className="font-[700] text-[16px] leading-none"
                        style={{
                          fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
                          color: "var(--orange-ink)",
                        }}
                      >
                        {storeConfig.currencySymbol}{Number(p.total).toFixed(2)}
                      </p>
                      <span
                        className="inline-flex items-center gap-1.5 text-[11.5px] font-[700] px-[11px] py-[4px] rounded-full whitespace-nowrap"
                        style={{ background: cfg?.chip, color: cfg?.dot }}
                      >
                        <span className="w-[7px] h-[7px] rounded-full flex-none" style={{ background: "currentColor" }} />
                        {cfg?.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
