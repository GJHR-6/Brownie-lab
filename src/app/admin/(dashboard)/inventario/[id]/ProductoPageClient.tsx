'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, ChevronLeft, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { createProducto, updateProducto, deleteProducto } from '@/actions/productos';
import ToggleSwitch from '@/components/admin/ToggleSwitch';
import type { Producto, Categoria, Ingrediente } from '@/types/database';

const ETIQUETAS = ['Nuevo', 'Más vendido', 'Sin gluten', 'Vegano', 'Edición limitada', 'Sin azúcar'];

const T = {
  inp: {
    width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)',
    padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14,
    color: 'var(--ink)', background: 'var(--paper)', outline: 'none',
  } as React.CSSProperties,
  card: {
    background: 'var(--paper-card)', border: '1px solid var(--hairline)',
    borderRadius: 'var(--r-lg)', padding: 28, boxShadow: 'var(--shadow-sm)',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 4,
  } as React.CSSProperties,
  cardSub: {
    fontSize: 13, color: 'var(--ink-soft)', marginBottom: 20,
  } as React.CSSProperties,
  label: { fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 6, display: 'block' } as React.CSSProperties,
};

function inpFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff';
}
function inpBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)';
}

interface ImageSlotProps {
  label: string;
  name: string;
  existingUrl: string | null;
  onClear: () => void;
}
function ImageSlot({ label, name, existingUrl, onClear }: ImageSlotProps) {
  const [preview, setPreview] = useState<string | null>(existingUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPreview(existingUrl); }, [existingUrl]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setPreview(URL.createObjectURL(f));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</span>
      <label
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, height: 120, borderRadius: 12, cursor: 'pointer', position: 'relative', overflow: 'hidden',
          border: preview ? 'none' : '1.5px dashed var(--hairline)',
          background: preview ? 'transparent' : 'var(--cream)',
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            <Upload style={{ width: 22, height: 22, color: 'var(--ink-soft)' }} />
            <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Subir foto</span>
          </>
        )}
        <input ref={inputRef} name={name} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleFile} />
      </label>
      {preview && (
        <button
          type="button"
          onClick={() => { setPreview(null); onClear(); if (inputRef.current) inputRef.current.value = ''; }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, color: 'var(--berry)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <X style={{ width: 12, height: 12 }} /> Quitar
        </button>
      )}
    </div>
  );
}

interface Props {
  producto?: Producto;
  categorias: Categoria[];
  ingredientes: Ingrediente[];
}

