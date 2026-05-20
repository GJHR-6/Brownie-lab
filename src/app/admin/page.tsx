import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Package, ShoppingBag, Tag, Megaphone } from "lucide-react";

async function getStats() {
  const supabase = await createSupabaseServerClient();

  const [productos, pedidos, promociones, banners] = await Promise.all([
    supabase.from("productos").select("id", { count: "exact", head: true }),
    supabase.from("pedidos").select("id", { count: "exact", head: true }),
    supabase.from("promociones").select("id", { count: "exact", head: true }).eq("activa", true),
    supabase.from("banners").select("id", { count: "exact", head: true }).eq("activo", true),
  ]);

  return {
    productos: productos.count ?? 0,
    pedidos: pedidos.count ?? 0,
    promociones: promociones.count ?? 0,
    banners: banners.count ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Productos", value: stats.productos, icon: Package, color: "text-amber-600" },
    { label: "Pedidos totales", value: stats.pedidos, icon: ShoppingBag, color: "text-blue-600" },
    { label: "Promociones activas", value: stats.promociones, icon: Tag, color: "text-green-600" },
    { label: "Banners activos", value: stats.banners, icon: Megaphone, color: "text-purple-600" },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-800">Dashboard</h1>
        <p className="text-stone-500 text-sm mt-1">Resumen general de Brownie Lab</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-stone-200 p-5 flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl bg-stone-50 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800">{value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
