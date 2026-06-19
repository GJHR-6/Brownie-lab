'use client';

import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Download, Search, X, MessageCircle, Bell } from 'lucide-react';
import { useRealtimePedidos } from '@/hooks/useRealtimePedidos';
import { actualizarEstadoPedido, actualizarEstadoPago } from '@/actions/pedidos';
import { abrirWhatsAppPedido } from '@/lib/whatsappPedido';
import { useConfirm } from '@/components/admin/ConfirmProvider';
import { useModalA11y } from '@/hooks/useModalA11y';
import CrearPedidoModal, { type ToppingExtra } from './CrearPedidoModal';
import type { Pedido, EstadoPedido, EstadoPago, Producto, PedidoItem } from '@/types/database';
import type { ClienteDatos } from '@/types/database';

/* ── Design tokens ── */
const ESTADO_CFG: Record<EstadoPedido, { label: string; chip: string; dot: string }> = {
  pendiente:   { label: 'Pendiente',   chip: '#fbeccb', dot: '#9a6a12' },
  preparacion: { label: 'Preparación', chip: '#dbeafe', dot: '#1d5fb8' },
  listo:       { label: 'Listo',       chip: '#d8f0e2', dot: '#157a4d' },
  completado:  { label: 'Completado',  chip: '#e4ded3', dot: '#6b5743' },
  cancelado:   { label: 'Cancelado',   chip: '#fce8ea', dot: '#9e3b46' },
};

const ESTADOS = ['pendiente', 'preparacion', 'listo', 'completado', 'cancelado'] as EstadoPedido[];

export const ESTADO_PAGO_CFG: Record<EstadoPago, { label: string; chip: string; dot: string }> = {
  pendiente:          { label: 'Sin pago',         chip: '#fce8ea', dot: '#9e3b46' },
  anticipo_recibido:  { label: 'Anticipo recibido', chip: '#fbeccb', dot: '#9a6a12' },
  pagado:             { label: 'Pagado',           chip: '#d8f0e2', dot: '#157a4d' },
};

const ESTADOS_PAGO = ['pendiente', 'anticipo_recibido', 'pagado'] as EstadoPago[];

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

export function ChipPago({ estado }: { estado: EstadoPago }) {
  const c = ESTADO_PAGO_CFG[estado];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 'var(--r-pill)', background: c.chip, color: c.dot, whiteSpace: 'nowrap' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

/* ── Section title helper ── */
function DrawerSecTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', margin: '0 0 12px' }}>{children}</p>;
}

