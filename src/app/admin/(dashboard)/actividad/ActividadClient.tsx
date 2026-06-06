'use client';

import { Clock, Package, ShoppingBag, Settings, User, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { LogEntry } from '@/actions/actividad';

const TIPO_IC: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  producto: { icon: <Package  style={{ width: 18, height: 18 }} />, bg: 'rgba(47,111,219,.12)',  color: '#2f6fdb'           },
  pedido:   { icon: <ShoppingBag style={{ width: 18, height: 18 }} />, bg: 'rgba(217,113,30,.13)', color: 'var(--orange-ink)'  },
  config:   { icon: <Settings style={{ width: 18, height: 18 }} />, bg: 'rgba(116,58,20,.12)',   color: 'var(--choco-700)'   },
  auth:     { icon: <User     style={{ width: 18, height: 18 }} />, bg: 'rgba(31,138,91,.12)',   color: 'var(--green)'       },
};

export default function ActividadClient({ logs }: { logs: LogEntry[] }) {
  const router = useRouter();

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1500px] w-full">
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>
            Actividad
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>{logs.length} eventos recientes</p>
        </div>
        <button
          onClick={() => router.refresh()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, padding: '9px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)', cursor: 'pointer', background: 'var(--paper-card)', color: 'var(--ink)' }}
        >
          <RefreshCw style={{ width: 15, height: 15 }} />
          Actualizar
        </button>
      </div>

      <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {logs.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '48px 22px', fontSize: 14, color: 'var(--ink-soft)' }}>
            Sin actividad registrada.
          </p>
        ) : (
          <div>
            {logs.map((log, idx) => {
              const ic = TIPO_IC[log.tipo] ?? { icon: <Clock style={{ width: 18, height: 18 }} />, bg: 'var(--cream)', color: 'var(--ink-soft)' };
              return (
                <div
                  key={log.id}
                  className="group"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 22px',
                    borderBottom: idx < logs.length - 1 ? '1px solid var(--hairline)' : 'none',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', flexShrink: 0, background: ic.bg, color: ic.color }}>
                    {ic.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, color: 'var(--ink)', margin: 0 }}>{log.descripcion}</p>
                    {log.usuario_email && (
                      <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2, fontFamily: 'ui-monospace,monospace' }}>
                        {log.usuario_email}
                      </p>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)', flexShrink: 0, fontFamily: 'ui-monospace,monospace', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString('es-HN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
