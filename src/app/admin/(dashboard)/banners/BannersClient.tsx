'use client';

import { useState, useCallback, useTransition, useActionState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, X, Pencil } from 'lucide-react';
import { createBanner, updateBanner, toggleBanner, deleteBanner } from '@/actions/banners';
import type { Banner } from '@/types/database';
import ToggleSwitch from '@/components/admin/ToggleSwitch';

const T = {
  th: { textAlign: 'left' as const, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--ink-soft)', padding: '14px 22px', borderBottom: '1px solid var(--hairline)', whiteSpace: 'nowrap' as const, background: 'var(--paper)' },
  td: { padding: '14px 22px', fontSize: 14, color: 'var(--ink)', verticalAlign: 'middle' as const, borderBottom: '1px solid var(--hairline)' },
  inp: { width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' },
  btnPrimary: { display: 'inline-flex' as const, alignItems: 'center' as const, gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer' as const, background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', transition: '.16s' },
  btnGhost: { display: 'inline-flex' as const, alignItems: 'center' as const, gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)', cursor: 'pointer' as const, background: 'var(--paper-card)', color: 'var(--ink)', transition: '.16s' },
};

type ModalState = { open: false } | { open: true; modo: 'crear' } | { open: true; modo: 'editar'; banner: Banner };

function BannerForm({ bannerInicial, onSuccess, onCancel }: { bannerInicial?: Banner; onSuccess: () => void; onCancel: () => void }) {
  const isEditing = !!bannerInicial;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const action = useMemo(() => isEditing ? updateBanner.bind(null, bannerInicial!.id) : createBanner, []);
  const [state, formAction, isPending] = useActionState(action, null);
  useEffect(() => { if (state?.success) onSuccess(); }, [state, onSuccess]);

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
      {state?.success === false && (
        <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderRadius: 'var(--r-md)', padding: '11px 14px', fontSize: 13, color: 'var(--berry)' }}>{state.error}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Mensaje <span style={{ color: 'var(--berry)' }}>*</span></label>
        <textarea name="mensaje" required rows={2} disabled={isPending} defaultValue={bannerInicial?.mensaje}
          placeholder="🎉 ¡Envío gratis en pedidos mayores a L.200!"
          style={{ ...T.inp, resize: 'vertical', minHeight: 80, lineHeight: 1.6, opacity: isPending ? 0.6 : 1 }}
          onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)'; }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Orden (menor = primero)</label>
        <input name="orden" type="number" min="0" disabled={isPending} defaultValue={bannerInicial?.orden ?? 0}
          style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }}
          onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)'; }} />
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid var(--hairline)', marginTop: 4 }}>
        <button type="button" onClick={onCancel} disabled={isPending} style={{ ...T.btnGhost, flex: 1, justifyContent: 'center' }}>Cancelar</button>
        <button type="submit" disabled={isPending} style={{ ...T.btnPrimary, flex: 1, justifyContent: 'center', opacity: isPending ? 0.7 : 1 }}>
          {isPending && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
          {isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear banner'}
        </button>
      </div>
    </form>
  );
}

export default function BannersClient({ initialBanners }: { initialBanners: Banner[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => { startTransition(() => { router.refresh(); }); }, [router]);

  async function handleToggle(id: string, current: boolean) {
    setTogglingId(id);
    await toggleBanner(id, !current);
    setTogglingId(null);
    refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este banner?')) return;
    setDeletingId(id);
    await deleteBanner(id);
    setDeletingId(null);
    refresh();
  }

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1500px] w-full">
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>Banners</h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
            Mensajes en la parte superior del sitio.{isPending && <span style={{ marginLeft: 8, color: 'var(--orange-ink)' }}>Actualizando…</span>}
          </p>
        </div>
        <button onClick={() => setModal({ open: true, modo: 'crear' })} style={T.btnPrimary}>
          <Plus style={{ width: 17, height: 17 }} />Nuevo banner
        </button>
      </div>

      <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
          <thead>
            <tr>
              <th style={T.th}>Mensaje</th>
              <th style={{ ...T.th, textAlign: 'center' }}>Orden</th>
              <th style={{ ...T.th, textAlign: 'center' }}>Activo</th>
              <th style={{ ...T.th, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {initialBanners.map((b) => (
              <tr key={b.id}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
                style={{ transition: 'background .12s' }}>
                <td style={T.td}>
                  <p style={{ maxWidth: 480, color: 'var(--ink)', fontSize: 14 }}>{b.mensaje}</p>
                </td>
                <td style={{ ...T.td, textAlign: 'center', color: 'var(--ink-soft)' }}>{b.orden}</td>
                <td style={{ ...T.td, textAlign: 'center' }}>
                  <ToggleSwitch checked={b.activo} onChange={() => handleToggle(b.id, b.activo)} disabled={togglingId === b.id} />
                </td>
                <td style={{ ...T.td, textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={() => setModal({ open: true, modo: 'editar', banner: b })}
                      style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', cursor: 'pointer', transition: '.14s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--orange-ink)'; e.currentTarget.style.borderColor = 'var(--orange)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.borderColor = 'var(--hairline)'; }}>
                      <Pencil style={{ width: 15, height: 15 }} />
                    </button>
                    <button onClick={() => handleDelete(b.id)} disabled={deletingId === b.id}
                      style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', cursor: 'pointer', transition: '.14s', opacity: deletingId === b.id ? 0.5 : 1 }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--berry)'; e.currentTarget.style.borderColor = 'var(--berry)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.borderColor = 'var(--hairline)'; }}>
                      {deletingId === b.id ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Trash2 style={{ width: 15, height: 15 }} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {initialBanners.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...T.td, textAlign: 'center', padding: '48px 22px', color: 'var(--ink-soft)', borderBottom: 0 }}>
                  No hay banners. Agrega el primero.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,10,.42)', backdropFilter: 'blur(2px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setModal({ open: false }); }}>
          <div style={{ background: 'var(--paper)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--hairline)', background: 'var(--paper-card)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', margin: 0, flex: 1 }}>
                {modal.modo === 'crear' ? 'Nuevo banner' : 'Editar banner'}
              </h3>
              <button onClick={() => setModal({ open: false })}
                style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <BannerForm
              bannerInicial={modal.modo === 'editar' ? modal.banner : undefined}
              onSuccess={() => { setModal({ open: false }); refresh(); }}
              onCancel={() => setModal({ open: false })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
