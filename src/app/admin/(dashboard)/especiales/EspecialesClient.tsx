'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, X } from 'lucide-react';
import { useActionState, useEffect } from 'react';
import { createEspecial, toggleEspecial, deleteEspecial } from '@/actions/especiales';
import type { Especial } from '@/types/database';
import ToggleSwitch from '@/components/admin/ToggleSwitch';

const T = {
  th: { textAlign: 'left' as const, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--ink-soft)', padding: '14px 22px', borderBottom: '1px solid var(--hairline)', whiteSpace: 'nowrap' as const, background: 'var(--paper)' },
  td: { padding: '14px 22px', fontSize: 14, color: 'var(--ink)', verticalAlign: 'middle' as const, borderBottom: '1px solid var(--hairline)' },
  inp: { width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' },
  btnPrimary: { display: 'inline-flex' as const, alignItems: 'center' as const, gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer' as const, background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', transition: '.16s' },
  btnGhost: { display: 'inline-flex' as const, alignItems: 'center' as const, gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)', cursor: 'pointer' as const, background: 'var(--paper-card)', color: 'var(--ink)', transition: '.16s' },
};

function getDiasRestantes(fechaInicio: string, duracionDias: number): number {
  const end = new Date(fechaInicio);
  end.setDate(end.getDate() + duracionDias);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function EspecialForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [state, formAction, isPending] = useActionState(createEspecial, null);
  const today = new Date().toISOString().split('T')[0];
  useEffect(() => { if (state?.success) onSuccess(); }, [state, onSuccess]);

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
      {state?.success === false && (
        <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderRadius: 'var(--r-md)', padding: '11px 14px', fontSize: 13, color: 'var(--berry)' }}>{state.error}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Nombre <span style={{ color: 'var(--berry)' }}>*</span></label>
        <input name="nombre" required disabled={isPending} placeholder="Brownie de Matcha"
          style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }}
          onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)'; }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Descripción <span style={{ color: 'var(--berry)' }}>*</span></label>
        <textarea name="descripcion" required rows={2} disabled={isPending}
          placeholder="Brownie experimental con matcha japonés y frambuesa."
          style={{ ...T.inp, resize: 'vertical', minHeight: 80, lineHeight: 1.6, opacity: isPending ? 0.6 : 1 }}
          onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)'; }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Emoji</label>
          <input name="emoji" maxLength={4} disabled={isPending} defaultValue="🍪"
            style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }}
            onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)'; }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Fecha inicio</label>
          <input name="fecha_inicio" type="date" disabled={isPending} defaultValue={today}
            style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }}
            onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)'; }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Días <span style={{ color: 'var(--berry)' }}>*</span></label>
          <input name="duracion_dias" type="number" min="1" required disabled={isPending} defaultValue={7}
            style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }}
            onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)'; }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid var(--hairline)', marginTop: 4 }}>
        <button type="button" onClick={onCancel} disabled={isPending} style={{ ...T.btnGhost, flex: 1, justifyContent: 'center' }}>Cancelar</button>
        <button type="submit" disabled={isPending} style={{ ...T.btnPrimary, flex: 1, justifyContent: 'center', opacity: isPending ? 0.7 : 1 }}>
          {isPending && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
          {isPending ? 'Guardando…' : 'Crear especial'}
        </button>
      </div>
    </form>
  );
}

export default function EspecialesClient({ initialEspeciales }: { initialEspeciales: Especial[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => { startTransition(() => { router.refresh(); }); }, [router]);

  async function handleToggle(id: string, current: boolean) {
    setTogglingId(id);
    await toggleEspecial(id, !current);
    setTogglingId(null);
    refresh();
  }

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    setDeletingId(id);
    await deleteEspecial(id);
    setDeletingId(null);
    refresh();
  }

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1500px] w-full">
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>Capricho del Chef</h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
            {initialEspeciales.length} {initialEspeciales.length === 1 ? 'especial' : 'especiales'}
            {isPending && <span style={{ marginLeft: 8, color: 'var(--orange-ink)' }}>Actualizando…</span>}
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={T.btnPrimary}>
          <Plus style={{ width: 17, height: 17 }} />Nuevo especial
        </button>
      </div>

      <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={T.th}>Especial</th>
                <th style={T.th}>Fecha inicio</th>
                <th style={{ ...T.th, textAlign: 'center' }}>Duración</th>
                <th style={{ ...T.th, textAlign: 'center' }}>Días restantes</th>
                <th style={{ ...T.th, textAlign: 'center' }}>Activo</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialEspeciales.map((e) => {
                const dias = getDiasRestantes(e.fecha_inicio, e.duracion_dias);
                const expirado = dias === 0;
                return (
                  <tr key={e.id}
                    onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--paper)')}
                    onMouseLeave={ev => (ev.currentTarget.style.background = '')}
                    style={{ transition: 'background .12s' }}>
                    <td style={T.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 26 }}>{e.emoji}</span>
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{e.nombre}</p>
                          <p style={{ fontSize: 12, color: 'var(--ink-soft)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{e.descripcion}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...T.td, color: 'var(--ink-soft)' }}>{e.fecha_inicio}</td>
                    <td style={{ ...T.td, textAlign: 'center', color: 'var(--ink-soft)' }}>{e.duracion_dias} días</td>
                    <td style={{ ...T.td, textAlign: 'center' }}>
                      {expirado ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 'var(--r-pill)', background: '#e4ded3', color: '#6b5743' }}>Expirado</span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 'var(--r-pill)', background: dias <= 2 ? '#fbe3d0' : 'var(--cream-200)', color: dias <= 2 ? '#b14a12' : 'var(--orange-ink)' }}>
                          {dias} {dias === 1 ? 'día' : 'días'}
                        </span>
                      )}
                    </td>
                    <td style={{ ...T.td, textAlign: 'center' }}>
                      <ToggleSwitch checked={e.activo} onChange={() => handleToggle(e.id, e.activo)} disabled={togglingId === e.id} />
                    </td>
                    <td style={{ ...T.td, textAlign: 'right' }}>
                      <button onClick={() => handleDelete(e.id, e.nombre)} disabled={deletingId === e.id}
                        style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', cursor: 'pointer', transition: '.14s', opacity: deletingId === e.id ? 0.5 : 1 }}
                        onMouseEnter={ev => { ev.currentTarget.style.color = 'var(--berry)'; ev.currentTarget.style.borderColor = 'var(--berry)'; }}
                        onMouseLeave={ev => { ev.currentTarget.style.color = 'var(--ink-soft)'; ev.currentTarget.style.borderColor = 'var(--hairline)'; }}>
                        {deletingId === e.id ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Trash2 style={{ width: 15, height: 15 }} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {initialEspeciales.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...T.td, textAlign: 'center', padding: '48px 22px', color: 'var(--ink-soft)', borderBottom: 0 }}>
                    No hay especiales. Agrega el primero.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,10,.42)', backdropFilter: 'blur(2px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div style={{ background: 'var(--paper)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--hairline)', background: 'var(--paper-card)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', margin: 0, flex: 1 }}>Nuevo especial del chef</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <EspecialForm onSuccess={() => { setIsModalOpen(false); refresh(); }} onCancel={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
