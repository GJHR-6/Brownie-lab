import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Package, ShoppingBag, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { storeConfig } from "@/config/store";
import type { LucideIcon } from "lucide-react";
import type { EstadoPedido, ClienteDatos } from "@/types/database";

const ESTADO_CONFIG: Record<EstadoPedido, { label: string; bar: string; badge: string }> = {
  pendiente:   { label: "Pendiente",   bar: "bg-amber-400",  badge: "bg-amber-100 text-amber-700"  },
  preparacion: { label: "Preparación", bar: "bg-blue-400",   badge: "bg-blue-100 text-blue-700"    },
  listo:       { label: "Listo",       bar: "bg-green-400",  badge: "bg-green-100 text-green-700"  },
  completado:  { label: "Completado",  bar: "bg-stone-400",  badge: "bg-stone-100 text-stone-500"  },
};

function StatCard({ icon: Icon, label, value, color }: {
  icon: LucideIcon; label: string; value: string | number; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-stone-50 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-stone-800">{value}</p>
        <p className="text-xs text-stone-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [productosRes, pedidosRes, ventasMesRes] = await Promise.all([
    supabase.from("productos").select("id, nombre, stock, disponible"),
    supabase.from("pedidos").select("id, estado, total, cliente_datos, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("pedidos").select("total").gte("created_at", startOfMonth),
  ]);

  const productos = productosRes.data ?? [];
  const pedidos = pedidosRes.data ?? [];
  const ventasMes = ventasMesRes.data ?? [];

  const productosActivos = productos.filter((p) => p.disponible).length;
  const stockBajo = productos.filter((p) => p.disponible && p.stock > 0 && p.stock <= 5);
  const agotados  = productos.filter((p) => p.disponible && p.stock === 0);
  const totalVentasMes = ventasMes.reduce((s, p) => s + Number(p.total), 0);

  const porEstado = (["pendiente", "preparacion", "listo", "completado"] as EstadoPedido[]).reduce(
    (acc, e) => ({ ...acc, [e]: pedidos.filter((p) => p.estado === e).length }),
    {} as Record<EstadoPedido, number>
  );

  const pedidosActivos = porEstado.pendiente + porEstado.preparacion + porEstado.listo;
  const pedidosHoy = pedidos.filter((p) => p.created_at >= startOfToday).length;
  const ultimosPedidos = pedidos.slice(0, 6);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Dashboard</h1>
        <p className="text-stone-500 text-sm mt-0.5">
          {now.toLocaleDateString("es-HN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Alertas stock */}
      {(agotados.length > 0 || stockBajo.length > 0) && (
        <div className="space-y-2">
          {agotados.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">
                <span className="font-semibold">{agotados.length} {agotados.length === 1 ? 'producto agotado' : 'productos agotados'}:</span>{" "}
                {agotados.map(p => p.nombre).join(", ")}
              </p>
              <Link href="/admin/inventario" className="text-xs text-red-600 hover:underline font-medium flex-shrink-0">
                Ir a inventario →
              </Link>
            </div>
          )}
          {stockBajo.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700 flex-1">
                <span className="font-semibold">Stock bajo (≤5):</span>{" "}
                {stockBajo.map(p => `${p.nombre} (${p.stock})`).join(", ")}
              </p>
              <Link href="/admin/inventario" className="text-xs text-amber-600 hover:underline font-medium flex-shrink-0">
                Ir a inventario →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Ventas del mes"    value={`${storeConfig.currencySymbol}${totalVentasMes.toFixed(2)}`} color="text-green-600" />
        <StatCard icon={ShoppingBag} label="Pedidos activos"  value={pedidosActivos} color="text-amber-600" />
        <StatCard icon={Package}    label="Productos activos" value={productosActivos} color="text-blue-600" />
        <StatCard icon={Clock}      label="Pedidos hoy"       value={pedidosHoy} color="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pedidos por estado */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h2 className="font-semibold text-stone-700 mb-4 text-sm">Pedidos por estado</h2>
          <div className="space-y-3">
            {(Object.entries(porEstado) as [EstadoPedido, number][]).map(([estado, count]) => {
              const pct = pedidos.length > 0 ? Math.round((count / pedidos.length) * 100) : 0;
              const { label, bar } = ESTADO_CONFIG[estado];
              return (
                <div key={estado}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-stone-600">{label}</span>
                    <span className="font-semibold text-stone-800">{count}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-stone-400 mt-4">{pedidos.length} pedidos en total</p>
        </div>

        {/* Últimos pedidos */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h2 className="font-semibold text-stone-700 mb-4 text-sm">Últimos pedidos</h2>
          {ultimosPedidos.length === 0 ? (
            <p className="text-stone-400 text-sm">No hay pedidos aún.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {ultimosPedidos.map((p) => {
                const estado = p.estado as EstadoPedido;
                const cliente = p.cliente_datos as ClienteDatos;
                return (
                  <div key={p.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{cliente.nombre}</p>
                      <p className="text-xs text-stone-400">
                        {new Date(p.created_at).toLocaleDateString("es-HN", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-sm font-bold text-amber-800">
                        {storeConfig.currencySymbol}{Number(p.total).toFixed(2)}
                      </p>
                      <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${ESTADO_CONFIG[estado]?.badge}`}>
                        {ESTADO_CONFIG[estado]?.label}
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
