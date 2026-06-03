'use client';

import { useState, useCallback, useTransition, useActionState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Pencil, Loader2, X, FlaskConical, TrendingUp, ShoppingBag, Package } from 'lucide-react';
import { createIngrediente, updateIngrediente, deleteIngrediente } from '@/actions/ingredientes';
import type { Ingrediente } from '@/types/database';

const UNIDADES = ['g', 'mL', 'unidad'] as const;
const PRECIO_VENTA_BAJO = 55;
const PRECIO_VENTA_ALTO = 60;
const PORCIONES_POR_BANDEJA = 9;

const T = {
  th: { textAlign: 'left' as const, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--ink-soft)', padding: '14px 22px', borderBottom: '1px solid var(--hairline)', whiteSpace: 'nowrap' as const, background: 'var(--paper)' },
  td: { padding: '14px 22px', fontSize: 14, color: 'var(--ink)', verticalAlign: 'middle' as const, borderBottom: '1px solid var(--hairline)' },
  inp: { width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' },
  btnPrimary: { display: 'inline-flex' as const, alignItems: 'center' as const, gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer' as const, background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', transition: '.16s' },
  btnGhost: { display: 'inline-flex' as const, alignItems: 'center' as const, gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)', cursor: 'pointer' as const, background: 'var(--paper-card)', color: 'var(--ink)', transition: '.16s' },
};

function inpFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff';
}
function inpBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)';
}

