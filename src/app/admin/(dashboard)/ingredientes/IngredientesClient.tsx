'use client';

import { useConfirm } from '@/components/admin/ConfirmProvider';

import { useState, useCallback, useTransition, useActionState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Pencil, Loader2, X, FlaskConical, TrendingUp, ShoppingBag, Package, Sparkles } from 'lucide-react';
import { createIngrediente, updateIngrediente, deleteIngrediente, toggleIngredienteActivo } from '@/actions/ingredientes';
import ToggleSwitch from '@/components/admin/ToggleSwitch';
import type { Ingrediente } from '@/types/database';

const UNIDADES = ['g', 'mL', 'unidad'] as const;
const PRECIO_VENTA_BAJO = 55;
const PRECIO_VENTA_ALTO = 60;

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

function IngredienteForm({ inicial, onSuccess, onCancel }: { inicial?: Ingrediente; onSuccess: () => void; onCancel: () => void }) {
  const isEdit = !!inicial;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const boundAction = useMemo(() => isEdit ? updateIngrediente.bind(null, inicial.id) : createIngrediente, []);
  const [state, formAction, pending] = useActionState(boundAction, null);
  const [esTopping, setEsTopping] = useState(inicial?.es_topping ?? false);
  const [imgPreview, setImgPreview] = useState<string | null>(inicial?.imagen_url ?? null);
  useEffect(() => { if (state?.success) onSuccess(); }, [state, onSuccess]);

  return (
    <form action={formAction} encType="multipart/form-data" style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: 24 }}>
      {isEdit && <input type="hidden" name="imagen_url_existing" value={inicial?.imagen_url ?? ''} />}
      {state && !state.success && (
        <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderRadius: 'var(--r-md)', padding: '11px 14px', fontSize: 13, color: 'var(--berry)' }}>{state.error}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Nombre <span style={{ color: 'var(--berry)' }}>*</span></label>
          <input name="nombre" defaultValue={inicial?.nombre} required style={{ ...T.inp, opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Descripción del paquete</label>
          <input name="descripcion_paquete" defaultValue={inicial?.descripcion_paquete ?? ''} placeholder="Bolsa 1800g, Cartón 30 unidades"
            maxLength={200}
            style={{ ...T.inp, opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Unidad <span style={{ color: 'var(--berry)' }}>*</span></label>
          <select name="unidad" defaultValue={inicial?.unidad ?? 'g'} className="bl-select" style={{ ...T.inp, opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur}>
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
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Cant. por bandeja/porción</label>
          <input name="cantidad_por_bandeja" type="number" step="0.01" min="0" defaultValue={inicial?.cantidad_por_bandeja ?? ''}
            placeholder="En la misma unidad" style={{ ...T.inp, opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Costo bandeja/porción (L.)</label>
          <input name="costo_por_bandeja" type="number" step="0.01" min="0" defaultValue={inicial?.costo_por_bandeja ?? ''}
            placeholder="Calculado o manual" style={{ ...T.inp, opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Precio extra (L.) <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>(solo toppings)</span></label>
          <input name="precio_extra" type="number" step="0.01" min="0" defaultValue={inicial?.precio_extra ?? 0}
            style={{ ...T.inp, opacity: pending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        </div>

        <div style={{ gridColumn: '1/-1', display: 'flex', gap: 20, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--ink)', cursor: 'pointer' }}>
            <input type="checkbox" name="es_topping" value="true" defaultChecked={inicial?.es_topping ?? false}
              onChange={e => setEsTopping(e.target.checked)}
              style={{ accentColor: 'var(--orange)', width: 16, height: 16 }} />
            Es topping
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--ink)', cursor: 'pointer' }}>
            <input type="checkbox" name="activo" value="true" defaultChecked={inicial?.activo ?? true}
              style={{ accentColor: 'var(--orange)', width: 16, height: 16 }} />
            Activo / En Personaliza
          </label>
        </div>

        {/* Imagen del topping (solo si es topping) */}
        {esTopping && (
          <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
              Imagen del topping
              <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 400, color: 'var(--ink-soft)' }}>
                (se usa si no hay arte SVG incorporado)
              </span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {imgPreview && (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgPreview} alt="Vista previa" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--hairline)' }} />
                  <button type="button" onClick={() => setImgPreview(null)}
                    style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--berry)', color: '#fff', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 10 }}>
                    ×
                  </button>
                </div>
              )}
              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '14px 16px', border: '1.5px dashed var(--hairline)', borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: 13, color: 'var(--ink-soft)' }}>
                <Sparkles style={{ width: 18, height: 18, color: 'var(--orange-ink)' }} />
                <span>{imgPreview ? 'Cambiar imagen' : 'Subir imagen'}</span>
                <span style={{ fontSize: 11 }}>PNG, JPG, WEBP · máx. 5 MB</span>
                <input type="file" name="imagen_file" accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="sr-only"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.size > 5 * 1024 * 1024) {
                      e.target.value = '';
                      alert('La imagen no debe superar 5 MB.');
                      return;
                    }
                    setImgPreview(URL.createObjectURL(f));
                  }} />
              </label>
            </div>
          </div>
        )}

        <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Notas</label>
          <textarea name="notas" rows={2} defaultValue={inicial?.notas ?? ''} maxLength={500}
            style={{ ...T.inp, resize: 'vertical', minHeight: 72, lineHeight: 1.6, opacity: pending ? 0.6 : 1 } as React.CSSProperties}
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

function IngredienteIcon({ ingrediente }: { ingrediente: Ingrediente }) {
  if (ingrediente.es_topping && ingrediente.imagen_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={ingrediente.imagen_url}
        alt={ingrediente.nombre}
        style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--hairline)' }}
      />
    );
  }
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center',
      background: ingrediente.es_topping ? 'rgba(217,113,30,.12)' : 'var(--cream)',
      color: 'var(--orange-ink)',
    }}>
      {ingrediente.es_topping
        ? <Sparkles style={{ width: 17, height: 17 }} />
        : <FlaskConical style={{ width: 17, height: 17 }} />}
    </div>
  );
}

