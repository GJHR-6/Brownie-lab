'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, Search, X } from 'lucide-react';
import { actualizarCostos } from '@/actions/productos';
import type { Producto } from '@/types/database';

const T = {
  th: { textAlign: 'left' as const, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--ink-soft)', padding: '14px 22px', borderBottom: '1px solid var(--hairline)', whiteSpace: 'nowrap' as const, background: 'var(--paper)' },
  td: { padding: '12px 22px', fontSize: 14, color: 'var(--ink)', verticalAlign: 'middle' as const, borderBottom: '1px solid var(--hairline)' },
};

function fmtMoney(n: number): string {
  return `L.${n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function margenInfo(precio: number, costo: number): { pct: number | null; color: string; label: string } {
  if (costo <= 0) return { pct: null, color: 'var(--ink-soft)', label: '— sin costo' };
  const pct = Math.round(((precio - costo) / precio) * 100);
  if (pct >= 50) return { pct, color: 'var(--green)', label: `${pct}%` };
  if (pct >= 25) return { pct, color: '#9a6a12', label: `${pct}%` };
  return { pct, color: 'var(--berry)', label: `${pct}%` };
}

export default function CostosClient({ initialProductos }: { initialProductos: Producto[] }) {
  const router = useRouter();
  // Valores editados pendientes de guardar: id → costo (string del input)
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const dirty = Object.entries(edits).filter(([id, v]) => {
    const orig = initialProductos.find(p => p.id === id);
    return orig && v !== '' && Number(v) !== Number(orig.costo);
  });

  const visible = search.trim()
    ? initialProductos.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()))
    : initialProductos;

  const sinCosto = initialProductos.filter(p => !Number(p.costo)).length;

  async function handleGuardar() {
    if (!dirty.length) return;
    setSaving(true);
    setErrorMsg(null);
    const res = await actualizarCostos(dirty.map(([id, v]) => ({ id, costo: Number(v) })));
    setSaving(false);
    if (!res.success) { setErrorMsg(res.error ?? 'Error al guardar'); return; }
    setEdits({});
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 4000);
    startTransition(() => router.refresh());
  }

  return (
    <div className="px-6 md:px-10 py-8 pb-32 max-w-[1100px] w-full">
      {/* Page head */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>Costos</h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
            Costo de producción por unidad (ingredientes + empaque). Alimenta el margen en Reportes.
          </p>
        </div>
        {sinCosto > 0 && (
          <span style={{ fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 'var(--r-pill)', background: '#fdf4dc', border: '1px solid #f0dca6', color: 'var(--choco-700)' }}>
            ⚠️ {sinCosto} producto{sinCosto !== 1 ? 's' : ''} sin costo definido
          </span>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search style={{ position: 'absolute', left: 14, width: 16, height: 16, color: 'var(--ink-soft)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            style={{ padding: '9px 16px 9px 38px', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-pill)', background: 'var(--paper-card)', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', width: 250, outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--orange)'}
            onBlur={e => e.target.style.borderColor = 'var(--hairline)'}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', display: 'grid', placeItems: 'center' }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink-soft)' }}>
          {visible.length} producto{visible.length !== 1 ? 's' : ''}
        </span>
      </div>

      {errorMsg && (
        <div style={{ marginBottom: 16, background: '#fdf0f0', border: '1px solid #e6c4c8', borderLeft: '4px solid var(--berry)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 14, color: 'var(--berry)' }}>
          {errorMsg}
        </div>
      )}

      {/* Tabla */}
      <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={T.th}>Producto</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Precio</th>
                <th style={{ ...T.th, textAlign: 'right', width: 150 }}>Costo</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Margen</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(p => {
                const valor = edits[p.id] ?? String(p.costo || '');
                const costoNum = Number(valor) || 0;
                const cambiado = edits[p.id] !== undefined && Number(edits[p.id]) !== Number(p.costo);
                const m = margenInfo(Number(p.precio), costoNum);
                return (
                  <tr key={p.id} style={{ background: cambiado ? 'var(--cream)' : '' }}>
                    <td style={T.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{p.emoji ?? '🍪'}</span>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</p>
                          {!p.disponible && <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', margin: 0 }}>No disponible</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...T.td, textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--orange-ink)' }}>
                      {fmtMoney(Number(p.precio))}
                    </td>
                    <td style={{ ...T.td, textAlign: 'right' }}>
                      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', left: 11, fontSize: 12, color: 'var(--ink-soft)', pointerEvents: 'none' }}>L.</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={valor}
                          placeholder="0"
                          onChange={e => setEdits(prev => ({ ...prev, [p.id]: e.target.value }))}
                          aria-label={`Costo de ${p.nombre}`}
                          style={{
                            width: 110, padding: '8px 10px 8px 30px', textAlign: 'right',
                            border: `1.5px solid ${cambiado ? 'var(--orange)' : 'var(--hairline)'}`,
                            borderRadius: 'var(--r-md)', fontFamily: 'var(--font-sans)', fontSize: 14,
                            color: 'var(--ink)', background: 'var(--paper)', outline: 'none',
                          }}
                          onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                          onBlur={e => { if (!cambiado) e.target.style.borderColor = 'var(--hairline)'; }}
                        />
                      </div>
                    </td>
                    <td style={{ ...T.td, textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: m.color }}>{m.label}</span>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ ...T.td, textAlign: 'center', padding: '44px 22px', color: 'var(--ink-soft)', borderBottom: 0 }}>
                    Sin resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barra de guardar flotante */}
      {(dirty.length > 0 || savedMsg) && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 40,
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'var(--choco-900)', color: 'var(--on-dark)', borderRadius: 'var(--r-pill)',
          padding: '10px 12px 10px 22px', boxShadow: 'var(--shadow-lg)',
        }}>
          {savedMsg && dirty.length === 0 ? (
            <span style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, paddingRight: 10 }}>
              <Check style={{ width: 16, height: 16, color: '#58d684' }} />
              Costos guardados
            </span>
          ) : (
            <>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {dirty.length} cambio{dirty.length !== 1 ? 's' : ''} sin guardar
              </span>
              <button onClick={() => setEdits({})} disabled={saving}
                style={{ fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-dark-soft, #cdb79a)' }}>
                Descartar
              </button>
              <button onClick={handleGuardar} disabled={saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 700, padding: '8px 18px', borderRadius: 'var(--r-pill)', background: 'var(--orange)', color: '#fff', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
