'use client';

import { useConfirm } from '@/components/admin/ConfirmProvider';

import { useState, useCallback, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, X, Upload } from 'lucide-react';
import { useActionState, useEffect } from 'react';
import { createEspecial, toggleEspecial, deleteEspecial, addEspecialImagen, removeEspecialImagen, setEspecialProducto } from '@/actions/especiales';
import type { Especial } from '@/types/database';
import ToggleSwitch from '@/components/admin/ToggleSwitch';

type ProductoOpcion = { id: string; nombre: string };

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

function inpFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff';
}
function inpBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)';
}

function EspecialForm({ productos, onSuccess, onCancel }: { productos: ProductoOpcion[]; onSuccess: () => void; onCancel: () => void }) {
  const [state, formAction, isPending] = useActionState(createEspecial, null);
  const [preview, setPreview] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];
  useEffect(() => { if (state?.success) onSuccess(); }, [state, onSuccess]);

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
      {state?.success === false && (
        <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderRadius: 'var(--r-md)', padding: '11px 14px', fontSize: 13, color: 'var(--berry)' }}>{state.error}</div>
      )}

      {/* Imagen */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Imagen <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>(opcional)</span></label>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '12px 14px', border: '1.5px dashed var(--hairline)', borderRadius: 'var(--r-md)', background: 'var(--paper)', transition: '.14s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLLabelElement).style.borderColor = 'var(--orange)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLLabelElement).style.borderColor = 'var(--hairline)'; }}
        >
          <input type="file" name="imagen" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }} />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="preview" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: 10, background: 'var(--cream)', display: 'grid', placeItems: 'center', color: 'var(--orange-ink)', flexShrink: 0 }}>
              <Upload style={{ width: 20, height: 20 }} />
            </div>
          )}
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{preview ? 'Imagen seleccionada' : 'Subir imagen'}</p>
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>PNG, JPG o WebP · Máx. 5 MB</p>
          </div>
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Nombre <span style={{ color: 'var(--berry)' }}>*</span></label>
        <input name="nombre" required disabled={isPending} placeholder="Brownie de Matcha"
          style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Descripción <span style={{ color: 'var(--berry)' }}>*</span></label>
        <textarea name="descripcion" required rows={2} disabled={isPending}
          placeholder="Brownie experimental con matcha japonés y frambuesa."
          style={{ ...T.inp, resize: 'vertical', minHeight: 80, lineHeight: 1.6, opacity: isPending ? 0.6 : 1 }}
          onFocus={inpFocus} onBlur={inpBlur} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Emoji</label>
          <input name="emoji" maxLength={4} disabled={isPending} defaultValue="🍪"
            style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Fecha inicio</label>
          <input name="fecha_inicio" type="date" disabled={isPending} defaultValue={today}
            style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Días <span style={{ color: 'var(--berry)' }}>*</span></label>
          <input name="duracion_dias" type="number" min="1" required disabled={isPending} defaultValue={7}
            style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Producto vinculado <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>(opcional)</span></label>
        <select name="producto_id" disabled={isPending} defaultValue=""
          style={{ ...T.inp, opacity: isPending ? 0.6 : 1, cursor: 'pointer' }}>
          <option value="">Sin vincular — pedidos por WhatsApp</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>
          Con producto vinculado, la portada muestra &ldquo;Conocer más&rdquo; y &ldquo;Pedir ahora&rdquo; hacia el flujo de pedido.
        </p>
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