function IngredienteForm({ inicial, onSuccess, onCancel }: { inicial?: Ingrediente; onSuccess: () => void; onCancel: () => void }) {
  const isEdit = !!inicial;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const boundAction = useMemo(() => isEdit ? updateIngrediente.bind(null, inicial.id) : createIngrediente, []);
  const [state, formAction, pending] = useActionState(boundAction, null);
  useEffect(() => { if (state?.success) onSuccess(); }, [state, onSuccess]);

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: 24 }}>
      {state && !state.success && (
        <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderRadius: 'var(--r-md)', padding: '11px 14px', fontSize: 13, color: 'var(--berry)' }}>{state.error}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Nombre <span style={{ color: 'var(--berry)' }}>*</span></label>
          <input name="nombre" defaultValue={inicial?.nombre} required
            style={{ ...T.inp, opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Descripción del paquete</label>
          <input name="descripcion_paquete" defaultValue={inicial?.descripcion_paquete ?? ''} placeholder="Bolsa 1800g, Cartón 30 unidades"
            style={{ ...T.inp, opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Unidad <span style={{ color: 'var(--berry)' }}>*</span></label>
          <select name="unidad" defaultValue={inicial?.unidad ?? 'g'}
            style={{ ...T.inp, appearance: 'auto', opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur}>
            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Tamaño paquete <span style={{ color: 'var(--berry)' }}>*</span></label>
          <input name="tamano_paquete" type="number" step="0.01" min="0.01" required defaultValue={inicial?.tamano_paquete}
            style={{ ...T.inp, opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Costo paquete (L.) <span style={{ color: 'var(--berry)' }}>*</span></label>
          <input name="costo_paquete" type="number" step="0.01" min="0" required defaultValue={inicial?.costo_paquete}
            style={{ ...T.inp, opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Stock (paquetes)</label>
          <input name="stock_paquetes" type="number" step="0.5" min="0" defaultValue={inicial?.stock_paquetes ?? 0}
            style={{ ...T.inp, opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Cant. por bandeja</label>
          <input name="cantidad_por_bandeja" type="number" step="0.01" min="0" defaultValue={inicial?.cantidad_por_bandeja ?? ''} placeholder="En la misma unidad"
            style={{ ...T.inp, opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Costo por bandeja (L.)</label>
          <input name="costo_por_bandeja" type="number" step="0.01" min="0" defaultValue={inicial?.costo_por_bandeja ?? ''} placeholder="Calculado o manual"
            style={{ ...T.inp, opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        <div style={{ gridColumn: '1/-1', display: 'flex', gap: 20, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--ink)', cursor: 'pointer' }}>
            <input type="checkbox" name="es_topping" value="true" defaultChecked={inicial?.es_topping ?? false}
              style={{ accentColor: 'var(--orange)', width: 16, height: 16 }} />
            Es topping
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--ink)', cursor: 'pointer' }}>
            <input type="checkbox" name="activo" value="true" defaultChecked={inicial?.activo ?? true}
              style={{ accentColor: 'var(--orange)', width: 16, height: 16 }} />
            Activo
          </label>
        </div>

        <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Notas</label>
          <textarea name="notas" rows={2} defaultValue={inicial?.notas ?? ''}
            style={{ ...T.inp, resize: 'vertical', minHeight: 72, lineHeight: 1.6, opacity: pending ? 0.6 : 1 }}
            onFocus={inpFocus} onBlur={inpBlur} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid var(--hairline)', marginTop: 4 }}>
        <button type="button" onClick={onCancel} disabled={pending} style={{ ...T.btnGhost, flex: 1, justifyContent: 'center' }}>Cancelar</button>
        <button type="submit" disabled={pending} style={{ ...T.btnPrimary, flex: 1, justifyContent: 'center', opacity: pending ? 0.7 : 1 }}>
          {pending && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
          {isEdit ? 'Guardar cambios' : 'Crear ingrediente'}
        </button>
      </div>
    </form>
  );
}

function ResumenCostos({ ingredientes }: { ingredientes: Ingrediente[] }) {
  const totalBandeja = ingredientes.filter(i => i.activo && i.costo_por_bandeja !== null).reduce((s, i) => s + (i.costo_por_bandeja ?? 0), 0);
  const costoPorUnidad = totalBandeja / PORCIONES_POR_BANDEJA;
  const margenBajo = PRECIO_VENTA_BAJO - costoPorUnidad;
  const margenAlto = PRECIO_VENTA_ALTO - costoPorUnidad;

  const cards = [
    { label: 'Costo por bandeja', value: `L. ${totalBandeja.toFixed(2)}`, sub: `${PORCIONES_POR_BANDEJA} porciones`, icon: FlaskConical, bg: 'rgba(47,111,219,.12)', color: '#2f6fdb' },
    { label: 'Costo por unidad', value: `L. ${costoPorUnidad.toFixed(2)}`, sub: 'ingredientes solamente', icon: Package, bg: 'rgba(217,113,30,.13)', color: 'var(--orange-ink)' },
    { label: `Margen a L. ${PRECIO_VENTA_BAJO}`, value: `L. ${margenBajo.toFixed(2)}`, sub: `${((margenBajo / PRECIO_VENTA_BAJO) * 100).toFixed(0)}% de margen`, icon: TrendingUp, bg: margenBajo > 0 ? 'rgba(31,138,91,.12)' : 'rgba(158,59,70,.12)', color: margenBajo > 0 ? 'var(--green)' : 'var(--berry)' },
    { label: `Margen a L. ${PRECIO_VENTA_ALTO}`, value: `L. ${margenAlto.toFixed(2)}`, sub: `${((margenAlto / PRECIO_VENTA_ALTO) * 100).toFixed(0)}% de margen`, icon: ShoppingBag, bg: margenAlto > 0 ? 'rgba(31,138,91,.12)' : 'rgba(158,59,70,.12)', color: margenAlto > 0 ? 'var(--green)' : 'var(--berry)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }} className="grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, sub, icon: Icon, bg, color }) => (
        <div key={label} style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', flexShrink: 0, background: bg, color }}>
            <Icon style={{ width: 22, height: 22 }} />
          </span>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--ink)', lineHeight: 1, margin: 0 }}>{value}</p>
            <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 500, marginTop: 4 }}>{label}</p>
            <p style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

type Filtro = 'todos' | 'base' | 'toppings';

export default function IngredientesClient({ initialIngredientes }: { initialIngredientes: Ingrediente[] }) {
  const router = useRouter();
  type ModalState = { open: false } | { open: true; modo: 'crear' } | { open: true; modo: 'editar'; ingrediente: Ingrediente };

  const [modal, setModal] = useState<ModalState>({ open: false });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => { startTransition(() => { router.refresh(); }); }, [router]);
  const handleSuccess = useCallback(() => { setModal({ open: false }); refresh(); }, [refresh]);

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    await deleteIngrediente(id);
    setDeletingId(null);
    refresh();
  }

  const filtered = initialIngredientes.filter(i => {
    if (filtro === 'base') return !i.es_topping;
    if (filtro === 'toppings') return i.es_topping;
    return true;
  });

  const FILTROS: { key: Filtro; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'base', label: 'Receta base' },
    { key: 'toppings', label: 'Toppings' },
  ];

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1500px] w-full">
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>Ingredientes</h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
            {initialIngredientes.length} ingredientes registrados
            {isPending && <span style={{ marginLeft: 8, color: 'var(--orange-ink)' }}>Actualizando…</span>}
          </p>
        </div>
        <button onClick={() => setModal({ open: true, modo: 'crear' })} style={T.btnPrimary}>
          <Plus style={{ width: 17, height: 17 }} />Nuevo ingrediente
        </button>
      </div>

      <ResumenCostos ingredientes={initialIngredientes} />

      {/* Filter tabs */}
      <div style={{ display: 'inline-flex', background: 'var(--cream-200)', borderRadius: 'var(--r-pill)', padding: 4, gap: 2, marginBottom: 18 }}>
        {FILTROS.map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            style={{ border: 0, fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13, color: filtro === f.key ? 'var(--ink)' : 'var(--ink-soft)', padding: '7px 16px', borderRadius: 'var(--r-pill)', cursor: 'pointer', background: filtro === f.key ? 'var(--paper-card)' : 'none', boxShadow: filtro === f.key ? 'var(--shadow-sm)' : 'none', transition: '.15s' }}>
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
                <th style={T.th}>Ingrediente</th>
                <th style={T.th}>Paquete</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Costo pkg.</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Costo/unidad</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Costo/bandeja</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Stock</th>
                <th style={{ ...T.th, textAlign: 'center' }}>Tipo</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                  style={{ transition: 'background .12s', opacity: !i.activo ? 0.5 : 1 }}>
                  <td style={T.td}>
                    <p style={{ fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{i.nombre}</p>
                    {i.notas && <p style={{ fontSize: 12, color: 'var(--ink-soft)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{i.notas}</p>}
                  </td>
                  <td style={{ ...T.td, color: 'var(--ink-soft)' }}>
                    {i.descripcion_paquete ?? '—'}
                    {i.cantidad_por_bandeja !== null && (
                      <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>{i.cantidad_por_bandeja} {i.unidad} por bandeja</p>
                    )}
                  </td>
                  <td style={{ ...T.td, textAlign: 'right', fontWeight: 600 }}>L. {i.costo_paquete.toFixed(2)}</td>
                  <td style={{ ...T.td, textAlign: 'right', fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'ui-monospace,monospace' }}>
                    {i.costo_por_unidad != null ? `L. ${Number(i.costo_por_unidad).toFixed(4)}/${i.unidad}` : '—'}
                  </td>
                  <td style={{ ...T.td, textAlign: 'right' }}>
                    {i.costo_por_bandeja != null ? (
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--orange-ink)' }}>
                        L. {Number(i.costo_por_bandeja).toFixed(2)}
                      </span>
                    ) : <span style={{ color: 'var(--hairline)' }}>—</span>}
                  </td>
                  <td style={{ ...T.td, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: i.stock_paquetes === 0 ? 'var(--berry)' : i.stock_paquetes <= 2 ? '#b14a12' : 'var(--ink)' }}>
                      {i.stock_paquetes}
                    </span>
                  </td>
                  <td style={{ ...T.td, textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 'var(--r-pill)', background: i.es_topping ? '#ece8f8' : 'var(--cream-200)', color: i.es_topping ? '#6b46c1' : 'var(--orange-ink)' }}>
                      {i.es_topping ? 'Topping' : 'Base'}
                    </span>
                  </td>
                  <td style={{ ...T.td, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => setModal({ open: true, modo: 'editar', ingrediente: i })}
                        style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', cursor: 'pointer', transition: '.14s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--orange-ink)'; e.currentTarget.style.borderColor = 'var(--orange)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.borderColor = 'var(--hairline)'; }}>
                        <Pencil style={{ width: 15, height: 15 }} />
                      </button>
                      <button onClick={() => handleDelete(i.id, i.nombre)} disabled={deletingId === i.id}
                        style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', cursor: 'pointer', transition: '.14s', opacity: deletingId === i.id ? 0.5 : 1 }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--berry)'; e.currentTarget.style.borderColor = 'var(--berry)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.borderColor = 'var(--hairline)'; }}>
                        {deletingId === i.id ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Trash2 style={{ width: 15, height: 15 }} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ ...T.td, textAlign: 'center', padding: '48px 22px', color: 'var(--ink-soft)', borderBottom: 0 }}>
                    No hay ingredientes en esta categoría.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Note about packaging */}
        <div style={{ borderTop: '1px solid var(--hairline)', padding: '12px 22px', background: 'var(--cream)' }}>
          <p style={{ fontSize: 12, color: 'var(--orange-ink)', margin: 0 }}>
            <strong>Nota:</strong> el costo de empaques no está incluido en el resumen. Estimado: ~L17 por bandeja (L1.90/unidad).
          </p>
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,10,.42)', backdropFilter: 'blur(2px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setModal({ open: false }); }}>
          <div style={{ background: 'var(--paper)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--hairline)', background: 'var(--paper-card)', position: 'sticky', top: 0 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', margin: 0, flex: 1 }}>
                {modal.modo === 'crear' ? 'Nuevo ingrediente' : 'Editar ingrediente'}
              </h3>
              <button onClick={() => setModal({ open: false })}
                style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <IngredienteForm
              inicial={modal.modo === 'editar' ? modal.ingrediente : undefined}
              onSuccess={handleSuccess}
              onCancel={() => setModal({ open: false })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
