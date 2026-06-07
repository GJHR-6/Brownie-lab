'use client';

import { useState, useCallback, useTransition, useActionState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Pencil, Loader2, X } from 'lucide-react';
import {
  createVariante, updateVariante, deleteVariante,
  toggleVarianteProximamente, toggleVarianteActivo,
} from '@/actions/personaliza';
import ToggleSwitch from '@/components/admin/ToggleSwitch';
import type { PersonalizaVariante } from '@/types/database';

type Filtro = 'todas' | 'brownie' | 'galleta';

const T = {
  th: { textAlign: 'left' as const, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--ink-soft)', padding: '12px 18px', borderBottom: '1px solid var(--hairline)', whiteSpace: 'nowrap' as const, background: 'var(--paper)' },
  td: { padding: '12px 18px', fontSize: 14, color: 'var(--ink)', verticalAlign: 'middle' as const, borderBottom: '1px solid var(--hairline)' },
  inp: { width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' } as React.CSSProperties,
  btnPrimary: { display: 'inline-flex' as const, alignItems: 'center' as const, gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer' as const, background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', transition: '.16s' },
  btnGhost: { display: 'inline-flex' as const, alignItems: 'center' as const, gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)', cursor: 'pointer' as const, background: 'var(--paper-card)', color: 'var(--ink)', transition: '.16s' },
};

function inpFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff';
}
function inpBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)';
}

function slugify(str: string): string {
  return str.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function BaseBadge({ base }: { base: 'brownie' | 'galleta' }) {
  const isBrownie = base === 'brownie';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontSize: 11.5, fontWeight: 700,
      padding: '3px 10px', borderRadius: 'var(--r-pill)',
      background: isBrownie ? 'rgba(101,60,25,.12)' : 'rgba(217,113,30,.12)',
      color: isBrownie ? '#65391a' : 'var(--orange-ink)',
    }}>
      {isBrownie ? 'Brownie' : 'Galleta'}
    </span>
  );
}