/* ── Drawer ── */
function PedidoDrawer({ pedido, onClose, onUpdated, onEditar }: { pedido: Pedido; onClose: () => void; onUpdated: (updated: Pedido) => void; onEditar: () => void }) {
  const confirmar = useConfirm();
  useModalA11y(onClose);
  const cd = pedido.cliente_datos as ClienteDatos;
  const items = (pedido.items ?? []) as PedidoItem[];
  const [savingEstado, setSavingEstado] = useState<EstadoPedido | null>(null);
  const [localEstado, setLocalEstado] = useState<EstadoPedido>(pedido.estado);
  const [localEstadoPago, setLocalEstadoPago] = useState<EstadoPago>(pedido.estado_pago);
  const [savingPago, setSavingPago] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleGuardar() {
    if (localEstado === pedido.estado) { onClose(); return; }
    setSavingEstado(localEstado);
    setErrorMsg(null);
    const res = await actualizarEstadoPedido(pedido.id, localEstado);
    setSavingEstado(null);
    if (res.success) {
      onUpdated({ ...pedido, estado: localEstado });
      onClose(); // comportamiento consistente: guardar siempre cierra
    } else {
      setErrorMsg(res.error ?? 'Error al guardar');
      setLocalEstado(pedido.estado);
    }
  }

  async function handleEstadoPagoChange(nuevo: EstadoPago) {
    setLocalEstadoPago(nuevo);
    setSavingPago(true);
    setErrorMsg(null);
    const res = await actualizarEstadoPago(pedido.id, nuevo);
    setSavingPago(false);
    if (res.success) {
      onUpdated({ ...pedido, estado_pago: nuevo });
    } else {
      setErrorMsg(res.error ?? 'Error al guardar');
      setLocalEstadoPago(pedido.estado_pago);
    }
  }

  async function handleCancelar() {
    if (!(await confirmar({ titulo: 'Cancelar pedido', mensaje: 'El pedido quedará marcado como cancelado. Podés revertirlo cambiando el estado.', confirmLabel: 'Cancelar pedido', cancelLabel: 'Volver', peligro: true }))) return;
    setSavingEstado('cancelado');
    setErrorMsg(null);
    const res = await actualizarEstadoPedido(pedido.id, 'cancelado');
    setSavingEstado(null);
    if (res.success) {
      setLocalEstado('cancelado');
      onUpdated({ ...pedido, estado: 'cancelado' });
    } else {
      setErrorMsg(res.error ?? 'Error al cancelar');
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
      <aside role="dialog" aria-modal="true" aria-label={`Pedido #${pedido.id.slice(0, 8).toUpperCase()}`}
        style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'min(460px, 94vw)', background: 'var(--paper)', boxShadow: 'var(--shadow-lg)', zIndex: 90, display: 'flex', flexDirection: 'column' }}>

        {/* Head */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--hairline)', background: 'var(--paper-card)', flexShrink: 0 }}>
          <Chip estado={localEstado} />
          <ChipPago estado={localEstadoPago} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--ink)', lineHeight: 1 }}>#{pedido.id.slice(0, 8).toUpperCase()}</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {localEstado === 'cancelado' && (
            <div style={{ background: '#fce8ea', border: '1px solid #e6c4c8', borderLeft: '4px solid var(--berry)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 13, color: '#7a2530', marginBottom: 20 }}>
              Este pedido fue <strong>cancelado</strong>. Podés cambiar el estado si fue un error.
            </div>
          )}
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

          {/* Entrega y pago */}
          {(cd.tipo_entrega || cd.metodo_pago || cd.fecha_entrega) && (
            <div style={{ marginBottom: 24 }}>
              <DrawerSecTitle>Entrega y pago</DrawerSecTitle>
              {cd.tipo_entrega && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '8px 0', fontSize: 14, borderBottom: '1px dashed var(--hairline)' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Tipo</span>
                  <span style={{ fontWeight: 600 }}>{cd.tipo_entrega === 'pickup' ? '📍 Recoger en tienda' : '🚚 A domicilio'}</span>
                </div>
              )}
              {cd.direccion && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '8px 0', fontSize: 14, borderBottom: '1px dashed var(--hairline)' }}>
                  <span style={{ color: 'var(--ink-soft)', flexShrink: 0 }}>Dirección</span>
                  <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{cd.direccion}</span>
                </div>
              )}
              {(cd.fecha_entrega || cd.hora_entrega) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '8px 0', fontSize: 14, borderBottom: cd.metodo_pago ? '1px dashed var(--hairline)' : 0 }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Fecha preferida</span>
                  <span style={{ fontWeight: 600 }}>
                    {[
                      cd.fecha_entrega ? new Date(cd.fecha_entrega + 'T12:00:00').toLocaleDateString('es-HN', { weekday: 'short', day: '2-digit', month: 'short' }) : '',
                      cd.hora_entrega,
                    ].filter(Boolean).join(' — ')}
                  </span>
                </div>
              )}
              {cd.metodo_pago && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '8px 0', fontSize: 14, borderBottom: cd.envio ? '1px dashed var(--hairline)' : 0 }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Método de pago</span>
                  <span style={{ fontWeight: 600 }}>{cd.metodo_pago === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}</span>
                </div>
              )}
              {cd.envio && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '8px 0', fontSize: 14 }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Envío</span>
                  <span style={{ fontWeight: 600 }}>
                    {cd.envio.sede}
                    {cd.envio.distancia_km > 0 && ` · ~${cd.envio.distancia_km} km`}
                    {' · '}
                    {cd.envio.gratis ? 'GRATIS' : `L.${Number(cd.envio.costo).toFixed(2)}`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Estado de pago */}
          <div style={{ marginBottom: 24 }}>
            <DrawerSecTitle>Estado de pago</DrawerSecTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select
                value={localEstadoPago}
                onChange={e => handleEstadoPagoChange(e.target.value as EstadoPago)}
                disabled={savingPago}
                className="bl-select"
                style={{ flex: 1, border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' }}
                onFocus={e => { e.target.style.borderColor = 'var(--orange)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; }}
              >
                {ESTADOS_PAGO.map(e => (
                  <option key={e} value={e}>{ESTADO_PAGO_CFG[e].label}</option>
                ))}
              </select>
              {savingPago && <span style={{ fontSize: 12, color: 'var(--ink-soft)', flexShrink: 0 }}>Guardando…</span>}
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
                <Image
                  src={pedido.comprobante_url}
                  alt="Comprobante de pago"
                  width={0}
                  height={0}
                  sizes="(max-width: 460px) 94vw, 460px"
                  style={{ width: '100%', height: 'auto', borderRadius: 'var(--r-md)', border: '1px solid var(--hairline)', display: 'block' }}
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
              className="bl-select"
              style={{ width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' }}
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
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--hairline)', background: 'var(--paper-card)', display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          <button
            onClick={() => abrirWhatsAppPedido(pedido, localEstado)}
            title="El mensaje se adapta al estado actual del pedido"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, padding: '9px 14px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer', background: 'var(--choco-900)', color: '#fff', transition: '.16s' }}
          >
            <MessageCircle style={{ width: 15, height: 15, color: '#58d684' }} />
            WhatsApp
          </button>
          <button
            onClick={onEditar}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, padding: '9px 14px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)', cursor: 'pointer', background: 'var(--paper-card)', color: 'var(--ink)', transition: '.16s' }}
          >
            ✏️ Editar
          </button>
          {localEstado !== 'cancelado' && (
            <button
              onClick={handleCancelar}
              disabled={!!savingEstado}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, padding: '9px 14px', borderRadius: 'var(--r-pill)', border: '1.5px solid #e6c4c8', cursor: 'pointer', background: '#fce8ea', color: '#9e3b46', transition: '.16s', opacity: savingEstado ? 0.7 : 1 }}
            >
              Cancelar pedido
            </button>
          )}
          <button
            onClick={handleGuardar}
            disabled={!!savingEstado}
            style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, padding: '9px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer', background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', transition: '.16s', opacity: savingEstado ? 0.7 : 1 }}
          >
            {savingEstado ? '…' : 'Guardar'}
          </button>
        </div>

      </aside>
    </>
  );
}

