'use client';

import { useState, useMemo } from 'react';
import { Search, Phone } from 'lucide-react';

interface ClienteRow {
  telefono: string;
  nombre: string;
  compras_actuales: number;
  compras_totales: number;
  created_at: string;
  updated_at: string;
  pedidos: { count: number }[];
  cupones: { count: number }[];
}

const T = {
  th: { textAlign: 'left' as const, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--ink-soft)', padding: '14px 22px', borderBottom: '1px solid var(--hairline)', whiteSpace: 'nowrap' as const, background: 'var(--paper)' },
  td: { padding: '14px 22px', fontSize: 14, color: 'var(--ink)', verticalAlign: 'middle' as const, borderBottom: '1px solid var(--hairline)' },
};

const LOYALTY_MAX = 10;

function LoyaltyDots({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {Array.from({ length: LOYALTY_MAX }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
            background: i < current ? 'var(--orange)' : 'var(--cream-200)',
            transition: '.12s',
          }}
        />
      ))}
      <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>
        {current}/{LOYALTY_MAX}
      </span>
    </div>
  );
}

export default function ClientesClient({ clientes }: { clientes: ClienteRow[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return clientes;
    const q = search.toLowerCase();
    return clientes.filter(c =>
      c.nombre.toLowerCase().includes(q) || c.telefono.includes(q)
    );
  }, [clientes, search]);

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1500px] w-full">

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>Clientes</h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
            {filtered.length !== clientes.length
              ? `${filtered.length} de ${clientes.length} clientes`
              : `${clientes.length} ${clientes.length === 1 ? 'cliente registrado' : 'clientes registrados'}`}
          </p>
        </div>
      </div>

      {/* Stats row */}
      {clientes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            {
              label: 'Total clientes',
              value: clientes.length,
              sub: 'registrados',
              color: 'var(--orange-ink)',
              bg: 'rgba(217,113,30,.1)',
            },
            {
              label: 'Pedidos totales',
              value: clientes.reduce((s, c) => s + (c.pedidos[0]?.count ?? 0), 0),
              sub: 'de todos los clientes',
              color: '#2f6fdb',
              bg: 'rgba(47,111,219,.1)',
            },
            {
              label: 'Cupones activos',
              value: clientes.reduce((s, c) => s + (c.cupones[0]?.count ?? 0), 0),
              sub: 'pendientes de usar',
              color: '#1f8a5b',
              bg: 'rgba(31,138,91,.1)',
            },
          ].map(({ label, value, sub, color, bg }) => (
            <div key={label} style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', padding: '18px 22px', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, color, lineHeight: 1, margin: 0 }}>{value}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: '4px 0 2px' }}>{label}</p>
              <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', margin: 0 }}>{sub}</p>
              <div style={{ marginTop: 10, height: 3, borderRadius: 2, background: bg }}>
                <div style={{ height: '100%', width: '100%', borderRadius: 2, background: color, opacity: .5 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 340, marginBottom: 18 }}>
        <Search style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--ink-soft)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o teléfono…"
          style={{ width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-pill)', padding: '8px 14px 8px 36px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink)', background: 'var(--paper-card)', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = 'var(--orange)'}
          onBlur={e => e.target.style.borderColor = 'var(--hairline)'}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={T.th}>Cliente</th>
                <th style={T.th}>Teléfono</th>
                <th style={{ ...T.th, textAlign: 'center' }}>Fidelidad</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Pedidos</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Cupones</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Registrado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const initials = c.nombre.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                const pedidoCount = c.pedidos[0]?.count ?? 0;
                const cuponCount  = c.cupones[0]?.count ?? 0;
                return (
                  <tr key={c.telefono}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                    style={{ transition: 'background .12s' }}>

                    {/* Cliente */}
                    <td style={T.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                          background: 'var(--cream)', color: 'var(--orange-ink)',
                          display: 'grid', placeItems: 'center',
                          fontWeight: 700, fontSize: 14,
                        }}>
                          {initials || '?'}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{c.nombre || '—'}</p>
                          <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>
                            {c.compras_totales} {c.compras_totales === 1 ? 'compra' : 'compras'} en total
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Teléfono */}
                    <td style={T.td}>
                      <a
                        href={`tel:${c.telefono}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink)', textDecoration: 'none', fontFamily: 'ui-monospace,monospace', fontSize: 13 }}
                      >
                        <Phone style={{ width: 13, height: 13, color: 'var(--ink-soft)' }} />
                        {c.telefono}
                      </a>
                    </td>

                    {/* Fidelidad */}
                    <td style={{ ...T.td, textAlign: 'center' }}>
                      <LoyaltyDots current={c.compras_actuales} />
                    </td>

                    {/* Pedidos */}
                    <td style={{ ...T.td, textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>
                        {pedidoCount}
                      </span>
                    </td>

                    {/* Cupones */}
                    <td style={{ ...T.td, textAlign: 'right' }}>
                      {cuponCount > 0 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--r-pill)', background: 'rgba(31,138,91,.1)', color: '#1f8a5b' }}>
                          {cuponCount} disponible{cuponCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--ink-soft)', fontSize: 13 }}>—</span>
                      )}
                    </td>

                    {/* Fecha */}
                    <td style={{ ...T.td, textAlign: 'right', color: 'var(--ink-soft)', fontSize: 13 }}>
                      {new Date(c.created_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...T.td, textAlign: 'center', padding: '56px 22px', color: 'var(--ink-soft)', borderBottom: 0 }}>
                    {search ? 'Sin resultados para esta búsqueda.' : 'No hay clientes registrados aún.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