function VarianteForm({ inicial, onSuccess, onCancel }: {
  inicial?: PersonalizaVariante;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!inicial;
  const boundAction = useMemo(
    () => isEdit ? updateVariante.bind(null, inicial.id) : createVariante,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [state, formAction, pending] = useActionState(boundAction, null);

  const [slugVal, setSlugVal] = useState(inicial?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(isEdit);

  useEffect(() => { if (state?.success) onSuccess(); }, [state, onSuccess]);

  function handleNombreChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugEdited) setSlugVal(slugify(e.target.value));
  }

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: 24 }}>
      {state && !state.success && (
        <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderRadius: 'var(--r-md)', padding: '11px 14px', fontSize: 13, color: 'var(--berry)' }}>
          {state.error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Base */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Base <span style={{ color: 'var(--berry)' }}>*</span></label>
          <select name="base" defaultValue={inicial?.base ?? 'brownie'} required
            style={{ ...T.inp, appearance: 'auto', opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur}>
            <option value="brownie">Brownie</option>
            <option value="galleta">Galleta</option>
          </select>
        </div>

        {/* Orden */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Orden</label>
          <input name="orden" type="number" min="0" step="1" defaultValue={inicial?.orden ?? 0}
            style={{ ...T.inp, opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        {/* Nombre */}
        <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Nombre <span style={{ color: 'var(--berry)' }}>*</span></label>
          <input name="nombre" required maxLength={120} defaultValue={inicial?.nombre}
            onChange={handleNombreChange}
            style={{ ...T.inp, opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        {/* Slug */}
        <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
            Slug <span style={{ color: 'var(--berry)' }}>*</span>
            <span style={{ marginLeft: 6, fontSize: 11.5, fontWeight: 400, color: 'var(--ink-soft)' }}>solo letras minúsculas, números y guiones</span>
          </label>
          <input name="slug" required maxLength={60}
            value={slugVal}
            onChange={e => { setSlugEdited(true); setSlugVal(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); }}
            style={{ ...T.inp, fontFamily: 'ui-monospace,monospace', fontSize: 13, opacity: pending ? 0.6 : 1 }}
            onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        {/* Descripción */}
        <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Descripción</label>
          <input name="descripcion" maxLength={300} defaultValue={inicial?.descripcion ?? ''}
            placeholder="Ej. Denso y húmedo"
            style={{ ...T.inp, opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        {/* Precio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Precio (L.) <span style={{ color: 'var(--berry)' }}>*</span></label>
          <input name="precio" type="number" step="0.01" min="0.01" max="9999" required
            defaultValue={inicial?.precio ?? ''}
            style={{ ...T.inp, opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        {/* Imagen URL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
            Imagen
            <span style={{ marginLeft: 6, fontSize: 11.5, fontWeight: 400, color: 'var(--ink-soft)' }}>ruta del SVG</span>
          </label>
          <input name="imagen_url" maxLength={500} defaultValue={inicial?.imagen_url ?? ''}
            placeholder="/art/brownie-clasico.svg"
            style={{ ...T.inp, fontFamily: 'ui-monospace,monospace', fontSize: 12, opacity: pending ? 0.6 : 1 }}
            onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        {/* Flags */}
        <div style={{ gridColumn: '1/-1', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--ink)', cursor: 'pointer' }}>
            <input type="checkbox" name="proximamente" value="true" defaultChecked={inicial?.proximamente ?? false}
              style={{ accentColor: 'var(--orange)', width: 16, height: 16 }} />
            Próximamente
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--ink)', cursor: 'pointer' }}>
            <input type="checkbox" name="activo" value="true" defaultChecked={inicial?.activo ?? true}
              style={{ accentColor: 'var(--orange)', width: 16, height: 16 }} />
            Visible en Personaliza
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid var(--hairline)', marginTop: 4 }}>
        <button type="button" onClick={onCancel} disabled={pending} style={{ ...T.btnGhost, flex: 1, justifyContent: 'center' }}>Cancelar</button>
        <button type="submit" disabled={pending} style={{ ...T.btnPrimary, flex: 1, justifyContent: 'center', opacity: pending ? 0.7 : 1 }}>
          {pending && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
          {isEdit ? 'Guardar cambios' : 'Crear variante'}
        </button>
      </div>
    </form>
  );
}

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'todas',   label: 'Todas' },
  { key: 'brownie', label: 'Brownies' },
  { key: 'galleta', label: 'Galletas' },
];

export default function PersonalizaAdminClient({ initialVariantes }: { initialVariantes: PersonalizaVariante[] }) {
  type ModalState = { open: false } | { open: true; modo: 'crear' } | { open: true; modo: 'editar'; variante: PersonalizaVariante };

  const router = useRouter();
  const [modal,       setModal]       = useState<ModalState>({ open: false });
  const [filtro,      setFiltro]      = useState<Filtro>('todas');
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [togglingId,  setTogglingId]  = useState<string | null>(null);
  const [isPending,   startTransition] = useTransition();

  const refresh       = useCallback(() => { startTransition(() => { router.refresh(); }); }, [router]);
  const handleSuccess = useCallback(() => { setModal({ open: false }); refresh(); }, [refresh]);

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`¿Eliminar la variante "${nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    await deleteVariante(id);
    setDeletingId(null);
    refresh();
  }

  async function handleToggleProx(id: string, current: boolean) {
    setTogglingId(id);
    await toggleVarianteProximamente(id, !current);
    setTogglingId(null);
    refresh();
  }

  async function handleToggleActivo(id: string, current: boolean) {
    setTogglingId(id);
    await toggleVarianteActivo(id, !current);
    setTogglingId(null);
    refresh();
  }

  const filtered = initialVariantes.filter(v => {
    if (filtro === 'brownie') return v.base === 'brownie';
    if (filtro === 'galleta') return v.base === 'galleta';
    return true;
  });

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1400px] w-full">

      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>
            Personaliza
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
            {initialVariantes.length} variante{initialVariantes.length !== 1 ? 's' : ''} de base registrada{initialVariantes.length !== 1 ? 's' : ''}
            {isPending && <span style={{ marginLeft: 8, color: 'var(--orange-ink)' }}>Actualizando…</span>}
          </p>
        </div>
        <button onClick={() => setModal({ open: true, modo: 'crear' })} style={T.btnPrimary}>
          <Plus style={{ width: 17, height: 17 }} /> Nueva variante
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'inline-flex', background: 'var(--cream-200)', borderRadius: 'var(--r-pill)', padding: 4, gap: 2, marginBottom: 20 }}>
        {FILTROS.map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            style={{
              border: filtro === f.key ? '1.5px solid var(--hairline)' : '1.5px solid transparent',
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13,
              color: filtro === f.key ? 'var(--ink)' : 'var(--ink-soft)',
              padding: '6px 16px', borderRadius: 'var(--r-pill)', cursor: 'pointer',
              background: filtro === f.key ? 'var(--paper-card)' : 'none',
              boxShadow: filtro === f.key ? 'var(--shadow-sm)' : 'none', transition: '.15s',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={T.th}>Variante</th>
                <th style={T.th}>Base</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Precio</th>
                <th style={{ ...T.th, textAlign: 'center' }}>Próximamente</th>
                <th style={{ ...T.th, textAlign: 'center' }}>Visible</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                  style={{ transition: 'background .12s', opacity: !v.activo ? 0.55 : 1 }}>

                  {/* Nombre + slug */}
                  <td style={T.td}>
                    <p style={{ fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{v.nombre}</p>
                    <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', margin: 0, fontFamily: 'ui-monospace,monospace' }}>{v.slug}</p>
                    {v.descripcion && <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>{v.descripcion}</p>}
                  </td>

                  {/* Base */}
                  <td style={T.td}><BaseBadge base={v.base} /></td>

                  {/* Precio */}
                  <td style={{ ...T.td, textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--orange-ink)', whiteSpace: 'nowrap' }}>
                    L.{Number(v.precio).toFixed(2)}
                  </td>

                  {/* Próximamente toggle */}
                  <td style={{ ...T.td, textAlign: 'center' }}>
                    <ToggleSwitch
                      checked={v.proximamente}
                      onChange={() => handleToggleProx(v.id, v.proximamente)}
                      disabled={togglingId === v.id}
                    />
                  </td>

                  {/* Activo toggle */}
                  <td style={{ ...T.td, textAlign: 'center' }}>
                    <ToggleSwitch
                      checked={v.activo}
                      onChange={() => handleToggleActivo(v.id, v.activo)}
                      disabled={togglingId === v.id}
                    />
                  </td>

                  {/* Acciones */}
                  <td style={{ ...T.td, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setModal({ open: true, modo: 'editar', variante: v })}
                        style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', cursor: 'pointer', transition: '.14s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--orange-ink)'; e.currentTarget.style.borderColor = 'var(--orange)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.borderColor = 'var(--hairline)'; }}>
                        <Pencil style={{ width: 14, height: 14 }} />
                      </button>
                      <button
                        onClick={() => handleDelete(v.id, v.nombre)}
                        disabled={deletingId === v.id}
                        style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', cursor: 'pointer', transition: '.14s', opacity: deletingId === v.id ? 0.5 : 1 }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--berry)'; e.currentTarget.style.borderColor = 'var(--berry)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.borderColor = 'var(--hairline)'; }}>
                        {deletingId === v.id
                          ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                          : <Trash2 style={{ width: 14, height: 14 }} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...T.td, textAlign: 'center', padding: '48px 22px', color: 'var(--ink-soft)', borderBottom: 0 }}>
                    No hay variantes en esta categoría.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota informativa */}
      <p style={{ marginTop: 16, fontSize: 13, color: 'var(--ink-soft)' }}>
        Los cambios de precio se reflejan de inmediato en la página <strong>/personaliza</strong>.
        El campo <em>Imagen</em> referencia archivos SVG en <code>/public/art/</code>.
      </p>

      {/* Modal */}
      {modal.open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,10,.42)', backdropFilter: 'blur(2px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setModal({ open: false }); }}>
          <div style={{ background: 'var(--paper)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--hairline)', background: 'var(--paper-card)', position: 'sticky', top: 0, zIndex: 1 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', margin: 0, flex: 1 }}>
                {modal.modo === 'crear' ? 'Nueva variante' : 'Editar variante'}
              </h3>
              <button onClick={() => setModal({ open: false })}
                style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <VarianteForm
              inicial={modal.modo === 'editar' ? modal.variante : undefined}
              onSuccess={handleSuccess}
              onCancel={() => setModal({ open: false })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