/* ── Main component ── */
export default function PedidosClient({ initialPedidos, productos, toppings, viewSwitcher, footer }: { initialPedidos: Pedido[]; productos: Producto[]; toppings?: ToppingExtra[]; viewSwitcher?: React.ReactNode; footer?: React.ReactNode }) {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [editPedido, setEditPedido] = useState<Pedido | null>(null);
  const [isCrearOpen, setIsCrearOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoPedido | 'todos'>('todos');
  const [pagoFilter, setPagoFilter] = useState<'todos' | 'pagado' | 'no_pagado'>('todos');
  const [, startTransition] = useTransition();
  const [nuevosCount, setNuevosCount] = useState(0);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza con datos nuevos del servidor tras router.refresh()
  // (ajuste de estado durante render — patrón recomendado por React, sin effect)
  const [prevInitial, setPrevInitial] = useState(initialPedidos);
  if (prevInitial !== initialPedidos) {
    setPrevInitial(initialPedidos);
    setPedidos(initialPedidos);
    setNuevosCount(0);
  }

  const refresh = useCallback(() => {
    startTransition(() => { router.refresh(); });
    setNuevosCount(0);
  }, [router]);

  // Auto-refresh con debounce: agrupa ráfagas de eventos en un solo refresh
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      startTransition(() => { router.refresh(); });
    }, 1200);
  }, [router]);

  useEffect(() => () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); }, []);

  useRealtimePedidos(useCallback((tipo) => {
    if (tipo === 'insert') setNuevosCount(n => n + 1);
    scheduleRefresh(); // INSERTs y UPDATEs (cambios desde otro dispositivo)
  }, [scheduleRefresh]));

  function handleUpdated(updated: Pedido) {
    setPedidos(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedPedido(updated);
  }

  const visible = pedidos.filter(p => {
    if (estadoFilter !== 'todos' && p.estado !== estadoFilter) return false;
    if (pagoFilter === 'pagado' && p.estado_pago !== 'pagado') return false;
    if (pagoFilter === 'no_pagado' && p.estado_pago === 'pagado') return false;
    if (search.trim()) {
      const cd = p.cliente_datos as ClienteDatos;
      const q = search.toLowerCase();
      return cd.nombre.toLowerCase().includes(q) || (cd.telefono?.includes(q) ?? false) || p.id.toLowerCase().includes(q);
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
              {nuevosCount === 1 ? '1 nuevo pedido recibido' : `${nuevosCount} nuevos pedidos recibidos`} — actualizando…
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {viewSwitcher}
          <a href="/api/admin/export/pedidos" download
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)', cursor: 'pointer', background: 'var(--paper-card)', color: 'var(--ink)', transition: '.16s', textDecoration: 'none' }}>
            <Download style={{ width: 16, height: 16 }} />CSV
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
          className="bl-select"
          style={{ padding: '10px 16px', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-pill)', background: 'var(--paper-card)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--ink)', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = 'var(--orange)'}
          onBlur={e => e.target.style.borderColor = 'var(--hairline)'}
        >
          <option value="todos">Todos los estados</option>
          {ESTADOS.map(e => (
            <option key={e} value={e}>{ESTADO_CFG[e].label}</option>
          ))}
        </select>

        {/* Pago filter */}
        <select
          value={pagoFilter}
          onChange={e => setPagoFilter(e.target.value as 'todos' | 'pagado' | 'no_pagado')}
          className="bl-select"
          style={{ padding: '10px 16px', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-pill)', background: 'var(--paper-card)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--ink)', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = 'var(--orange)'}
          onBlur={e => e.target.style.borderColor = 'var(--hairline)'}
        >
          <option value="todos">Pago: todos</option>
          <option value="pagado">Pagados</option>
          <option value="no_pagado">No pagados</option>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                        <Chip estado={p.estado} />
                        <ChipPago estado={p.estado_pago} />
                      </div>
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

      {/* Paginación */}
      {footer}

      {/* Drawer */}
      {selectedPedido && (
        <PedidoDrawer
          pedido={selectedPedido}
          onClose={() => setSelectedPedido(null)}
          onUpdated={handleUpdated}
          onEditar={() => { setEditPedido(selectedPedido); setSelectedPedido(null); }}
        />
      )}

      {/* Editar modal */}
      {editPedido && (
        <CrearPedidoModal
          productos={productos}
          toppings={toppings}
          pedido={editPedido}
          onSuccess={() => { setEditPedido(null); refresh(); }}
          onClose={() => setEditPedido(null)}
        />
      )}

      {/* Crear modal */}
      {isCrearOpen && (
        <CrearPedidoModal
          productos={productos}
          toppings={toppings}
          onSuccess={() => { setIsCrearOpen(false); refresh(); }}
          onClose={() => setIsCrearOpen(false)}
        />
      )}
    </div>
  );
}
