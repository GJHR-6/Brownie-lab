'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Download, Search, X, MessageCircle, Bell } from 'lucide-react';
import { useRealtimePedidos } from '@/hooks/useRealtimePedidos';
import { actualizarEstadoPedido } from '@/actions/pedidos';
import CrearPedidoModal from './CrearPedidoModal';
import type { Pedido, EstadoPedido, Producto, PedidoItem } from '@/types/database';
import type { ClienteDatos } from '@/types/database';

/* ── Design tokens ── */
const ESTADO_CFG: Record<EstadoPedido, { label: string; chip: string; dot: string }> = {
  pendiente:   { label: 'Pendiente',   chip: '#fbeccb', dot: '#9a6a12' },
  preparacion: { label: 'Preparación', chip: '#dbeafe', dot: '#1d5fb8' },
  listo:       { label: 'Listo',       chip: '#d8f0e2', dot: '#157a4d' },
  completado:  { label: 'Completado',  chip: '#e4ded3', dot: '#6b5743' },
};

const ESTADOS = ['pendiente', 'preparacion', 'listo', 'completado'] as EstadoPedido[];

const TIMELINE: { key: EstadoPedido; label: string }[] = [
  { key: 'pendiente',   label: 'Recibido' },
  { key: 'preparacion', label: 'En preparación' },
  { key: 'listo',       label: 'Listo' },
  { key: 'completado',  label: 'Entregado' },
];

function stepStatus(stepKey: EstadoPedido, current: EstadoPedido): 'done' | 'cur' | 'pending' {
  const si = ESTADOS.indexOf(stepKey);
  const ci = ESTADOS.indexOf(current);
  if (si < ci) return 'done';
  if (si === ci) return 'cur';
  return 'pending';
}

