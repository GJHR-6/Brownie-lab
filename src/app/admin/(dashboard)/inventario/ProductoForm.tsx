'use client';

import { useActionState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { createProducto, updateProducto } from '@/actions/productos';
import type { Producto, Categoria } from '@/types/database';

interface ProductoFormProps {
  productoInicial?: Producto;
  categorias: Categoria[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductoForm({ productoInicial, categorias, onSuccess, onCancel }: ProductoFormProps) {
  const isEditing = !!productoInicial;

  // bind evaluado solo en mount — form se desmonta al cerrar modal
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const action = useMemo(
    () => isEditing ? updateProducto.bind(null, productoInicial!.id) : createProducto,
    []
  );

  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="px-6 py-5 space-y-4">
      {isEditing && (
        <input type="hidden" name="imagen_url_actual" value={productoInicial.imagen_url ?? ''} />
      )}

      {state?.success === false && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          name="nombre"
          required
          disabled={isPending}
          defaultValue={productoInicial?.nombre}
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
          placeholder="Brownie de Nutella"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Descripción</label>
        <textarea
          name="descripcion"
          rows={2}
          disabled={isPending}
          defaultValue={productoInicial?.descripcion ?? ''}
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Precio HNL <span className="text-red-500">*</span>
          </label>
          <input
            name="precio"
            type="number"
            step="0.01"
            min="0.01"
            required
            disabled={isPending}
            defaultValue={productoInicial?.precio}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Stock <span className="text-red-500">*</span>
          </label>
          <input
            name="stock"
            type="number"
            min="0"
            required
            disabled={isPending}
            defaultValue={productoInicial?.stock}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Categoría</label>
          <select
            name="categoria"
            disabled={isPending}
            defaultValue={productoInicial?.categoria ?? 'clasicas'}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60 bg-white"
          >
            {categorias.map((c) => (
              <option key={c.slug} value={c.slug}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Emoji</label>
          <input
            name="emoji"
            maxLength={4}
            disabled={isPending}
            defaultValue={productoInicial?.emoji ?? ''}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
          />
        </div>
      </div>

      {/* Disponibilidad programada */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Disponible desde</label>
          <input name="disponible_desde" type="date" disabled={isPending}
            defaultValue={productoInicial?.disponible_desde ?? ''}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Disponible hasta</label>
          <input name="disponible_hasta" type="date" disabled={isPending}
            defaultValue={productoInicial?.disponible_hasta ?? ''}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60" />
        </div>
      </div>
      <p className="text-xs text-stone-400 -mt-2">Deja vacío para disponibilidad siempre activa.</p>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          {isEditing ? 'Cambiar imagen (opcional)' : 'Imagen del producto'}
        </label>
        {isEditing && productoInicial.imagen_url && (
          <div className="mb-2 w-16 h-16 rounded-lg overflow-hidden border border-stone-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={productoInicial.imagen_url} alt="actual" className="w-full h-full object-cover" />
          </div>
        )}
        <input
          name="imagen"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={isPending}
          className="w-full text-sm text-stone-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 transition-colors disabled:opacity-60"
        />
        <p className="text-xs text-stone-400 mt-1">PNG, JPG o WebP · Máx. 5 MB</p>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-colors disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Guardar producto'}
        </button>
      </div>
    </form>
  );
}
