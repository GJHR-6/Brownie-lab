'use client';

import { useState, useActionState, useEffect } from 'react';
import { Loader2, X, Plus, Minus } from 'lucide-react';
import { crearPedidoManual } from '@/actions/pedidos';
import type { Producto, PedidoItem } from '@/types/database';

const T = {
  inp: { width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' },
};

export default function CrearPedidoModal({ productos, onSuccess, onClose }: { productos: Producto[]; onSuccess: () => void; onClose: () => void }) {
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [state, formAction, isPending] = useActionState(crearPedidoManual, null);

  useEffect(() => { if (state?.success) onSuccess(); }, [state, onSuccess]);

  function setQty(id: string, delta: number) {
    setCantidades(prev => {
      const current = prev[id] ?? 0;
      const next = Math.max(0, current + delta);
      if (next === 0) { const { [id]: _, ...rest } = prev; return rest; }
      return { ...prev, [id]: next };
    });
  }

  const items: PedidoItem[] = Object.entries(cantidades).map(([id, cantidad]) => {
    const p = productos.find(x => x.id === id)!;
    return { producto_id: id, nombre: p.nombre, precio: Number(p.precio), cantidad, subtotal: Number(p.precio) * cantidad };
  });

  const total = items.reduce((s, i) => s + i.subtotal, 0);
  const itemCount = items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,10,.42)', backdropFilter: 'blur(2px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--paper)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--hairline)', background: 'var(--paper-card)', flexShrink: 0, borderRadius: 'var(--r-lg) var(--r-lg) 0 0' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', margin: 0, flex: 1 }}>Nuevo pedido manual</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <input type="hidden" name="items_json" value={JSON.stringify(items)} />

          <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {state?.success === false && (
              <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderRadius: 'var(--r-md)', padding: '11px 14px', fontSize: 13, color: 'var(--berry)' }}>{state.error}</div>
            )}

            {/* Cliente */}
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', margin: '0 0 14px' }}>Cliente</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { name: 'nombre', label: 'Nombre', required: true, placeholder: 'María López' },
                  { name: 'telefono', label: 'Teléfono', required: true, placeholder: '9999-0000' },
                  { name: 'notas', label: 'Notas', required: false, placeholder: 'Sin nueces, para llevar…' },
                ].map(({ name, label, required, placeholder }) => (
                  <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                      {label} {required && <span style={{ color: 'var(--berry)' }}>*</span>}
                    </label>
                    <input name={name} required={required} disabled={isPending} placeholder={placeholder}
                      style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }}
                      onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)'; }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Productos */}
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', margin: '0 0 14px' }}>Productos</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {productos.filter(p => p.disponible).map(p => {
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
                {isPending ? 'Creando…' : 'Crear pedido'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
