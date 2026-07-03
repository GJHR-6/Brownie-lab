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

type Orden = 'nombre' | 'margen-asc' | 'margen-desc';

export default function CostosClient({ initialProductos }: { initialProductos: Producto[] }) {
  const router = useRouter();
  // Valores editados pendientes de guardar: id → costo (string del input)
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [orden, setOrden] = useState<Orden>('nombre');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const dirty = Object.entries(edits).filter(([id, v]) => {
    const orig = initialProductos.find(p => p.id === id);
    return orig && v !== '' && Number(v) !== Number(orig.costo);
  });

  // Costo efectivo: valor editado (sin guardar) o el guardado
  const costoDe = (p: Producto) => Number(edits[p.id] ?? p.costo) || 0;
  const margenDe = (p: Producto) => {
    const c = costoDe(p);
    return c > 0 ? ((Number(p.precio) - c) / Number(p.precio)) * 100 : null;
  };

  const filtered = search.trim()
    ? initialProductos.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()))
    : initialProductos;

  const visible = orden === 'nombre'
    ? filtered
    : [...filtered].sort((a, b) => {
        const ma = margenDe(a), mb = margenDe(b);
        if (ma === null && mb === null) return 0;
        if (ma === null) return 1; // sin costo siempre al final
        if (mb === null) return -1;
        return orden === 'margen-asc' ? ma - mb : mb - ma;
      });

  const sinCosto = initialProductos.filter(p => !costoDe(p)).length;

  // Resumen (refleja ediciones sin guardar)
  const conCosto = initialProductos.map(p => ({ p, m: margenDe(p) })).filter((x): x is { p: Producto; m: number } => x.m !== null);
  const margenPromedio = conCosto.length ? conCosto.reduce((s, x) => s + x.m, 0) / conCosto.length : null;
  const peor = conCosto.length ? conCosto.reduce((min, x) => (x.m < min.m ? x : min)) : null;

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
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>Costos de producción</h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
            Costo de producción por unidad (ingredientes + empaque). Alimenta el margen en Reportes.
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', padding: '16px 20px' }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', margin: 0 }}>Margen promedio</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, margin: '6px 0 0', color: margenPromedio !== null ? margenInfo(100, 100 - margenPromedio).color : 'var(--ink-soft)' }}>
            {margenPromedio !== null ? `${Math.round(margenPromedio)}%` : '—'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '2px 0 0' }}>{conCosto.length} producto{conCosto.length !== 1 ? 's' : ''} con costo</p>
        </div>
        <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', padding: '16px 20px' }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', margin: 0 }}>Peor margen</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, margin: '6px 0 0', color: peor ? margenInfo(100, 100 - peor.m).color : 'var(--ink-soft)' }}>
            {peor ? `${Math.round(peor.m)}%` : '—'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{peor ? peor.p.nombre : 'Sin datos'}</p>
        </div>
        <div style={{ background: sinCosto > 0 ? '#fdf4dc' : 'var(--paper-card)', border: `1px solid ${sinCosto > 0 ? '#f0dca6' : 'var(--hairline)'}`, borderRadius: 'var(--r-lg)', padding: '16px 20px' }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', margin: 0 }}>Sin costo definido</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, margin: '6px 0 0', color: sinCosto > 0 ? 'var(--choco-700)' : 'var(--green)' }}>
            {sinCosto > 0 ? `⚠️ ${sinCosto}` : '✓ 0'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '2px 0 0' }}>{sinCosto > 0 ? 'No entran al margen de Reportes' : 'Todos los productos tienen costo'}</p>
        </div>
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
        <select
          value={orden}
          onChange={e => setOrden(e.target.value as Orden)}
          className="bl-select"
          style={{ padding: '9px 14px', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-pill)', background: 'var(--paper-card)', fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--ink)', outline: 'none', cursor: 'pointer' }}
        >
          <option value="nombre">Orden: nombre</option>
          <option value="margen-asc">Margen: peor primero</option>
          <option value="margen-desc">Margen: mejor primero</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />≥50%</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#9a6a12', display: 'inline-block' }} />25–49%</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--berry)', display: 'inline-block' }} />&lt;25%</span>
          </span>
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
                <th style={{ ...T.th, textAlign: 'right' }}>Ganancia</th>
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
                      {costoNum > 0
                        ? <span style={{ fontWeight: 600, color: Number(p.precio) - costoNum >= 0 ? 'var(--ink)' : 'var(--berry)' }}>{fmtMoney(Number(p.precio) - costoNum)}</span>
                        : <span style={{ color: 'var(--ink-soft)' }}>—</span>}
                    </td>
                    <td style={{ ...T.td, textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: m.color }}>{m.label}</span>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...T.td, textAlign: 'center', padding: '44px 22px', color: 'var(--ink-soft)', borderBottom: 0 }}>
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