export default function ProductoPageClient({ producto, categorias, ingredientes }: Props) {
  const router = useRouter();
  const isEditing = !!producto;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const action = useMemo(() => isEditing ? updateProducto.bind(null, producto!.id) : createProducto, []);
  const [state, formAction, isPending] = useActionState(action, null);

  const [disponible,             setDisponible]            = useState(producto?.disponible ?? true);
  const [destacadoCapricho,      setDestacadoCapricho]     = useState(producto?.destacado_capricho ?? false);
  const [disponiblePersonaliza,  setDisponiblePersonaliza] = useState(producto?.disponible_personaliza ?? false);
  const [etiquetas,              setEtiquetas]             = useState<string[]>(producto?.etiquetas ?? []);
  const [ingredientesIds,        setIngredientesIds]       = useState<string[]>(producto?.ingredientes ?? []);
  const [deletingId,             setDeletingId]            = useState(false);

  // Track cleared image slots (to send empty url)
  const [clearedImages, setClearedImages] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (state?.success) router.push('/admin/inventario');
  }, [state, router]);

  async function handleDelete() {
    if (!producto || !confirm(`¿Eliminar "${producto.nombre}"? No se puede deshacer.`)) return;
    setDeletingId(true);
    await deleteProducto(producto.id);
    router.push('/admin/inventario');
  }

  function toggleEtiqueta(e: string) {
    setEtiquetas(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  }
  function toggleIngrediente(id: string) {
    setIngredientesIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const allImages = [
    producto?.imagen_url ?? null,
    ...(producto?.imagenes ?? []),
    null, null, null, null,
  ].slice(0, 4);

  const imageLabels = ['imagen principal', 'foto 2', 'foto 3', 'foto 4'];

  return (
    <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', padding: '32px 32px 120px' }}>
      {/* Back + header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/admin/inventario"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-soft)', textDecoration: 'none', marginBottom: 14 }}
        >
          <ChevronLeft style={{ width: 15, height: 15 }} />
          Volver a inventario
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, color: 'var(--ink)', margin: 0 }}>
          {isEditing ? 'Editar producto' : 'Nuevo producto'}
        </h1>
        {isEditing && (
          <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 4 }}>
            Editando &ldquo;{producto.nombre}&rdquo;
          </p>
        )}
      </div>

      <form action={formAction}>
        {/* Hidden state inputs */}
        <input type="hidden" name="disponible"             value={String(disponible)} />
        <input type="hidden" name="destacado_capricho"     value={String(destacadoCapricho)} />
        <input type="hidden" name="disponible_personaliza" value={String(disponiblePersonaliza)} />
        <input type="hidden" name="etiquetas"              value={etiquetas.join(',')} />
        <input type="hidden" name="ingredientes_ids"       value={ingredientesIds.join(',')} />
        {/* Existing image URLs (cleared ones send empty string) */}
        {allImages.map((url, i) => (
          <input key={i} type="hidden" name={`imagen_url_${i + 1}`} value={clearedImages[i + 1] ? '' : (url ?? '')} />
        ))}

        {state?.success === false && (
          <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderRadius: 'var(--r-md)', padding: '11px 14px', fontSize: 13, color: 'var(--berry)', marginBottom: 20 }}>
            {state.error}
          </div>
        )}

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Información básica */}
            <div style={T.card}>
              <p style={T.cardTitle}>Información básica</p>
              <p style={T.cardSub}>Lo esencial que aparece en la tarjeta del producto.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={T.label}>Nombre del producto</label>
                  <input name="nombre" required defaultValue={producto?.nombre} style={T.inp} onFocus={inpFocus} onBlur={inpBlur} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={T.label}>Categoría</label>
                    <select name="categoria" defaultValue={producto?.categoria ?? 'clasicas'} style={{ ...T.inp, appearance: 'auto' }} onFocus={inpFocus} onBlur={inpBlur}>
                      {categorias.map(c => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={T.label}>Precio</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--ink-soft)', pointerEvents: 'none' }}>L.</span>
                      <input name="precio" type="number" step="0.01" min="0.01" required defaultValue={producto?.precio}
                        style={{ ...T.inp, paddingLeft: 32 }} onFocus={inpFocus} onBlur={inpBlur} />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={T.label}>Tiempo de preparación <span style={{ fontWeight: 400, color: 'var(--ink-soft)' }}>(opcional)</span></label>
                  <input name="tiempo_preparacion" defaultValue={producto?.tiempo_preparacion ?? ''} placeholder="Ej. 24 horas de anticipación"
                    style={T.inp} onFocus={inpFocus} onBlur={inpBlur} />
                </div>

                <div>
                  <label style={T.label}>Descripción</label>
                  <textarea name="descripcion" rows={3} defaultValue={producto?.descripcion ?? ''}
                    style={{ ...T.inp, resize: 'vertical', minHeight: 88, lineHeight: 1.6 }} onFocus={inpFocus} onBlur={inpBlur} />
                </div>
              </div>
            </div>

            {/* Imágenes */}
            <div style={T.card}>
              <p style={T.cardTitle}>Imágenes</p>
              <p style={T.cardSub}>La primera se usa como portada en el menú. Arrastra para subir.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {allImages.map((url, i) => (
                  <ImageSlot
                    key={i}
                    label={imageLabels[i]}
                    name={`imagen_${i + 1}`}
                    existingUrl={url}
                    onClear={() => setClearedImages(prev => ({ ...prev, [i + 1]: true }))}
                  />
                ))}
              </div>
            </div>

            {/* Ingredientes */}
            {ingredientes.filter(ing => ing.activo).length > 0 && (
              <div style={T.card}>
                <p style={T.cardTitle}>Ingredientes disponibles</p>
                <p style={T.cardSub}>Selecciona los que aplican o se pueden agregar en &ldquo;Personaliza&rdquo;.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ingredientes.filter(ing => ing.activo).map(ing => {
                    const selected = ingredientesIds.includes(ing.id);
                    return (
                      <button
                        key={ing.id}
                        type="button"
                        onClick={() => toggleIngrediente(ing.id)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontSize: 13, fontWeight: 600, padding: '6px 13px',
                          borderRadius: 'var(--r-pill)', cursor: 'pointer', transition: '.14s',
                          border: `1.5px solid ${selected ? 'var(--orange)' : 'var(--hairline)'}`,
                          background: selected ? 'rgba(217,113,30,.08)' : 'var(--paper-card)',
                          color: selected ? 'var(--orange-ink)' : 'var(--ink)',
                        }}
                      >
                        {selected && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--orange)', flexShrink: 0 }} />}
                        {ing.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Etiquetas */}
            <div style={T.card}>
              <p style={T.cardTitle}>Etiquetas</p>
              <p style={T.cardSub}>Insignias que destacan el producto en el sitio.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ETIQUETAS.map(e => {
                  const selected = etiquetas.includes(e);
                  return (
                    <button
                      key={e}
                      type="button"
                      onClick={() => toggleEtiqueta(e)}
                      style={{
                        fontSize: 13, fontWeight: 600, padding: '7px 14px',
                        borderRadius: 'var(--r-pill)', cursor: 'pointer', transition: '.14s',
                        border: `1.5px solid ${selected ? 'var(--ink)' : 'var(--hairline)'}`,
                        background: selected ? 'var(--ink)' : 'var(--paper-card)',
                        color: selected ? '#fff' : 'var(--ink)',
                      }}
                    >
                      {e}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ── Right column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Publicación */}
            <div style={T.card}>
              <p style={T.cardTitle}>Publicación</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {([
                  { label: 'Activo en tienda', sub: 'Visible en el menú', value: disponible, set: setDisponible },
                  { label: 'Destacado en Capricho del Chef', sub: 'Aparece en la sección especial', value: destacadoCapricho, set: setDestacadoCapricho },
                  { label: 'Disponible en Personaliza', sub: 'Se puede armar a gusto', value: disponiblePersonaliza, set: setDisponiblePersonaliza },
                ] as const).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      padding: '14px 0', borderBottom: idx < 2 ? '1px solid var(--hairline)' : 'none',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '2px 0 0' }}>{item.sub}</p>
                    </div>
                    <ToggleSwitch checked={item.value} onChange={() => item.set((v: boolean) => !v)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Inventario */}
            <div style={T.card}>
              <p style={T.cardTitle}>Inventario</p>
              <p style={T.cardSub}>Controla el stock y la alerta.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={T.label}>Stock disponible</label>
                  <input name="stock" type="number" min="0" required defaultValue={producto?.stock ?? 0}
                    style={T.inp} onFocus={inpFocus} onBlur={inpBlur} />
                </div>
                <div>
                  <label style={T.label}>Alerta de stock bajo</label>
                  <input name="stock_alerta" type="number" min="0" defaultValue={producto?.stock_alerta ?? 5}
                    style={T.inp} onFocus={inpFocus} onBlur={inpBlur} />
                </div>
                <div>
                  <label style={T.label}>SKU <span style={{ fontWeight: 400, color: 'var(--ink-soft)' }}>(opcional)</span></label>
                  <input name="sku" defaultValue={producto?.sku ?? ''} placeholder="SKU-1001"
                    style={T.inp} onFocus={inpFocus} onBlur={inpBlur} />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Sticky bottom bar */}
        <div style={{
          position: 'sticky', bottom: 0, zIndex: 40, marginTop: 24,
          background: 'var(--paper-card)', borderTop: '1px solid var(--hairline)',
          padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <button
            type="submit"
            disabled={isPending}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14,
              padding: '10px 22px', borderRadius: 'var(--r-pill)', border: 'none', cursor: isPending ? 'not-allowed' : 'pointer',
              background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending && <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />}
            {isPending ? 'Guardando…' : '✓ Guardar producto'}
          </button>

          <Link
            href="/admin/inventario"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14,
              padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)',
              background: 'var(--paper-card)', color: 'var(--ink)', textDecoration: 'none', cursor: 'pointer',
            }}
          >
            Cancelar
          </Link>

          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deletingId}
              style={{
                marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8,
                fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)',
                border: '1.5px solid var(--berry)', background: 'rgba(158,59,70,.06)',
                color: 'var(--berry)', cursor: 'pointer',
              }}
            >
              {deletingId ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Trash2 style={{ width: 15, height: 15 }} />}
              Eliminar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
