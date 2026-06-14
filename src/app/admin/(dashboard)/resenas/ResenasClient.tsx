'use client';

import { useConfirm } from '@/components/admin/ConfirmProvider';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { toggleAprobadoResena, deleteResena } from '@/actions/resenas';
import type { ResenaAdmin } from '@/actions/resenas';
import ToggleSwitch from '@/components/admin/ToggleSwitch';

const T = {
  th: { textAlign: 'left' as const, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--ink-soft)', padding: '14px 22px', borderBottom: '1px solid var(--hairline)', whiteSpace: 'nowrap' as const, background: 'var(--paper)' },
  td: { padding: '14px 22px', fontSize: 14, color: 'var(--ink)', verticalAlign: 'middle' as const, borderBottom: '1px solid var(--hairline)' },
};

const STARS = ['', '★', '★★', '★★★', '★★★★', '★★★★★'];

type Filtro = 'pendientes' | 'todas';

export default function ResenasClient({ initialResenas }: { initialResenas: ResenaAdmin[] }) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('pendientes');
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => { startTransition(() => { router.refresh(); }); }, [router]);

  async function handleToggle(id: string, current: boolean) {
    setTogglingId(id);
    await toggleAprobadoResena(id, !current);
    setTogglingId(null);
    refresh();
  }

  const confirmar = useConfirm();

  async function handleDelete(id: string) {
    if (!(await confirmar({ mensaje: 'Esta reseña se eliminará permanentemente.', confirmLabel: 'Eliminar', peligro: true }))) return;
    setDeletingId(id);
    await deleteResena(id);
    setDeletingId(null);
    refresh();
  }

  const pendientes = initialResenas.filter(r => !r.aprobado).length;
  const visibles = filtro === 'pendientes' ? initialResenas.filter(r => !r.aprobado) : initialResenas;

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1500px] w-full">
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>Reseñas</h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
            {pendientes} pendiente{pendientes === 1 ? '' : 's'} · {initialResenas.length} total{isPending && <span style={{ marginLeft: 8, color: 'var(--orange-ink)' }}>Actualizando…</span>}
          </p>
        </div>
        <div style={{ display: 'inline-flex', gap: 6, padding: 4, background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-pill)' }}>
          {(['pendientes', 'todas'] as Filtro[]).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              style={{
                fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, padding: '8px 16px', borderRadius: 'var(--r-pill)',
                border: 'none', cursor: 'pointer',
                background: filtro === f ? 'var(--orange)' : 'transparent',
                color: filtro === f ? '#fff' : 'var(--ink-soft)',
              }}>
              {f === 'pendientes' ? 'Pendientes' : 'Todas'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
          <thead>
            <tr>
              <th style={T.th}>Producto</th>
              <th style={T.th}>Autor</th>
              <th style={T.th}>Reseña</th>
              <th style={{ ...T.th, textAlign: 'center' }}>Estrellas</th>
              <th style={{ ...T.th, textAlign: 'center' }}>Visible</th>
              <th style={{ ...T.th, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((r) => (
              <tr key={r.id}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
                style={{ transition: 'background .12s' }}>
                <td style={{ ...T.td, whiteSpace: 'nowrap', fontWeight: 600 }}>{r.producto_nombre}</td>
                <td style={{ ...T.td, whiteSpace: 'nowrap' }}>{r.autor}</td>
                <td style={{ ...T.td, maxWidth: 320 }}>
                  <p style={{ color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{r.texto}</p>
                </td>
                <td style={{ ...T.td, textAlign: 'center', color: 'var(--amber)', letterSpacing: 1, fontSize: 13 }}>
                  {STARS[r.estrellas]}
                </td>
                <td style={{ ...T.td, textAlign: 'center' }}>
                  <ToggleSwitch checked={r.aprobado} onChange={() => handleToggle(r.id, r.aprobado)} disabled={togglingId === r.id} />
                </td>
                <td style={{ ...T.td, textAlign: 'right' }}>
                  <button onClick={() => handleDelete(r.id)} disabled={deletingId === r.id}
                    style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', cursor: 'pointer', transition: '.14s', opacity: deletingId === r.id ? 0.5 : 1 }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--berry)'; e.currentTarget.style.borderColor = 'var(--berry)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.borderColor = 'var(--hairline)'; }}>
                    {deletingId === r.id ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Trash2 style={{ width: 15, height: 15 }} />}
                  </button>
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...T.td, textAlign: 'center', padding: '48px 22px', color: 'var(--ink-soft)', borderBottom: 0 }}>
                  {filtro === 'pendientes' ? 'No hay reseñas pendientes.' : 'No hay reseñas aún.'}
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