/* ── Multi-image gallery manager ── */
function GaleriaEspecial({ especial, onDone }: { especial: Especial; onDone: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allImgs = [
    ...(especial.imagen_url ? [especial.imagen_url] : []),
    ...(Array.isArray(especial.imagenes) ? especial.imagenes : []),
  ];

  async function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('imagen', file);
    await addEspecialImagen(especial.id, fd);
    setUploading(false);
    onDone();
  }

  async function handleRemove(url: string) {
    setRemoving(url);
    await removeEspecialImagen(especial.id, url);
    setRemoving(null);
    onDone();
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {allImgs.map((url, i) => (
        <div key={url} style={{ position: 'relative', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`img ${i + 1}`}
            style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: i === 0 ? '2px solid var(--orange)' : '1px solid var(--hairline)', display: 'block' }} />
          <button
            onClick={() => handleRemove(url)}
            disabled={removing === url}
            title="Eliminar imagen"
            style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: 'var(--berry)', color: '#fff', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 9, lineHeight: 1 }}
          >
            {removing === url ? '…' : '×'}
          </button>
        </div>
      ))}

      {/* Add button */}
      {allImgs.length < 5 && (
        <>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp"
            onChange={handleAdd} style={{ display: 'none' }} />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            title="Agregar imagen"
            style={{ width: 40, height: 40, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--cream)', border: '1.5px dashed var(--hairline)', color: 'var(--orange-ink)', cursor: 'pointer', flexShrink: 0 }}
          >
            {uploading
              ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
              : <Upload style={{ width: 14, height: 14 }} />
            }
          </button>
        </>
      )}
    </div>
  );
}

export default function EspecialesClient({ initialEspeciales, productos }: { initialEspeciales: Especial[]; productos: ProductoOpcion[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => { startTransition(() => { router.refresh(); }); }, [router]);

  async function handleLinkProducto(id: string, productoId: string) {
    setLinkingId(id);
    await setEspecialProducto(id, productoId || null);
    setLinkingId(null);
    refresh();
  }

  async function handleToggle(id: string, current: boolean) {
    setTogglingId(id);
    await toggleEspecial(id, !current);
    setTogglingId(null);
    refresh();
  }

  const confirmar = useConfirm();

  async function handleDelete(id: string, nombre: string) {
    if (!(await confirmar({ mensaje: `El especial "${nombre}" se eliminará permanentemente.`, confirmLabel: 'Eliminar', peligro: true }))) return;
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
                <th style={T.th}>Producto</th>
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

                    {/* Especial cell: thumb + name + desc */}
                    <td style={T.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Thumbnail / emoji */}
                        <div style={{ width: 46, height: 46, borderRadius: 11, flexShrink: 0, overflow: 'hidden', background: 'var(--cream)', display: 'grid', placeItems: 'center', color: 'var(--orange-ink)', fontSize: 22 }}>
                          {e.imagen_url
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={e.imagen_url} alt={e.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : e.emoji
                          }
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{e.nombre}</p>
                          <p style={{ fontSize: 12, color: 'var(--ink-soft)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{e.descripcion}</p>
                        </div>
                      </div>
                    </td>

                    {/* Producto vinculado */}
                    <td style={T.td}>
                      <select
                        value={e.producto_id ?? ''}
                        disabled={linkingId === e.id}
                        onChange={(ev) => handleLinkProducto(e.id, ev.target.value)}
                        style={{ ...T.inp, width: 180, padding: '7px 10px', fontSize: 13, cursor: 'pointer', opacity: linkingId === e.id ? 0.6 : 1 }}
                      >
                        <option value="">Sin vincular</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
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
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <GaleriaEspecial especial={e} onDone={refresh} />
                        {/* Delete */}
                        <button onClick={() => handleDelete(e.id, e.nombre)} disabled={deletingId === e.id}
                          style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', cursor: 'pointer', transition: '.14s', opacity: deletingId === e.id ? 0.5 : 1 }}
                          onMouseEnter={ev => { ev.currentTarget.style.color = 'var(--berry)'; ev.currentTarget.style.borderColor = 'var(--berry)'; }}
                          onMouseLeave={ev => { ev.currentTarget.style.color = 'var(--ink-soft)'; ev.currentTarget.style.borderColor = 'var(--hairline)'; }}>
                          {deletingId === e.id ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Trash2 style={{ width: 15, height: 15 }} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {initialEspeciales.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ ...T.td, textAlign: 'center', padding: '48px 22px', color: 'var(--ink-soft)', borderBottom: 0 }}>
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
          <div style={{ background: 'var(--paper)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--hairline)', background: 'var(--paper-card)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', margin: 0, flex: 1 }}>Nuevo especial del chef</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <EspecialForm productos={productos} onSuccess={() => { setIsModalOpen(false); refresh(); }} onCancel={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
