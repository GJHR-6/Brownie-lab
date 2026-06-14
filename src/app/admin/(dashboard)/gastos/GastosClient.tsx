'use client';

import { useState, useEffect, useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, Trash2, X } from 'lucide-react';
import { crearGasto, eliminarGasto } from '@/actions/gastos';
import { useConfirm } from '@/components/admin/ConfirmProvider';
import { useModalA11y } from '@/hooks/useModalA11y';
import type { Gasto, GastoCategoria } from '@/types/database';

const CATEGORIA_CFG: Record<GastoCategoria, { label: string; icon: string; chip: string; dot: string }> = {
  ingredientes: { label: 'Ingredientes', icon: '🧈', chip: '#fbeccb', dot: '#9a6a12' },
  empaque:      { label: 'Empaque',      icon: '📦', chip: '#e4ded3', dot: '#6b5743' },
  delivery:     { label: 'Delivery',     icon: '🚚', chip: '#dbeafe', dot: '#1d5fb8' },
  servicios:    { label: 'Servicios',    icon: '💡', chip: '#d8f0e2', dot: '#157a4d' },
  equipo:       { label: 'Equipo',       icon: '🍳', chip: '#ece4f5', dot: '#6b4a9e' },
  marketing:    { label: 'Marketing',    icon: '📣', chip: '#fce8ea', dot: '#9e3b46' },
  otros:        { label: 'Otros',        icon: '🧾', chip: 'var(--cream-200)', dot: 'var(--ink-soft)' },
};