function Chip({ estado }: { estado: EstadoPedido }) {
  const c = ESTADO_CFG[estado];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 'var(--r-pill)', background: c.chip, color: c.dot, whiteSpace: 'nowrap' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

function sendWhatsApp(pedido: Pedido) {
  const cd = pedido.cliente_datos as ClienteDatos;
  const tel = cd.telefono.replace(/\D/g, '');
  const origen = typeof window !== 'undefined' ? window.location.origin : '';
  const id = pedido.id.slice(0, 8).toUpperCase();
  const msg = [`¡Hola ${cd.nombre}! 🍪`, '', `Tu pedido *#${id}* ha sido confirmado y está siendo preparado con mucho amor. 💛`, '', `📍 Rastrea tu pedido:`, `${origen}/seguimiento`, '', '¡Gracias por tu compra en Brownie Lab! 🍪'].join('\n');
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ── Section title helper ── */
function DrawerSecTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', margin: '0 0 12px' }}>{children}</p>;
}

/* ── Drawer ── */
function PedidoDrawer({ pedido, onClose, onUpdated }: { pedido: Pedido; onClose: () => void; onUpdated: (updated: Pedido) => void }) {
  const cd = pedido.cliente_datos as ClienteDatos;
  const items = (pedido.items ?? []) as PedidoItem[];
  const [savingEstado, setSavingEstado] = useState<EstadoPedido | null>(null);
  const [localEstado, setLocalEstado] = useState<EstadoPedido>(pedido.estado);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleGuardar() {
    if (localEstado === pedido.estado) { onClose(); return; }
    setSavingEstado(localEstado);
    setErrorMsg(null);
    const res = await actualizarEstadoPedido(pedido.id, localEstado);
    setSavingEstado(null);
    if (res.success) {
      onUpdated({ ...pedido, estado: localEstado });
    } else {
      setErrorMsg(res.error ?? 'Error al guardar');
      setLocalEstado(pedido.estado);
    }
  }

  const th: React.CSSProperties = { textAlign: 'left', fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', padding: '14px 22px', borderBottom: '1px solid var(--hairline)', background: 'var(--paper)' };
  void th;

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,10,.42)', backdropFilter: 'blur(2px)', zIndex: 80 }}
      />

      {/* Drawer panel */}
      <aside style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'min(460px, 94vw)', background: 'var(--paper)', boxShadow: 'var(--shadow-lg)', zIndex: 90, display: 'flex', flexDirection: 'column' }}>

        {/* Head */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--hairline)', background: 'var(--paper-card)', flexShrink: 0 }}>
          <Chip estado={localEstado} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--ink)', lineHeight: 1 }}>#{pedido.id.slice(0, 8).toUpperCase()}</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {errorMsg && (
            <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 13, color: 'var(--berry)', marginBottom: 20 }}>
              {errorMsg}
            </div>
          )}

          {/* Cliente */}
          <div style={{ marginBottom: 24 }}>
            <DrawerSecTitle>Cliente</DrawerSecTitle>
            <div>
              {[
                { k: 'Nombre', v: cd.nombre },
                { k: 'Teléfono', v: cd.telefono },
                { k: 'Fecha', v: new Date(pedido.created_at).toLocaleString('es-HN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) },
              ].map(({ k, v }, i, arr) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '8px 0', fontSize: 14, borderBottom: i < arr.length - 1 ? '1px dashed var(--hairline)' : 0 }}>
                  <span style={{ color: 'var(--ink-soft)' }}>{k}</span>
                  <span style={{ fontWeight: 600, textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Productos */}
          {items.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <DrawerSecTitle>Productos</DrawerSecTitle>
              <div>
                {items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < items.length - 1 ? '1px solid var(--hairline)' : 0 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--cream)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, color: 'var(--orange-ink)', flexShrink: 0 }}>
                      {item.cantidad}
                    </div>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{item.nombre}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--orange-ink)' }}>
                      L.{Number(item.subtotal).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
                <span style={{ color: 'var(--ink)' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-display)', color: 'var(--orange-ink)', fontSize: 20 }}>
                  L.{Number(pedido.total).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Notas */}
          {cd.notas && (
            <div style={{ marginBottom: 24 }}>
              <DrawerSecTitle>Notas del cliente</DrawerSecTitle>
              <p style={{ fontSize: 14, color: 'var(--ink)', background: 'var(--cream)', borderRadius: 'var(--r-md)', padding: '12px 14px', lineHeight: 1.6 }}>
                {cd.notas}
              </p>
            </div>
          )}

          {/* Comprobante de pago */}
          {pedido.comprobante_url && (
            <div style={{ marginBottom: 24 }}>
              <DrawerSecTitle>Comprobante de pago</DrawerSecTitle>
              <a href={pedido.comprobante_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                <img
                  src={pedido.comprobante_url}
                  alt="Comprobante de pago"
                  style={{ width: '100%', borderRadius: 'var(--r-md)', border: '1px solid var(--hairline)', display: 'block' }}
                />
              </a>
              <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6 }}>
                Toca la imagen para abrirla en pantalla completa
              </p>
            </div>
          )}

          {/* Seguimiento / Timeline */}
          <div style={{ marginBottom: 24 }}>
            <DrawerSecTitle>Seguimiento</DrawerSecTitle>
            <div style={{ position: 'relative', paddingLeft: 26 }}>
              {/* Vertical line */}
              <div style={{ position: 'absolute', left: 7, top: 4, bottom: 4, width: 2, background: 'var(--hairline)' }} />
              {TIMELINE.map(({ key, label }, i) => {
                const st = stepStatus(key, localEstado);
                return (
                  <div key={key} style={{ position: 'relative', paddingBottom: i < TIMELINE.length - 1 ? 18 : 0 }}>
                    {/* Dot */}
                    <div style={{
                      position: 'absolute', left: -23, top: 3, width: 12, height: 12, borderRadius: '50%',
                      background: st === 'done' ? 'var(--green)' : st === 'cur' ? 'var(--orange)' : 'var(--paper)',
                      border: `2px solid ${st === 'done' ? 'var(--green)' : st === 'cur' ? 'var(--orange)' : 'var(--hairline)'}`,
                      boxShadow: st === 'cur' ? '0 0 0 4px rgba(217,113,30,.18)' : 'none',
                    }} />
                    <p style={{ fontSize: 14, fontWeight: st === 'cur' ? 700 : 500, color: st === 'pending' ? 'var(--ink-soft)' : 'var(--ink)', margin: 0 }}>
                      {label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cambiar estado */}
          <div>
            <DrawerSecTitle>Cambiar estado</DrawerSecTitle>
            <select
              value={localEstado}
              onChange={e => setLocalEstado(e.target.value as EstadoPedido)}
              style={{ width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', background: 'var(--paper)', outline: 'none', appearance: 'auto' }}
              onFocus={e => { e.target.style.borderColor = 'var(--orange)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; }}
            >
              {ESTADOS.map(e => (
                <option key={e} value={e}>{ESTADO_CFG[e].label}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '18px 24px', borderTop: '1px solid var(--hairline)', background: 'var(--paper-card)', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button
            onClick={() => sendWhatsApp(pedido)}
            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer', background: 'var(--choco-900)', color: '#fff', transition: '.16s' }}
          >
            <MessageCircle style={{ width: 17, height: 17, color: '#58d684' }} />
            WhatsApp
          </button>
          <button
            onClick={handleGuardar}
            disabled={!!savingEstado}
            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer', background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', transition: '.16s', opacity: savingEstado ? 0.7 : 1 }}
          >
            {savingEstado ? '…' : 'Guardar'}
          </button>
        </div>

      </aside>
    </>
  );
}

/* ── Main component ── */
export default function PedidosClient({ initialPedidos, productos }: { initialPedidos: Pedido[]; productos: Producto[] }) {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [isCrearOpen, setIsCrearOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoPedido | 'todos'>('todos');
  const [, startTransition] = useTransition();
  const [nuevosCount, setNuevosCount] = useState(0);

  const refresh = useCallback(() => {
    startTransition(() => { router.refresh(); });
    setNuevosCount(0);
  }, [router]);

  useRealtimePedidos(useCallback(() => {
    setNuevosCount(n => n + 1);
  }, []));

  function handleUpdated(updated: Pedido) {
    setPedidos(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedPedido(updated);
  }

  const visible = pedidos.filter(p => {
    if (estadoFilter !== 'todos' && p.estado !== estadoFilter) return false;
    if (search.trim()) {
      const cd = p.cliente_datos as ClienteDatos;
      const q = search.toLowerCase();
      return cd.nombre.toLowerCase().includes(q) || cd.telefono.includes(q) || p.id.toLowerCase().includes(q);
    }
    return true;
  });

  const T = {
    th: { textAlign: 'left' as const, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--ink-soft)', padding: '14px 22px', borderBottom: '1px solid var(--hairline)', whiteSpace: 'nowrap' as const, background: 'var(--paper)' },
    td: { padding: '14px 22px', fontSize: 14, color: 'var(--ink)', verticalAlign: 'middle' as const, borderBottom: '1px solid var(--hairline)' },
  };

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1500px] w-full">

      {/* Realtime — nuevos pedidos banner */}
      {nuevosCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          background: 'var(--choco-900)', color: 'var(--on-dark)', borderRadius: 'var(--r-lg)',
          padding: '12px 18px', marginBottom: 20, animation: 'fadeIn .3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell style={{ width: 17, height: 17, color: 'var(--amber)', flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {nuevosCount === 1 ? '1 nuevo pedido recibido' : `${nuevosCount} nuevos pedidos recibidos`}
            </span>
          </div>
          <button
            onClick={refresh}
            style={{ fontSize: 13, fontWeight: 700, padding: '6px 14px', borderRadius: 'var(--r-pill)', background: 'var(--orange)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Actualizar
          </button>
        </div>
      )}

      {/* Page head */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>Pedidos</h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
            Pedidos recibidos por el sitio y WhatsApp.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/api/admin/export/pedidos" download>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)', cursor: 'pointer', background: 'var(--paper-card)', color: 'var(--ink)', transition: '.16s' }}>
              <Download style={{ width: 16, height: 16 }} />CSV
            </button>
          </a>
          <button
            onClick={() => setIsCrearOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer', background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', transition: '.16s' }}>
            <Plus style={{ width: 17, height: 17 }} />Nuevo pedido
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 22, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search style={{ position: 'absolute', left: 14, width: 17, height: 17, color: 'var(--ink-soft)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o #pedido…"
            style={{ padding: '10px 16px 10px 40px', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-pill)', background: 'var(--paper-card)', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', width: 280, outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--orange)'}
            onBlur={e => e.target.style.borderColor = 'var(--hairline)'}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', display: 'grid', placeItems: 'center' }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        {/* Estado filter */}
        <select
          value={estadoFilter}
          onChange={e => setEstadoFilter(e.target.value as EstadoPedido | 'todos')}
          style={{ appearance: 'none', padding: '10px 38px 10px 16px', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-pill)', background: `var(--paper-card) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b5743' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 14px center`, fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--ink)', cursor: 'pointer', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = 'var(--orange)'}
          onBlur={e => e.target.style.borderColor = 'var(--hairline)'}
        >
          <option value="todos">Todos los estados</option>
          {ESTADOS.map(e => (
            <option key={e} value={e}>{ESTADO_CFG[e].label}</option>
          ))}
        </select>

        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink-soft)', fontWeight: 500 }}>
          {visible.length} pedido{visible.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={T.th}>Pedido</th>
                <th style={T.th}>Cliente</th>
                <th style={{ ...T.th, textAlign: 'center' }}>Items</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Total</th>
                <th style={T.th}>Estado</th>
                <th style={T.th}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(p => {
                const cd = p.cliente_datos as ClienteDatos;
                const itemCount = ((p.items ?? []) as PedidoItem[]).reduce((s, i) => s + i.cantidad, 0);
                const initial = (cd.nombre?.[0] ?? '?').toUpperCase();
                const isSelected = selectedPedido?.id === p.id;
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPedido(p)}
                    style={{ transition: 'background .12s', cursor: 'pointer', background: isSelected ? 'var(--cream)' : '' }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--paper)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = ''; }}
                  >
                    {/* ID */}
                    <td style={T.td}>
                      <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, color: 'var(--ink-soft)', background: 'var(--cream-200)', padding: '3px 8px', borderRadius: 6 }}>
                        #{p.id.slice(0, 6).toUpperCase()}
                      </span>
                    </td>

                    {/* Cliente */}
                    <td style={T.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--cream)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--orange-ink)', flexShrink: 0 }}>
                          {initial}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cd.nombre}</p>
                          <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0, fontFamily: 'ui-monospace,monospace' }}>{cd.telefono}</p>
                        </div>
                      </div>
                    </td>

                    {/* Items */}
                    <td style={{ ...T.td, textAlign: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{itemCount || '—'}</span>
                    </td>

                    {/* Total */}
                    <td style={{ ...T.td, textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--orange-ink)', fontSize: 15 }}>
                        L.{Number(p.total).toFixed(2)}
                      </span>
                    </td>

                    {/* Estado */}
                    <td style={T.td}>
                      <Chip estado={p.estado} />
                    </td>

                    {/* Fecha */}
                    <td style={{ ...T.td, color: 'var(--ink-soft)', fontSize: 13, fontFamily: 'ui-monospace,monospace' }}>
                      {new Date(p.created_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'short' })}
                    </td>
                  </tr>
                );
              })}

              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...T.td, textAlign: 'center', padding: '48px 22px', color: 'var(--ink-soft)', borderBottom: 0 }}>
                    {search || estadoFilter !== 'todos' ? 'Sin resultados para este filtro.' : 'No hay pedidos aún.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {selectedPedido && (
        <PedidoDrawer
          pedido={selectedPedido}
          onClose={() => setSelectedPedido(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* Crear modal */}
      {isCrearOpen && (
        <CrearPedidoModal
          productos={productos}
          onSuccess={() => { setIsCrearOpen(false); refresh(); }}
          onClose={() => setIsCrearOpen(false)}
        />
      )}
    </div>
  );
}