function ActionBtns({ onEdit, onDelete, deleting }: { onEdit: () => void; onDelete: () => void; deleting: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
      <button onClick={onEdit}
        style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', cursor: 'pointer', transition: '.14s' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--orange-ink)'; e.currentTarget.style.borderColor = 'var(--orange)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.borderColor = 'var(--hairline)'; }}>
        <Pencil style={{ width: 14, height: 14 }} />
      </button>
      <button onClick={onDelete} disabled={deleting}
        style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', cursor: 'pointer', transition: '.14s', opacity: deleting ? 0.5 : 1 }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--berry)'; e.currentTarget.style.borderColor = 'var(--berry)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.borderColor = 'var(--hairline)'; }}>
        {deleting ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Trash2 style={{ width: 14, height: 14 }} />}
      </button>
    </div>
  );
}

type Filtro = 'todos' | 'base' | 'toppings';

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'todos',    label: 'Todos' },
  { key: 'base',     label: 'Receta base' },
  { key: 'toppings', label: 'Toppings' },
];

const TAB_DESC: Record<Filtro, string> = {
  todos:    'Costos calculados a partir del paquete y la cantidad usada por bandeja.',
  base:     'Ingredientes de la receta. El costo del brownie se calcula automáticamente.',
  toppings: 'Costo, precio de venta y visibilidad de cada topping en "Personaliza tu postre".',
};