const T = {
  inp: { width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' } as React.CSSProperties,
  th: { textAlign: 'left' as const, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--ink-soft)', padding: '14px 22px', borderBottom: '1px solid var(--hairline)', whiteSpace: 'nowrap' as const, background: 'var(--paper)' },
  td: { padding: '14px 22px', fontSize: 14, color: 'var(--ink)', verticalAlign: 'middle' as const, borderBottom: '1px solid var(--hairline)' },
};

function fmtMoney(n: number): string {
  return `L.${n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function CrearGastoModal({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(crearGasto, null);
  useModalA11y(onClose);

  useEffect(() => { if (state?.success) onSuccess(); }, [state, onSuccess]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,10,.42)', backdropFilter: 'blur(2px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-label="Registrar gasto"
        style={{ background: 'var(--paper)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--hairline)', background: 'var(--paper-card)', borderRadius: 'var(--r-lg) var(--r-lg) 0 0' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', margin: 0, flex: 1 }}>Registrar gasto</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>
          {state?.success === false && (
            <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderRadius: 'var(--r-md)', padding: '11px 14px', fontSize: 13, color: 'var(--berry)' }}>{state.error}</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Fecha <span style={{ color: 'var(--berry)' }}>*</span></label>
              <input name="fecha" type="date" required disabled={isPending} defaultValue={hoyLocal()} style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Monto L. <span style={{ color: 'var(--berry)' }}>*</span></label>
              <input name="monto" type="number" step="0.01" min="0.01" required disabled={isPending} placeholder="250.00" style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Categoría <span style={{ color: 'var(--berry)' }}>*</span></label>
            <select name="categoria" required disabled={isPending} defaultValue="ingredientes" className="bl-select" style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }}>
              {(Object.entries(CATEGORIA_CFG) as [GastoCategoria, typeof CATEGORIA_CFG[GastoCategoria]][]).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Nota</label>
            <input name="nota" maxLength={300} disabled={isPending} placeholder="Harina y chocolate — Supermercado X" style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} disabled={isPending}
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)', cursor: 'pointer', background: 'var(--paper-card)', color: 'var(--ink)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer', background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', opacity: isPending ? 0.6 : 1 }}>
              {isPending && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
              {isPending ? 'Guardando…' : 'Guardar gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GastosClient({ initialGastos }: { initialGastos: Gasto[] }) {
  const router = useRouter();
  const confirmar = useConfirm();
  const [isCrearOpen, setIsCrearOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleDelete(g: Gasto) {
    if (!(await confirmar({ mensaje: `El gasto de ${fmtMoney(g.monto)} (${CATEGORIA_CFG[g.categoria]?.label ?? g.categoria}) se eliminará permanentemente.`, confirmLabel: 'Eliminar', peligro: true }))) return;
    setDeletingId(g.id);
    setErrorMsg(null);
    const res = await eliminarGasto(g.id);
    setDeletingId(null);
    if (!res.success) { setErrorMsg(res.error ?? 'Error al eliminar'); return; }
    startTransition(() => router.refresh());
  }

  // Resumen del mes actual
  const inicioMes = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
  const gastosMes = initialGastos.filter(g => g.fecha >= inicioMes);
  const totalMes = gastosMes.reduce((s, g) => s + g.monto, 0);
  const porCategoria = gastosMes.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] ?? 0) + g.monto;
    return acc;
  }, {} as Record<string, number>);
  const topCategorias = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1500px] w-full">
      {/* Page head */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>Gastos</h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
            Gastos operativos del negocio — se restan en Reportes para calcular utilidad.
          </p>
        </div>
        <button onClick={() => setIsCrearOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer', background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)' }}>
          <Plus style={{ width: 17, height: 17 }} />Registrar gasto
        </button>
      </div>

      {/* Resumen mes */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
        <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', padding: '16px 22px', minWidth: 200 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-soft)', margin: 0 }}>Gastos este mes</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--berry)', margin: '6px 0 0' }}>{fmtMoney(totalMes)}</p>
          <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: '4px 0 0' }}>{gastosMes.length} registro{gastosMes.length !== 1 ? 's' : ''}</p>
        </div>
        {topCategorias.map(([cat, monto]) => {
          const cfg = CATEGORIA_CFG[cat as GastoCategoria] ?? CATEGORIA_CFG.otros;
          return (
            <div key={cat} style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', padding: '16px 22px', minWidth: 160 }}>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-soft)', margin: 0 }}>{cfg.icon} {cfg.label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--ink)', margin: '6px 0 0' }}>{fmtMoney(monto)}</p>
            </div>
          );
        })}
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
                <th style={T.th}>Fecha</th>
                <th style={T.th}>Categoría</th>
                <th style={T.th}>Nota</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Monto</th>
                <th style={{ ...T.th, width: 60 }} />
              </tr>
            </thead>
            <tbody>
              {initialGastos.map(g => {
                const cfg = CATEGORIA_CFG[g.categoria] ?? CATEGORIA_CFG.otros;
                return (
                  <tr key={g.id}>
                    <td style={{ ...T.td, fontFamily: 'ui-monospace,monospace', fontSize: 13, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                      {new Date(g.fecha + 'T12:00:00').toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={T.td}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 'var(--r-pill)', background: cfg.chip, color: cfg.dot, whiteSpace: 'nowrap' }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td style={{ ...T.td, color: g.nota ? 'var(--ink)' : 'var(--ink-soft)' }}>{g.nota ?? '—'}</td>
                    <td style={{ ...T.td, textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--berry)', fontSize: 15 }}>−{fmtMoney(g.monto)}</span>
                    </td>
                    <td style={{ ...T.td, textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(g)}
                        disabled={deletingId === g.id}
                        title="Eliminar gasto"
                        aria-label={`Eliminar gasto de ${fmtMoney(g.monto)}`}
                        style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'none', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', cursor: 'pointer', opacity: deletingId === g.id ? 0.5 : 1 }}>
                        {deletingId === g.id
                          ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                          : <Trash2 style={{ width: 13, height: 13 }} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {initialGastos.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...T.td, textAlign: 'center', padding: '48px 22px', color: 'var(--ink-soft)', borderBottom: 0 }}>
                    No hay gastos registrados aún. Registra el primero para ver utilidad neta en Reportes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCrearOpen && (
        <CrearGastoModal
          onSuccess={() => { setIsCrearOpen(false); startTransition(() => router.refresh()); }}
          onClose={() => setIsCrearOpen(false)}
        />
      )}
    </div>
  );
}
