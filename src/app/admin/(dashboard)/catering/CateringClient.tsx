'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { actualizarEstadoCatering } from '@/actions/catering';
import type { CateringSolicitud, EstadoCatering } from '@/types/database';

const ESTADO_CFG: Record<EstadoCatering, { label: string; chip: string; dot: string }> = {
  nueva:       { label: 'Nueva',       chip: '#fbeccb', dot: '#9a6a12' },
  contactado:  { label: 'Contactado',  chip: '#dbeafe', dot: '#1d5fb8' },
  cotizado:    { label: 'Cotizado',    chip: '#d8f0e2', dot: '#157a4d' },
  cerrada:     { label: 'Cerrada',     chip: '#e4ded3', dot: '#6b5743' },
};

const ESTADOS: EstadoCatering[] = ['nueva', 'contactado', 'cotizado', 'cerrada'];

const T = {
  th: { textAlign: 'left' as const, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--ink-soft)', padding: '14px 22px', borderBottom: '1px solid var(--hairline)', whiteSpace: 'nowrap' as const, background: 'var(--paper)' },
  td: { padding: '14px 22px', fontSize: 14, color: 'var(--ink)', verticalAlign: 'middle' as const, borderBottom: '1px solid var(--hairline)' },
};

function Chip({ estado }: { estado: EstadoCatering }) {
  const c = ESTADO_CFG[estado];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 'var(--r-pill)', background: c.chip, color: c.dot, whiteSpace: 'nowrap' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

export default function CateringClient({ initialSolicitudes }: { initialSolicitudes: CateringSolicitud[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoCatering | 'todos'>('todos');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const refresh = () => startTransition(() => { router.refresh(); });

  const visible = initialSolicitudes.filter(s => {
    if (estadoFilter !== 'todos' && s.estado !== estadoFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return s.cliente_nombre.toLowerCase().includes(q) || s.cliente_telefono.includes(q) || s.tipo_evento.toLowerCase().includes(q);
    }
    return true;
  });

  async function handleEstadoChange(s: CateringSolicitud, nuevo: EstadoCatering) {
    setSavingId(s.id); setError(null);
    const result = await actualizarEstadoCatering(s.id, nuevo);
    setSavingId(null);
    if (!result.success) setError(result.error);
    else refresh();
  }

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1500px] w-full">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>
          Catering
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
          Solicitudes de eventos recibidas desde el sitio.
        </p>
      </div>

      {error && (
        <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderLeft: '4px solid var(--berry)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 14, color: 'var(--berry)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search style={{ position: 'absolute', left: 14, width: 17, height: 17, color: 'var(--ink-soft)', pointerEvents: 'none' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, teléfono o evento…"
            style={{ padding: '10px 16px 10px 40px', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-pill)', background: 'var(--paper-card)', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', width: 300, outline: 'none' }} />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)' }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
        <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value as EstadoCatering | 'todos')} className="bl-select"
          style={{ padding: '10px 16px', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-pill)', background: 'var(--paper-card)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--ink)', outline: 'none' }}>
          <option value="todos">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_CFG[e].label}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink-soft)', fontWeight: 500 }}>
          {visible.length} solicitud{visible.length !== 1 ? 'es' : ''}
        </span>
      </div>

      <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={T.th}>Cliente</th>
                <th style={T.th}>Evento</th>
                <th style={T.th}>Personas</th>
                <th style={T.th}>Fecha</th>
                <th style={T.th}>Sede</th>
                <th style={T.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(s => (
                <tr key={s.id}>
                  <td style={T.td}>
                    <p style={{ fontWeight: 600, margin: 0 }}>{s.cliente_nombre}</p>
                    <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0, fontFamily: 'ui-monospace,monospace' }}>{s.cliente_telefono}</p>
                  </td>
                  <td style={T.td}>
                    <p style={{ margin: 0 }}>{s.tipo_evento}</p>
                    {s.detalles && <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: '4px 0 0', maxWidth: 280 }}>{s.detalles}</p>}
                  </td>
                  <td style={T.td}>{s.rango_personas}</td>
                  <td style={{ ...T.td, fontFamily: 'ui-monospace,monospace', fontSize: 13 }}>
                    {new Date(s.fecha_evento + 'T12:00:00').toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ ...T.td, color: 'var(--ink-soft)' }}>{s.sede_cercana || '—'}</td>
                  <td style={T.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Chip estado={s.estado} />
                      <select value={s.estado} disabled={savingId === s.id} onChange={e => handleEstadoChange(s, e.target.value as EstadoCatering)} className="bl-select"
                        style={{ border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '6px 10px', fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' }}>
                        {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_CFG[e].label}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...T.td, textAlign: 'center', padding: '48px 22px', color: 'var(--ink-soft)' }}>
                    {search || estadoFilter !== 'todos' ? 'Sin resultados para este filtro.' : 'No hay solicitudes de catering aún.'}
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
