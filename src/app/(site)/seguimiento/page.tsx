"use client";

import { useState } from "react";
import { Search, Loader2, Package } from "lucide-react";
import { buscarPedidosPorTelefono, type PedidoTracking } from "@/actions/publico";

const ESTADO_LABEL: Record<string, string> = {
  pendiente:   "Pendiente",
  preparacion: "En preparación",
  listo:       "¡Listo para entregar!",
  completado:  "Completado",
};

const ESTADO_STYLE: Record<string, string> = {
  pendiente:   "bg-amber-100 text-amber-700",
  preparacion: "bg-blue-100 text-blue-700",
  listo:       "bg-green-100 text-green-700",
  completado:  "bg-stone-100 text-stone-500",
};

const ESTADO_EMOJI: Record<string, string> = {
  pendiente:   "⏳",
  preparacion: "👨‍🍳",
  listo:       "✅",
  completado:  "🎉",
};

export default function SeguimientoPage() {
  const [telefono, setTelefono] = useState("");
  const [pedidos, setPedidos] = useState<PedidoTracking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!telefono.trim()) return;
    setLoading(true);
    setError("");
    const result = await buscarPedidosPorTelefono(telefono);
    if (result.success) {
      setPedidos(result.data);
      setSearched(true);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <Package className="w-10 h-10 text-amber-700 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-amber-800 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
          Seguimiento de Pedido
        </h1>
        <p className="text-stone-500">Ingresa tu número de teléfono para ver el estado de tus pedidos.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Tu número de teléfono (ej. 9999-0000)"
          className="flex-1 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="submit"
          disabled={loading || !telefono.trim()}
          className="bg-amber-800 hover:bg-amber-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Buscar
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6">{error}</div>
      )}

      {searched && pedidos.length === 0 && !error && (
        <div className="text-center py-12 text-stone-400">
          <p className="text-4xl mb-3">🔍</p>
          <p>No encontramos pedidos con ese número.</p>
          <p className="text-xs mt-1">Verifica que el número sea exactamente el que usaste al hacer el pedido.</p>
        </div>
      )}

      {pedidos.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-stone-500">{pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'} encontrados para {pedidos[0].nombre_cliente}</p>
          {pedidos.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-mono text-stone-400">#{p.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {new Date(p.created_at).toLocaleDateString("es-HN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <p className="font-bold text-amber-800">L.{Number(p.total).toFixed(2)}</p>
              </div>

              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${ESTADO_STYLE[p.estado]}`}>
                <span>{ESTADO_EMOJI[p.estado]}</span>
                <span>{ESTADO_LABEL[p.estado]}</span>
              </div>

              {p.estado === 'listo' && (
                <p className="text-xs text-green-600 mt-2 font-medium">
                  ¡Tu pedido está listo! Espera la confirmación de entrega por WhatsApp.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
