import type { Pedido } from '@/types/database';
import { Clock } from 'lucide-react';

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-HN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function PedidoCard({ pedido }: { pedido: Pedido }) {
  return (
    <div
      style={{
        background: 'var(--paper-card)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--r-md)',
        padding: '14px 16px',
        boxShadow: 'var(--shadow-sm)',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* ID + total */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 11, fontFamily: 'ui-monospace,monospace', color: 'var(--ink-soft)' }}>
          #{pedido.id.slice(0, 8).toUpperCase()}
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--orange-ink)' }}>
          L. {Number(pedido.total).toFixed(2)}
        </span>
      </div>

      {/* Cliente */}
      <div>
        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', lineHeight: 1.2, margin: 0 }}>
          {pedido.cliente_datos.nombre}
        </p>
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
          {pedido.cliente_datos.telefono}
        </p>
      </div>

      {/* Notas */}
      {pedido.cliente_datos.notas && (
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', background: 'var(--cream)', borderRadius: 8, padding: '8px 10px', lineHeight: 1.5, margin: 0 }}>
          {pedido.cliente_datos.notas}
        </p>
      )}

      {/* Items */}
      {pedido.items && pedido.items.length > 0 && (
        <details style={{ fontSize: 12 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--orange-ink)', fontWeight: 600, listStyle: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10 }}>▸</span>
            <span>{pedido.items.length} {pedido.items.length === 1 ? 'producto' : 'productos'}</span>
          </summary>
          <ul style={{ marginTop: 6, paddingLeft: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pedido.items.map((item, i) => (
              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)', listStyle: 'none' }}>
                <span>{item.cantidad}× {item.nombre}</span>
                <span style={{ fontWeight: 600 }}>L.{Number(item.subtotal).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Fecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'ui-monospace,monospace' }}>
        <Clock style={{ width: 12, height: 12, flexShrink: 0 }} />
        {formatFecha(pedido.created_at)}
      </div>
    </div>
  );
}
