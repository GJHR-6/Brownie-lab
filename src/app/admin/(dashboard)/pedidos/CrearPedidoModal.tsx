'use client';

import { useState, useActionState, useEffect } from 'react';
import { Loader2, X, Plus, Minus } from 'lucide-react';
import { crearPedidoManual } from '@/actions/pedidos';
import type { Producto, PedidoItem } from '@/types/database';

interface CrearPedidoModalProps {
  productos: Producto[];
  onSuccess: () => void;
  onClose: () => void;
}

export default function CrearPedidoModal({ productos, onSuccess, onClose }: CrearPedidoModalProps) {
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [state, formAction, isPending] = useActionState(crearPedidoManual, null);

  useEffect(() => { if (state?.success) onSuccess(); }, [state, onSuccess]);

  function setQty(id: string, delta: number) {
    setCantidades((prev) => {
      const current = prev[id] ?? 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  }

  const items: PedidoItem[] = Object.entries(cantidades).map(([id, cantidad]) => {
    const p = productos.find((x) => x.id === id)!;
    return {
      producto_id: id,
      nombre: p.nombre,
      precio: Number(p.precio),
      cantidad,
      subtotal: Number(p.precio) * cantidad,
    };
  });

  const total = items.reduce((s, i) => s + i.subtotal, 0);
  const itemCount = items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-stone-800">Nuevo pedido manual</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form action={formAction} className="flex flex-col flex-1 min-h-0">
          <input type="hidden" name="items_json" value={JSON.stringify(items)} />

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {state?.success === false && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {state.error}
              </div>
            )}

            {/* Cliente */}
            <div>
              <h3 className="font-semibold text-stone-700 text-sm mb-3">Cliente</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input name="nombre" required disabled={isPending}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
                    placeholder="María López" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input name="telefono" required disabled={isPending}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
                    placeholder="9999-0000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">Notas</label>
                  <input name="notas" disabled={isPending}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
                    placeholder="Sin nueces, para llevar…" />
                </div>
              </div>
            </div>

            {/* Productos */}
            <div>
              <h3 className="font-semibold text-stone-700 text-sm mb-3">Productos</h3>
              <div className="space-y-2">
                {productos.filter(p => p.disponible).map((p) => {
                  const qty = cantidades[p.id] ?? 0;
                  return (
                    <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      qty > 0 ? 'border-amber-300 bg-amber-50' : 'border-stone-200'
                    }`}>
                      <span className="text-xl flex-shrink-0">{p.emoji ?? '🍪'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{p.nombre}</p>
                        <p className="text-xs text-amber-700 font-semibold">L.{Number(p.precio).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button type="button" onClick={() => setQty(p.id, -1)} disabled={qty === 0 || isPending}
                          className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center disabled:opacity-30 transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold text-stone-800">{qty}</span>
                        <button type="button" onClick={() => setQty(p.id, 1)} disabled={isPending}
                          className="w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center disabled:opacity-30 transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-stone-100 px-6 py-4 flex-shrink-0 space-y-3">
            {itemCount > 0 && (
              <div className="flex justify-between text-sm font-semibold text-stone-800 bg-stone-50 rounded-xl px-4 py-2.5">
                <span>{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</span>
                <span className="text-amber-800">Total: L.{total.toFixed(2)}</span>
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={isPending}
                className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-colors disabled:opacity-60">
                Cancelar
              </button>
              <button type="submit" disabled={isPending || itemCount === 0}
                className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? 'Creando…' : 'Crear pedido'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
