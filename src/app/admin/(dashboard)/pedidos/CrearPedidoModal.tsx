'use client';

import { useState, useActionState, useEffect, useMemo } from 'react';
import { Loader2, X, Plus, Minus, Search, Upload } from 'lucide-react';
import { crearPedidoManual, actualizarPedidoManual } from '@/actions/pedidos';
import { useModalA11y } from '@/hooks/useModalA11y';
import type { Producto, Pedido, PedidoItem, ClienteDatos, OrigenPedido } from '@/types/database';

const T = {
  inp: { width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' },
};

export interface ToppingExtra { id: string; nombre: string; precio_extra: number }

export default function CrearPedidoModal({ productos, toppings = [], pedido, onSuccess, onClose }: { productos: Producto[]; toppings?: ToppingExtra[]; pedido?: Pedido; onSuccess: () => void; onClose: () => void }) {
  const isEditing = !!pedido;
  const cd = (pedido?.cliente_datos ?? {}) as ClienteDatos;

  // Cantidades iniciales desde los items del pedido (solo los ligados a producto)
  const [cantidades, setCantidades] = useState<Record<string, number>>(() => {
    if (!pedido?.items) return {};
    const init: Record<string, number> = {};
    for (const it of pedido.items) {
      if (it.producto_id) init[it.producto_id] = (init[it.producto_id] ?? 0) + it.cantidad;
    }
    return init;
  });
  // Toppings extra: items "Extra: <nombre>" sin producto_id — editables por cantidad
  const [extras, setExtras] = useState<Record<string, number>>(() => {
    if (!pedido?.items) return {};
    const init: Record<string, number> = {};
    for (const it of pedido.items) {
      if (it.producto_id) continue;
      const t = toppings.find(tp => `Extra: ${tp.nombre}` === it.nombre);
      if (t) init[t.id] = (init[t.id] ?? 0) + it.cantidad;
    }
    return init;
  });

  // Items personalizados (sin producto_id y que no son toppings) — se conservan tal cual
  const fixedItems: PedidoItem[] = useMemo(
    () => (pedido?.items ?? []).filter(it => !it.producto_id && !toppings.some(tp => `Extra: ${tp.nombre}` === it.nombre)),
    [pedido, toppings]
  );

  const [busqueda, setBusqueda] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState<'pickup' | 'domicilio'>(cd.tipo_entrega ?? 'pickup');
  const [metodoPago, setMetodoPago] = useState<string>(cd.metodo_pago ?? '');
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
  const [origen, setOrigen] = useState<OrigenPedido>(cd.origen ?? 'instagram');
  const telefonoRequerido = origen === 'pagina';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const action = useMemo(() => isEditing ? actualizarPedidoManual.bind(null, pedido!.id) : crearPedidoManual, []);
  const [state, formAction, isPending] = useActionState(action, null);
  useModalA11y(onClose);

  useEffect(() => { if (state?.success) onSuccess(); }, [state, onSuccess]);

  function setQty(id: string, delta: number) {
    setCantidades(prev => {
      const current = prev[id] ?? 0;
      const next = Math.max(0, current + delta);
      if (next === 0) { const rest = { ...prev }; delete rest[id]; return rest; }
      return { ...prev, [id]: next };
    });
  }

  const items: PedidoItem[] = Object.entries(cantidades).map(([id, cantidad]) => {
    const p = productos.find(x => x.id === id)!;
    return { producto_id: id, nombre: p.nombre, precio: Number(p.precio), cantidad, subtotal: Number(p.precio) * cantidad };
  });

  const extraItems: PedidoItem[] = Object.entries(extras)
    .filter(([, cant]) => cant > 0)
    .map(([id, cantidad]) => {
      const t = toppings.find(tp => tp.id === id)!;
      return { producto_id: null, nombre: `Extra: ${t.nombre}`, precio: t.precio_extra, cantidad, subtotal: t.precio_extra * cantidad };
    });

  const allItems: PedidoItem[] = [...fixedItems, ...items, ...extraItems];
  const total = allItems.reduce((s, i) => s + i.subtotal, 0);
  const itemCount = allItems.reduce((s, i) => s + i.cantidad, 0);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,10,.42)', backdropFilter: 'blur(2px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-label={isEditing ? `Editar pedido #${pedido!.id.slice(0, 8).toUpperCase()}` : "Nuevo pedido manual"}
        style={{ background: 'var(--paper)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--hairline)', background: 'var(--paper-card)', flexShrink: 0, borderRadius: 'var(--r-lg) var(--r-lg) 0 0' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', margin: 0, flex: 1 }}>{isEditing ? `Editar pedido #${pedido!.id.slice(0, 8).toUpperCase()}` : 'Nuevo pedido manual'}</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <input type="hidden" name="items_json" value={JSON.stringify(allItems)} />

          <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {state?.success === false && (
              <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderRadius: 'var(--r-md)', padding: '11px 14px', fontSize: 13, color: 'var(--berry)' }}>{state.error}</div>
            )}

            {/* Cliente */}
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', margin: '0 0 14px' }}>Cliente</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Origen del pedido</label>
                  <select name="origen" value={origen} disabled={isPending} className="bl-select"
                    onChange={e => setOrigen(e.target.value as OrigenPedido)}
                    style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }}>
                    <option value="instagram">📸 Instagram</option>
                    <option value="facebook">💬 Facebook</option>
                    <option value="whatsapp">📱 WhatsApp</option>
                    <option value="pagina">🌐 Página web</option>
                    <option value="otro">📦 Otro</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                    Nombre <span style={{ color: 'var(--berry)' }}>*</span>
                  </label>
                  <input name="nombre" required minLength={2} maxLength={120} disabled={isPending} defaultValue={cd.nombre ?? ""}
                    placeholder="María López"
                    style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }}
                    onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)'; }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                    Teléfono {telefonoRequerido ? <span style={{ color: 'var(--berry)' }}>*</span> : <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-soft)' }}>(opcional — sin tel. no acumula sellos)</span>}
                  </label>
                  <input name="telefono" required={telefonoRequerido} type="tel" minLength={telefonoRequerido ? 8 : undefined} maxLength={20} disabled={isPending} defaultValue={cd.telefono ?? ""}
                    placeholder="9999-0000"
                    pattern={telefonoRequerido ? '[\\d\\s\\-\\+\\(\\)]{8,}' : undefined}
                    title={telefonoRequerido ? 'Mínimo 8 dígitos' : undefined}
                    style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }}
                    onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)'; }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Tipo de entrega</label>
                  <select name="tipo_entrega" value={tipoEntrega} disabled={isPending} className="bl-select"
                    onChange={e => setTipoEntrega(e.target.value as 'pickup' | 'domicilio')}
                    style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }}>
                    <option value="pickup">📍 Recoger en tienda</option>
                    <option value="domicilio">🚚 A domicilio</option>
                  </select>
                </div>
                {tipoEntrega === 'domicilio' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Dirección</label>
                    <input name="direccion" maxLength={300} disabled={isPending} defaultValue={cd.direccion ?? ""}
                      placeholder="Col. Palmira, Calle Principal #123…"
                      style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }}
                      onFocus={e => { e.target.style.borderColor = 'var(--orange)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; }} />
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Fecha entrega</label>
                    <input name="fecha_entrega" type="date" disabled={isPending} defaultValue={cd.fecha_entrega ?? ""}
                      style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Hora</label>
                    <input name="hora_entrega" maxLength={20} disabled={isPending} placeholder="3:00 PM" defaultValue={cd.hora_entrega ?? ""}
                      style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Método de pago</label>
                  <select name="metodo_pago" value={metodoPago} disabled={isPending} className="bl-select"
                    onChange={e => setMetodoPago(e.target.value)}
                    style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }}
                    onFocus={e => { e.target.style.borderColor = 'var(--orange)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; }}>
                    <option value="">Sin especificar</option>
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="transferencia">🏦 Transferencia</option>
                  </select>
                </div>
                {/* Comprobante de transferencia — solo al crear */}
                {!isEditing && metodoPago === 'transferencia' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                      Comprobante de transferencia <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>(opcional)</span>
                    </label>
                    <label
                      style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '12px 14px', border: '1.5px dashed var(--hairline)', borderRadius: 'var(--r-md)', background: 'var(--paper)', transition: '.14s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLLabelElement).style.borderColor = 'var(--orange)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLLabelElement).style.borderColor = 'var(--hairline)'; }}
                    >
                      <input type="file" name="comprobante" accept="image/png,image/jpeg,image/webp" disabled={isPending} style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files?.[0]; setComprobantePreview(f ? URL.createObjectURL(f) : null); }} />
                      {comprobantePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={comprobantePreview} alt="comprobante" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: 10, background: 'var(--cream)', display: 'grid', placeItems: 'center', color: 'var(--orange-ink)', flexShrink: 0 }}>
                          <Upload style={{ width: 20, height: 20 }} />
                        </div>
                      )}
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{comprobantePreview ? 'Comprobante seleccionado' : 'Adjuntar screenshot'}</p>
                        <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>PNG, JPG o WebP · Máx. 10 MB</p>
                      </div>
                    </label>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Notas</label>
                  <input name="notas" maxLength={500} disabled={isPending} defaultValue={cd.notas ?? ""}
                    placeholder="Sin nueces, para llevar…"
                    style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }}
                    onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)'; }} />
                </div>
              </div>
            </div>

            {/* Productos */}
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', margin: '0 0 14px' }}>Productos</p>
              {/* Buscador */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <Search style={{ position: 'absolute', left: 12, width: 15, height: 15, color: 'var(--ink-soft)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar producto…"
                  disabled={isPending}
                  style={{ ...T.inp, paddingLeft: 36, opacity: isPending ? 0.6 : 1 }}
                  onFocus={e => { e.target.style.borderColor = 'var(--orange)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; }}
                />
                {busqueda && (
                  <button type="button" onClick={() => setBusqueda('')}
                    style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', display: 'grid', placeItems: 'center' }}>
                    <X style={{ width: 13, height: 13 }} />
                  </button>
                )}
              </div>
              {fixedItems.length > 0 && (
                <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {fixedItems.map((it, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 'var(--r-md)', border: '1.5px dashed var(--hairline)', background: 'var(--cream)' }}>
                      <span style={{ fontSize: 16 }}>✨</span>
                      <span style={{ flex: 1, fontSize: 13.5, color: 'var(--ink)' }}>{it.cantidad}× {it.nombre}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--orange-ink)' }}>L.{Number(it.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                  <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', margin: 0 }}>Items personalizados — se conservan sin cambios.</p>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {productos
                  .filter(p => p.disponible)
                  // Seleccionados siempre visibles aunque no matcheen la búsqueda
                  .filter(p => !busqueda.trim() || (cantidades[p.id] ?? 0) > 0 || p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
                  .map(p => {
                  const qty = cantidades[p.id] ?? 0;
                  return (
                    <div key={p.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--r-md)', border: `1.5px solid ${qty > 0 ? 'var(--orange)' : 'var(--hairline)'}`, background: qty > 0 ? 'var(--cream)' : 'var(--paper-card)', transition: '.14s' }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{p.emoji ?? '🍪'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</p>
                        <p style={{ fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--orange-ink)', margin: 0 }}>L.{Number(p.precio).toFixed(2)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <button type="button" onClick={() => setQty(p.id, -1)} disabled={qty === 0 || isPending}
                          style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--cream-200)', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink-soft)', opacity: qty === 0 ? 0.3 : 1 }}>
                          <Minus style={{ width: 12, height: 12 }} />
                        </button>
                        <span style={{ minWidth: 20, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{qty}</span>
                        <button type="button" onClick={() => setQty(p.id, 1)} disabled={isPending}
                          style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--orange)', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#fff' }}>
                          <Plus style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Toppings extra */}
            {toppings.length > 0 && (
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', margin: '0 0 14px' }}>Toppings extra</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {toppings.map(t => {
                    const qty = extras[t.id] ?? 0;
                    return (
                      <div key={t.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', borderRadius: 'var(--r-md)', border: `1.5px solid ${qty > 0 ? 'var(--orange)' : 'var(--hairline)'}`, background: qty > 0 ? 'var(--cream)' : 'var(--paper-card)', transition: '.14s' }}>
                        <span style={{ fontSize: 17, flexShrink: 0 }}>✨</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{t.nombre}</p>
                          <p style={{ fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--orange-ink)', margin: 0 }}>+L.{t.precio_extra.toFixed(2)}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <button type="button" onClick={() => setExtras(prev => { const n = Math.max(0, (prev[t.id] ?? 0) - 1); if (n === 0) { const rest = { ...prev }; delete rest[t.id]; return rest; } return { ...prev, [t.id]: n }; })} disabled={qty === 0 || isPending}
                            style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--cream-200)', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink-soft)', opacity: qty === 0 ? 0.3 : 1 }}>
                            <Minus style={{ width: 11, height: 11 }} />
                          </button>
                          <span style={{ minWidth: 18, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{qty}</span>
                          <button type="button" onClick={() => setExtras(prev => ({ ...prev, [t.id]: (prev[t.id] ?? 0) + 1 }))} disabled={isPending}
                            style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--orange)', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#fff' }}>
                            <Plus style={{ width: 11, height: 11 }} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '18px 24px', borderTop: '1px solid var(--hairline)', background: 'var(--paper-card)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, borderRadius: '0 0 var(--r-lg) var(--r-lg)' }}>
            {itemCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, background: 'var(--cream)', borderRadius: 'var(--r-md)', padding: '10px 16px' }}>
                <span style={{ color: 'var(--ink)' }}>{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</span>
                <span style={{ fontFamily: 'var(--font-display)', color: 'var(--orange-ink)', fontSize: 16 }}>L.{total.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onClose} disabled={isPending}
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)', cursor: 'pointer', background: 'var(--paper-card)', color: 'var(--ink)', transition: '.16s' }}>
                Cancelar
              </button>
              <button type="submit" disabled={isPending || itemCount === 0}
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer', background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', transition: '.16s', opacity: isPending || itemCount === 0 ? 0.6 : 1 }}>
                {isPending && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
                {isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear pedido'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
