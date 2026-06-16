import type { Pedido, ClienteDatos } from '@/types/database';
import { Clock, X } from 'lucide-react';
import { ESTADO_PAGO_CFG } from './PedidosClient';

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-HN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function PedidoCard({ pedido, onCancel }: { pedido: Pedido; onCancel?: () => void }) {
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
      {/* ID + total + cancelar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontFamily: 'ui-monospace,monospace', color: 'var(--ink-soft)' }}>
            #{pedido.id.slice(0, 8).toUpperCase()}
          </span>
          {pedido.estado_pago !== 'pagado' && (() => {
            const c = ESTADO_PAGO_CFG[pedido.estado_pago];
            return (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: c.chip, color: c.dot, whiteSpace: 'nowrap' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                {c.label}
              </span>
            );
          })()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--orange-ink)' }}>
            L. {Number(pedido.total).toFixed(2)}
          </span>
          {onCancel && (
            <button
              onClick={e => { e.stopPropagation(); onCancel(); }}
              title="Cancelar pedido"
              style={{
                width: 22, height: 22, borderRadius: 6, display: 'grid', placeItems: 'center',
                background: 'transparent', border: '1px solid var(--hairline)',
                color: 'var(--ink-soft)', cursor: 'pointer', flexShrink: 0, transition: '.14s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(158,59,70,.1)'; e.currentTarget.style.color = 'var(--berry)'; e.currentTarget.style.borderColor = 'var(--berry)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.borderColor = 'var(--hairline)'; }}
            >
              <X style={{ width: 11, height: 11 }} />
            </button>
          )}
        </div>
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

      {/* Fecha + entrega */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'ui-monospace,monospace' }}>
          <Clock style={{ width: 12, height: 12, flexShrink: 0 }} />
          {formatFecha(pedido.created_at)}
        </div>
        {(() => {
          const cd = pedido.cliente_datos as ClienteDatos;
          if (!cd.tipo_entrega) return null;
          return (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 6, flexShrink: 0,
              background: cd.tipo_entrega === 'domicilio' ? 'rgba(42,111,219,.1)' : 'var(--cream)',
              color: cd.tipo_entrega === 'domicilio' ? '#2a6fdb' : 'var(--ink-soft)',
            }}>
              {cd.tipo_entrega === 'domicilio' ? '🚚 Domicilio' : '📍 Pickup'}
            </span>
          );
        })()}
      </div>
      {(() => {
        const cd = pedido.cliente_datos as ClienteDatos;
        if (!cd.fecha_entrega) return null;
        return (
          <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'ui-monospace,monospace' }}>
            📅 {new Date(cd.fecha_entrega + 'T12:00:00').toLocaleDateString('es-HN', { day: '2-digit', month: 'short' })}
            {cd.hora_entrega && ` · ${cd.hora_entrega}`}
          </div>
        );
      })()}
    </div>
  );
}