export default function IngredientesClient({ initialIngredientes }: { initialIngredientes: Ingrediente[] }) {
  const router = useRouter();
  type ModalState = { open: false } | { open: true; modo: 'crear' } | { open: true; modo: 'editar'; ingrediente: Ingrediente };

  const [modal,      setModal]      = useState<ModalState>({ open: false });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filtro,     setFiltro]     = useState<Filtro>('todos');
  const [porciones,  setPorciones]  = useState(9);
  const [isPending,  startTransition] = useTransition();

  const refresh       = useCallback(() => { startTransition(() => { router.refresh(); }); }, [router]);
  const handleSuccess = useCallback(() => { setModal({ open: false }); refresh(); }, [refresh]);

  const confirmar = useConfirm();

  async function handleDelete(id: string, nombre: string) {
    if (!(await confirmar({ mensaje: `El ingrediente "${nombre}" se eliminará permanentemente. Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar', peligro: true }))) return;
    setDeletingId(id);
    await deleteIngrediente(id);
    setDeletingId(null);
    refresh();
  }

  async function handleToggleActivo(id: string, current: boolean) {
    setTogglingId(id);
    await toggleIngredienteActivo(id, !current);
    setTogglingId(null);
    refresh();
  }

  const filtered = initialIngredientes.filter(i => {
    if (filtro === 'base')     return !i.es_topping;
    if (filtro === 'toppings') return i.es_topping;
    return true;
  });

  // Stat card calculations (base ingredients only)
  const baseActivos = initialIngredientes.filter(i => !i.es_topping);
  const totalBandeja = baseActivos.reduce((s, i) => s + (i.costo_por_bandeja ?? 0), 0);
  const costoPorUnidad = porciones > 0 ? totalBandeja / porciones : 0;
  const margenBajo = PRECIO_VENTA_BAJO - costoPorUnidad;
  const margenAlto = PRECIO_VENTA_ALTO - costoPorUnidad;

  const statCards = [
    { label: 'Costo por bandeja',              value: totalBandeja,    sub: `${porciones} porciones`,            Icon: FlaskConical, bg: 'rgba(47,111,219,.12)',  color: '#2f6fdb' },
    { label: 'Costo por unidad',               value: costoPorUnidad,  sub: 'ingredientes solamente',             Icon: Package,      bg: 'rgba(217,113,30,.13)', color: 'var(--orange-ink)' },
    { label: `Margen a L. ${PRECIO_VENTA_BAJO}`, value: margenBajo,   sub: `${((margenBajo / PRECIO_VENTA_BAJO) * 100).toFixed(0)}% de margen`, Icon: TrendingUp, bg: margenBajo > 0 ? 'rgba(31,138,91,.12)' : 'rgba(158,59,70,.12)', color: margenBajo > 0 ? '#1f8a5b' : 'var(--berry)' },
    { label: `Margen a L. ${PRECIO_VENTA_ALTO}`, value: margenAlto,   sub: `${((margenAlto / PRECIO_VENTA_ALTO) * 100).toFixed(0)}% de margen`, Icon: ShoppingBag, bg: margenAlto > 0 ? 'rgba(31,138,91,.12)' : 'rgba(158,59,70,.12)', color: margenAlto > 0 ? '#1f8a5b' : 'var(--berry)' },
  ];

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1500px] w-full">

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>Insumos</h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
            {initialIngredientes.length} insumos registrados — materia prima y toppings del armador
            {isPending && <span style={{ marginLeft: 8, color: 'var(--orange-ink)' }}>Actualizando…</span>}
          </p>
        </div>
        <button onClick={() => setModal({ open: true, modo: 'crear' })} style={T.btnPrimary}>
          <Plus style={{ width: 17, height: 17 }} /> Nuevo ingrediente
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 16, marginBottom: 28 }}>
        {statCards.map(({ label, value, sub, Icon, bg, color }) => (
          <div key={label} style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', flexShrink: 0, background: bg, color }}>
              <Icon style={{ width: 22, height: 22 }} />
            </span>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--ink)', lineHeight: 1, margin: 0 }}>L.{value.toFixed(2)}</p>
              <p style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 600, marginTop: 4, marginBottom: 0 }}>{label}</p>
              <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', margin: 0 }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar + porciones control */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
        <div style={{ display: 'inline-flex', background: 'var(--cream-200)', borderRadius: 'var(--r-pill)', padding: 4, gap: 2 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)' }}>Porciones por bandeja</span>
          <input
            type="number" min="1" max="100" value={porciones}
            onChange={e => setPorciones(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width: 62, border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '5px 10px', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', background: 'var(--paper)', outline: 'none', textAlign: 'center' }}
            onFocus={e => { e.target.style.borderColor = 'var(--orange)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; }}
          />
        </div>
      </div>

      {/* Tab description */}
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 14 }}>{TAB_DESC[filtro]}</p>

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
                <th style={{ ...T.th, textAlign: 'right' }}>{filtro === 'toppings' ? 'Costo/porción' : 'Costo/bandeja'}</th>
                {filtro === 'toppings' && <th style={{ ...T.th, textAlign: 'right' }}>Precio extra</th>}
                {filtro === 'toppings' && <th style={{ ...T.th, textAlign: 'center' }}>En Personaliza</th>}
                <th style={{ ...T.th, textAlign: 'right' }}>Stock</th>
                {filtro === 'todos'    && <th style={{ ...T.th, textAlign: 'center' }}>Tipo</th>}
                <th style={{ ...T.th, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                  style={{ transition: 'background .12s' }}>

                  {/* Ingrediente */}
                  <td style={T.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <IngredienteIcon ingrediente={i} />
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--ink)', margin: 0, whiteSpace: 'nowrap' }}>{i.nombre}</p>
                        {i.notas && <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', margin: 0 }}>{i.notas}</p>}
                      </div>
                    </div>
                  </td>

                  {/* Paquete */}
                  <td style={{ ...T.td, color: 'var(--ink-soft)' }}>
                    <p style={{ margin: 0, whiteSpace: 'nowrap' }}>{i.descripcion_paquete ?? '—'}</p>
                    {i.cantidad_por_bandeja !== null && (
                      <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'nowrap' }}>
                        {i.cantidad_por_bandeja} {i.unidad} {i.es_topping ? 'por porción' : 'por bandeja'}
                      </p>
                    )}
                  </td>

                  {/* Costo pkg */}
                  <td style={{ ...T.td, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>L.{i.costo_paquete.toFixed(2)}</td>

                  {/* Costo/unidad */}
                  <td style={{ ...T.td, textAlign: 'right', fontFamily: 'ui-monospace,monospace', fontSize: 12.5, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                    {i.costo_por_unidad != null ? `L. ${Number(i.costo_por_unidad).toFixed(4)}/${i.unidad}` : '—'}
                  </td>

                  {/* Costo/bandeja or porción */}
                  <td style={{ ...T.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {i.costo_por_bandeja != null ? (
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--orange-ink)' }}>
                        L.{Number(i.costo_por_bandeja).toFixed(2)}
                      </span>
                    ) : <span style={{ color: 'var(--hairline)' }}>—</span>}
                  </td>

                  {/* Precio extra (toppings only) */}
                  {filtro === 'toppings' && (
                    <td style={{ ...T.td, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {i.precio_extra > 0 ? `+L.${i.precio_extra.toFixed(2)}` : '—'}
                    </td>
                  )}

                  {/* EN PERSONALIZA toggle (toppings only) */}
                  {filtro === 'toppings' && (
                    <td style={{ ...T.td, textAlign: 'center' }}>
                      <ToggleSwitch
                        checked={i.activo}
                        onChange={() => handleToggleActivo(i.id, i.activo)}
                        disabled={togglingId === i.id}
                      />
                    </td>
                  )}

                  {/* Stock */}
                  <td style={{ ...T.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: i.stock_paquetes === 0 ? 'var(--berry)' : i.stock_paquetes <= 2 ? '#b14a12' : 'var(--ink)' }}>
                      {i.stock_paquetes}
                    </span>
                  </td>

                  {/* Tipo badge (todos only) */}
                  {filtro === 'todos' && (
                    <td style={{ ...T.td, textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--r-pill)', background: i.es_topping ? '#ece8f8' : 'var(--cream-200)', color: i.es_topping ? '#6b46c1' : 'var(--orange-ink)' }}>
                        {i.es_topping ? 'Topping' : 'Base'}
                      </span>
                    </td>
                  )}

                  {/* Actions */}
                  <td style={{ ...T.td, textAlign: 'right' }}>
                    <ActionBtns
                      onEdit={() => setModal({ open: true, modo: 'editar', ingrediente: i })}
                      onDelete={() => handleDelete(i.id, i.nombre)}
                      deleting={deletingId === i.id}
                    />
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ ...T.td, textAlign: 'center', padding: '48px 22px', color: 'var(--ink-soft)', borderBottom: 0 }}>
                    No hay ingredientes en esta categoría.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Receta base footer */}
            {filtro === 'base' && filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: 'var(--cream)' }}>
                  <td colSpan={5} style={{ ...T.td, borderBottom: '1px solid var(--hairline)', textAlign: 'right', borderTop: '1.5px solid var(--hairline)' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                      TOTAL RECETA BASE · {porciones} PORCIONES
                    </span>
                  </td>
                  <td colSpan={2} style={{ ...T.td, textAlign: 'right', borderTop: '1.5px solid var(--hairline)', borderBottom: '1px solid var(--hairline)' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--orange-ink)' }}>
                      L.{totalBandeja.toFixed(2)}
                    </span>
                  </td>
                </tr>
                <tr style={{ background: 'var(--cream)' }}>
                  <td colSpan={5} style={{ ...T.td, borderBottom: 0, textAlign: 'right' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                      COSTO POR BROWNIE
                    </span>
                  </td>
                  <td colSpan={2} style={{ ...T.td, textAlign: 'right', borderBottom: 0 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--orange-ink)' }}>
                      L.{costoPorUnidad.toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
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
