'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Phone, X, Loader2 } from 'lucide-react';
import { buscarClienteAdmin, type CuponFidelizacion } from '@/actions/fidelizacion';
import { getPedidosPorTelefono } from '@/actions/pedidos';
import type { Pedido, EstadoPedido, PedidoItem, ClienteDatos } from '@/types/database';

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

const ESTADO_CFG: Record<EstadoPedido, { label: string; chip: string; dot: string }> = {
  pendiente:   { label: 'Pendiente',   chip: '#fbeccb', dot: '#9a6a12' },
  preparacion: { label: 'Preparación', chip: '#dbeafe', dot: '#1d5fb8' },
  listo:       { label: 'Listo',       chip: '#d8f0e2', dot: '#157a4d' },
  completado:  { label: 'Completado',  chip: '#e4ded3', dot: '#6b5743' },
  cancelado:   { label: 'Cancelado',   chip: '#fce8ea', dot: '#9e3b46' },
};

function LoyaltyDots({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {Array.from({ length: LOYALTY_MAX }).map((_, i) => (
        <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: i < current ? 'var(--orange)' : 'var(--cream-200)', transition: '.12s' }} />
      ))}
      <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>
        {current}/{LOYALTY_MAX}
      </span>
    </div>
  );
}

function SecTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', margin: '0 0 12px' }}>{children}</p>;
}

