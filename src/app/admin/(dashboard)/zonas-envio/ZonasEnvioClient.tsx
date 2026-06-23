'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, X, Pencil } from 'lucide-react';
import { useConfirm } from '@/components/admin/ConfirmProvider';
import { crearDeliveryZone, actualizarDeliveryZone, eliminarDeliveryZone } from '@/actions/deliveryZones';
import type { DeliveryZone } from '@/types/database';

const T = {
  th: { textAlign: 'left' as const, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--ink-soft)', padding: '14px 22px', borderBottom: '1px solid var(--hairline)', whiteSpace: 'nowrap' as const, background: 'var(--paper)' },
  td: { padding: '14px 22px', fontSize: 14, color: 'var(--ink)', verticalAlign: 'middle' as const, borderBottom: '1px solid var(--hairline)' },
  inp: { width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' },
  btnPrimary: { display: 'inline-flex' as const, alignItems: 'center' as const, gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer' as const, background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', transition: '.16s' },
  btnGhost: { display: 'inline-flex' as const, alignItems: 'center' as const, gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)', cursor: 'pointer' as const, background: 'var(--paper-card)', color: 'var(--ink)', transition: '.16s' },
};

type ModalState = { open: false } | { open: true; modo: 'crear' } | { open: true; modo: 'editar'; zona: DeliveryZone };

function ZonaForm({ zonaInicial, onSuccess, onCancel }: { zonaInicial?: DeliveryZone; onSuccess: () => void; onCancel: () => void }) {
  const isEditing = !!zonaInicial;
  const [nombre, setNombre] = useState(zonaInicial?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(zonaInicial?.descripcion ?? '');
  const [tarifa, setTarifa] = useState(String(zonaInicial?.tarifa ?? 0));
  const [orden, setOrden] = useState(String(zonaInicial?.orden ?? 0));
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true); setError(null);
    const tarifaNum = parseFloat(tarifa);
    const ordenNum = parseInt(orden, 10) || 0;
    const result = isEditing
      ? await actualizarDeliveryZone(zonaInicial!.id, { nombre, descripcion, tarifa: tarifaNum, orden: ordenNum })
      : await crearDeliveryZone({ nombre, descripcion, tarifa: tarifaNum, orden: ordenNum });
    setIsPending(false);
    if (!result.success) { setError(result.error); return; }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px' }}>
      {error && (
        <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderRadius: 'var(--r-md)', padding: '11px 14px', fontSize: 13, color: 'var(--berry)' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Nombre <span style={{ color: 'var(--berry)' }}>*</span></label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} required disabled={isPending} maxLength={80}
          placeholder="Centro / Col. Trejo" style={T.inp} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Descripción</label>
        <input value={descripcion} onChange={e => setDescripcion(e.target.value)} disabled={isPending} maxLength={300}
          placeholder="Zona céntrica, incluye colonias X y Y" style={T.inp} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Tarifa L. <span style={{ color: 'var(--berry)' }}>*</span></label>
          <input type="number" min="0" step="1" value={tarifa} onChange={e => setTarifa(e.target.value)} required disabled={isPending} style={T.inp} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Orden</label>
          <input type="number" min="0" step="1" value={orden} onChange={e => setOrden(e.target.value)} disabled={isPending} style={T.inp} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid var(--hairline)', marginTop: 4 }}>
        <button type="button" onClick={onCancel} disabled={isPending} style={{ ...T.btnGhost, flex: 1, justifyContent: 'center' }}>
          Cancelar
        </button>
        <button type="submit" disabled={isPending} style={{ ...T.btnPrimary, flex: 1, justifyContent: 'center', opacity: isPending ? 0.7 : 1 }}>
          {isPending && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
          {isPending ? 'Guardando…' : isEditing ? 'Guardar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}

export default function ZonasEnvioClient({ initialZonas }: { initialZonas: DeliveryZone[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const confirmar = useConfirm();

  const refresh = () => startTransition(() => { router.refresh(); });

  async function handleDelete(id: string, nombre: string) {
    if (!(await confirmar({ mensaje: `La zona "${nombre}" se eliminará permanentemente.`, confirmLabel: 'Eliminar', peligro: true }))) return;
    setDeletingId(id); setDeleteError(null);
    const result = await eliminarDeliveryZone(id);
    if (!result.success) setDeleteError(result.error);
    setDeletingId(null);
    if (result.success) refresh();
  }

  async function handleToggleActiva(zona: DeliveryZone) {
    await actualizarDeliveryZone(zona.id, { activa: !zona.activa });
    refresh();
  }

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1500px] w-full">
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>
            Zonas de envío
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
            Tarifas planas por zona. Se usan cuando el modo de envío está en &ldquo;Por zonas&rdquo; (Envíos).
            {isPending && <span style={{ marginLeft: 8, color: 'var(--orange-ink)' }}>Actualizando…</span>}
          </p>
        </div>
        <button onClick={() => setModal({ open: true, modo: 'crear' })} style={T.btnPrimary}>
          <Plus style={{ width: 17, height: 17 }} />
          Nueva zona
        </button>
      </div>

      {deleteError && (
        <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderLeft: '4px solid var(--berry)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 14, color: 'var(--berry)', marginBottom: 16 }}>
          {deleteError}
        </div>
      )}

      <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={T.th}>Nombre</th>
                <th style={T.th}>Descripción</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Tarifa</th>
                <th style={{ ...T.th, textAlign: 'center' }}>Orden</th>
                <th style={{ ...T.th, textAlign: 'center' }}>Activa</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialZonas.map(z => (
                <tr key={z.id}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                  style={{ transition: 'background .12s' }}>
                  <td style={T.td}><span style={{ fontWeight: 600 }}>{z.nombre}</span></td>
                  <td style={{ ...T.td, color: 'var(--ink-soft)' }}>{z.descripcion || '—'}</td>
                  <td style={{ ...T.td, textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--orange-ink)' }}>L.{Number(z.tarifa).toFixed(2)}</td>
                  <td style={{ ...T.td, textAlign: 'center', color: 'var(--ink-soft)' }}>{z.orden}</td>
                  <td style={{ ...T.td, textAlign: 'center' }}>
                    <button onClick={() => handleToggleActiva(z)}
                      style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 'var(--r-pill)', border: 'none', cursor: 'pointer', background: z.activa ? '#d8f0e2' : '#fce8ea', color: z.activa ? '#157a4d' : '#9e3b46' }}>
                      {z.activa ? 'Activa' : 'Inactiva'}
                    </button>
                  </td>
                  <td style={{ ...T.td, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => setModal({ open: true, modo: 'editar', zona: z })}
                        style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', cursor: 'pointer' }}>
                        <Pencil style={{ width: 15, height: 15 }} />
                      </button>
                      <button onClick={() => handleDelete(z.id, z.nombre)} disabled={deletingId === z.id}
                        style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', cursor: 'pointer', opacity: deletingId === z.id ? 0.5 : 1 }}>
                        {deletingId === z.id ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Trash2 style={{ width: 15, height: 15 }} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialZonas.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...T.td, textAlign: 'center', padding: '48px 22px', color: 'var(--ink-soft)' }}>
                    No hay zonas. Agrega la primera.
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
          <div style={{ background: 'var(--paper)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--hairline)', background: 'var(--paper-card)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', margin: 0, flex: 1 }}>
                {modal.modo === 'crear' ? 'Nueva zona' : 'Editar zona'}
              </h3>
              <button onClick={() => setModal({ open: false })}
                style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <ZonaForm
              zonaInicial={modal.modo === 'editar' ? modal.zona : undefined}
              onSuccess={() => { setModal({ open: false }); refresh(); }}
              onCancel={() => setModal({ open: false })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
