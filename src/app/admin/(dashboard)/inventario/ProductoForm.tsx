'use client';

import { useActionState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { createProducto, updateProducto } from '@/actions/productos';
import type { Producto, Categoria } from '@/types/database';

const T = {
  inp: { width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' },
  btnPrimary: { display: 'inline-flex' as const, alignItems: 'center' as const, gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer' as const, background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', transition: '.16s' },
  btnGhost: { display: 'inline-flex' as const, alignItems: 'center' as const, gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)', cursor: 'pointer' as const, background: 'var(--paper-card)', color: 'var(--ink)', transition: '.16s' },
};

function fg(label: React.ReactNode, field: React.ReactNode) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{label}</label>
      {field}
    </div>
  );
}

function inpFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--orange)';
  e.target.style.background = '#fff';
}
function inpBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--hairline)';
  e.target.style.background = 'var(--paper)';
}

interface ProductoFormProps {
  productoInicial?: Producto;
  categorias: Categoria[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductoForm({ productoInicial, categorias, onSuccess, onCancel }: ProductoFormProps) {
  const isEditing = !!productoInicial;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const action = useMemo(() => isEditing ? updateProducto.bind(null, productoInicial!.id) : createProducto, []);
  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => { if (state?.success) onSuccess(); }, [state, onSuccess]);

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
      {isEditing && <input type="hidden" name="imagen_url_actual" value={productoInicial.imagen_url ?? ''} />}

      {state?.success === false && (
        <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderRadius: 'var(--r-md)', padding: '11px 14px', fontSize: 13, color: 'var(--berry)' }}>
          {state.error}
        </div>
      )}

      {fg(<>Nombre <span style={{ color: 'var(--berry)' }}>*</span></>,
        <input name="nombre" required disabled={isPending} defaultValue={productoInicial?.nombre}
          placeholder="Brownie de Nutella"
          style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }}
          onFocus={inpFocus} onBlur={inpBlur} />
      )}

      {fg('Descripción',
        <textarea name="descripcion" rows={2} disabled={isPending} defaultValue={productoInicial?.descripcion ?? ''}
          style={{ ...T.inp, resize: 'vertical', minHeight: 80, lineHeight: 1.6, opacity: isPending ? 0.6 : 1 }}
          onFocus={inpFocus} onBlur={inpBlur} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {fg(<>Precio HNL <span style={{ color: 'var(--berry)' }}>*</span></>,
          <input name="precio" type="number" step="0.01" min="0.01" required disabled={isPending} defaultValue={productoInicial?.precio}
            style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        )}
        {fg(<>Stock <span style={{ color: 'var(--berry)' }}>*</span></>,
          <input name="stock" type="number" min="0" required disabled={isPending} defaultValue={productoInicial?.stock}
            style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {fg('Categoría',
          <select name="categoria" disabled={isPending} defaultValue={productoInicial?.categoria ?? 'clasicas'}
            style={{ ...T.inp, appearance: 'auto', opacity: isPending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur}>
            {categorias.map(c => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}
          </select>
        )}
        {fg('Emoji',
          <input name="emoji" maxLength={4} disabled={isPending} defaultValue={productoInicial?.emoji ?? ''}
            style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {fg('Disponible desde',
          <input name="disponible_desde" type="date" disabled={isPending} defaultValue={productoInicial?.disponible_desde ?? ''}
            style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        )}
        {fg('Disponible hasta',
          <input name="disponible_hasta" type="date" disabled={isPending} defaultValue={productoInicial?.disponible_hasta ?? ''}
            style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
        )}
      </div>
      <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: -12 }}>Deja vacío para disponibilidad siempre activa.</p>

      {fg(
        isEditing ? 'Cambiar imagen (opcional)' : 'Imagen del producto',
        <div>
          {isEditing && productoInicial.imagen_url && (
            <div style={{ marginBottom: 8, width: 56, height: 56, borderRadius: 11, overflow: 'hidden', border: '1px solid var(--hairline)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={productoInicial.imagen_url} alt="actual" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <input name="imagen" type="file" accept="image/png,image/jpeg,image/webp" disabled={isPending}
            style={{ width: '100%', fontSize: 13, color: 'var(--ink-soft)' }} />
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6 }}>PNG, JPG o WebP · Máx. 5 MB</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid var(--hairline)', marginTop: 4 }}>
        <button type="button" onClick={onCancel} disabled={isPending} style={{ ...T.btnGhost, flex: 1, justifyContent: 'center' }}>Cancelar</button>
        <button type="submit" disabled={isPending} style={{ ...T.btnPrimary, flex: 1, justifyContent: 'center', opacity: isPending ? 0.7 : 1 }}>
          {isPending && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
          {isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Guardar producto'}
        </button>
      </div>
    </form>
  );
}