/* ── Drawer de detalle del cliente ── */
function ClienteDrawer({ cliente, onClose }: { cliente: ClienteRow; onClose: () => void }) {
  // loading derivado: null = cargando (evita setState síncrono en effect)
  const [datos, setDatos] = useState<{ pedidos: Pedido[]; cupones: CuponFidelizacion[] } | null>(null);
  const loading = datos === null;
  const pedidos = datos?.pedidos ?? [];
  const cupones = datos?.cupones ?? [];

  useEffect(() => {
    let activo = true;
    Promise.all([
      getPedidosPorTelefono(cliente.telefono),
      buscarClienteAdmin(cliente.telefono),
    ]).then(([peds, clienteResult]) => {
      if (!activo) return;
      setDatos({
        pedidos: peds,
        cupones: clienteResult.success ? clienteResult.data.cupones : [],
      });
    });
    return () => { activo = false; };
  }, [cliente.telefono]);

  const initials = cliente.nombre.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      {/* Scrim */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,10,.42)', backdropFilter: 'blur(2px)', zIndex: 80 }} />

      {/* Panel */}
      <aside style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'min(480px, 94vw)', background: 'var(--paper)', boxShadow: 'var(--shadow-lg)', zIndex: 90, display: 'flex', flexDirection: 'column' }}>

        {/* Head */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', borderBottom: '1px solid var(--hairline)', background: 'var(--paper-card)', flexShrink: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--cream)', color: 'var(--orange-ink)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 17, flexShrink: 0 }}>
            {initials || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cliente.nombre || '—'}</p>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0, fontFamily: 'ui-monospace,monospace' }}>{cliente.telefono}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer', flexShrink: 0 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* Fidelidad */}
          <div style={{ marginBottom: 24 }}>
            <SecTitle>Programa de fidelidad</SecTitle>
            <div style={{ background: 'var(--cream)', borderRadius: 'var(--r-md)', padding: '16px 18px' }}>
              <LoyaltyDots current={cliente.compras_actuales} />
              <div style={{ display: 'flex', gap: 24, marginTop: 14 }}>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--orange-ink)', margin: 0 }}>{cliente.compras_totales}</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>compras totales</p>
                </div>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{cliente.compras_actuales}</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>en ciclo actual</p>
                </div>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#1f8a5b', margin: 0 }}>{cliente.cupones[0]?.count ?? 0}</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>cupones totales</p>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '32px 0', color: 'var(--ink-soft)' }}>
              <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 14 }}>Cargando historial…</span>
            </div>
          ) : (
            <>
              {/* Cupones disponibles */}
              {cupones.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <SecTitle>Cupones disponibles</SecTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cupones.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(31,138,91,.07)', border: '1px solid rgba(31,138,91,.2)', borderRadius: 'var(--r-md)', padding: '10px 14px' }}>
                        <span style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 700, fontSize: 14, color: '#1f5c3a', letterSpacing: '.06em' }}>{c.codigo_unico}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#1f8a5b', background: 'rgba(31,138,91,.12)', padding: '2px 8px', borderRadius: 4 }}>DISPONIBLE</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pedidos recientes */}
              <div>
                <SecTitle>Últimos pedidos</SecTitle>
                {pedidos.length === 0 ? (
                  <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>Sin pedidos registrados.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pedidos.map(p => {
                      const cd = p.cliente_datos as ClienteDatos;
                      const cfg = ESTADO_CFG[p.estado];
                      const items = (p.items ?? []) as PedidoItem[];
                      return (
                        <div key={p.id} style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, color: 'var(--ink-soft)' }}>#{p.id.slice(0, 8).toUpperCase()}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--r-pill)', background: cfg.chip, color: cfg.dot }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                              {cfg.label}
                            </span>
                          </div>
                          {items.length > 0 && (
                            <div style={{ marginBottom: 6 }}>
                              {items.slice(0, 3).map((item, i) => (
                                <p key={i} style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '2px 0' }}>
                                  {item.cantidad}× {item.nombre}
                                </p>
                              ))}
                              {items.length > 3 && (
                                <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '2px 0' }}>+{items.length - 3} más…</p>
                              )}
                            </div>
                          )}
                          {cd.notas && (
                            <p style={{ fontSize: 12, color: 'var(--ink-soft)', fontStyle: 'italic', margin: '0 0 6px' }}>&ldquo;{cd.notas}&rdquo;</p>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                              {new Date(p.created_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--orange-ink)' }}>
                              L.{Number(p.total).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--hairline)', background: 'var(--paper-card)', flexShrink: 0 }}>
          <a
            href={`https://wa.me/${cliente.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${cliente.nombre}! 🍪`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', background: 'var(--choco-900)', color: '#fff', textDecoration: 'none' }}
          >
            <Phone style={{ width: 15, height: 15, color: '#58d684' }} />
            WhatsApp
          </a>
        </div>
      </aside>
    </>
  );
}

/* ── Main ── */
export default function ClientesClient({ clientes }: { clientes: ClienteRow[] }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ClienteRow | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return clientes;
    const q = search.toLowerCase();
    return clientes.filter(c => c.nombre.toLowerCase().includes(q) || c.telefono.includes(q));
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total clientes',  value: clientes.length, sub: 'registrados', color: 'var(--orange-ink)', bg: 'rgba(217,113,30,.1)' },
            { label: 'Pedidos totales', value: clientes.reduce((s, c) => s + (c.pedidos[0]?.count ?? 0), 0), sub: 'de todos los clientes', color: '#2f6fdb', bg: 'rgba(47,111,219,.1)' },
            { label: 'Cupones activos', value: clientes.reduce((s, c) => s + (c.cupones[0]?.count ?? 0), 0), sub: 'pendientes de usar', color: '#1f8a5b', bg: 'rgba(31,138,91,.1)' },
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
                const isSelected = selected?.telefono === c.telefono;
                return (
                  <tr
                    key={c.telefono}
                    onClick={() => setSelected(c)}
                    style={{ transition: 'background .12s', cursor: 'pointer', background: isSelected ? 'var(--cream)' : '' }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--paper)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = ''; }}
                  >
                    {/* Cliente */}
                    <td style={T.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: 'var(--cream)', color: 'var(--orange-ink)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14 }}>
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
                        onClick={e => e.stopPropagation()}
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

      {/* Drawer */}
      {selected && (
        <ClienteDrawer cliente={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
