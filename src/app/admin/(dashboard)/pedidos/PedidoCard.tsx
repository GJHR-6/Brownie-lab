import type { Pedido } from '@/types/database';
import { Clock } from 'lucide-react';

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-HN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PedidoCard({ pedido }: { pedido: Pedido }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-3.5 shadow-sm space-y-2.5 select-none">
      {/* ID + total */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-mono text-stone-400">
          #{pedido.id.slice(0, 8).toUpperCase()}
        </span>
        <span className="text-sm font-bold text-amber-700">
          L. {Number(pedido.total).toFixed(2)}
        </span>
      </div>

      {/* Cliente */}
      <div>
        <p className="font-semibold text-sm text-stone-800 leading-tight">
          {pedido.cliente_datos.nombre}
        </p>
        <p className="text-xs text-stone-400">{pedido.cliente_datos.telefono}</p>
      </div>

      {/* Notas */}
      {pedido.cliente_datos.notas && (
        <p className="text-xs text-stone-500 bg-stone-50 rounded-lg px-2.5 py-1.5 leading-relaxed">
          {pedido.cliente_datos.notas}
        </p>
      )}

      {/* Items */}
      {pedido.items && pedido.items.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-amber-700 font-medium hover:text-amber-600 list-none flex items-center gap-1">
            <span>▸</span>
            <span>{pedido.items.length} {pedido.items.length === 1 ? 'producto' : 'productos'}</span>
          </summary>
          <ul className="mt-1.5 space-y-1 pl-1">
            {pedido.items.map((item, i) => (
              <li key={i} className="flex justify-between text-stone-600">
                <span>{item.cantidad}× {item.nombre}</span>
                <span className="font-medium">L.{Number(item.subtotal).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Fecha */}
      <div className="flex items-center gap-1.5 text-xs text-stone-400">
        <Clock className="w-3 h-3" />
        {formatFecha(pedido.created_at)}
      </div>
    </div>
  );
}
