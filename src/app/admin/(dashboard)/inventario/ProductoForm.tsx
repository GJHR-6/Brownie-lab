'use client';

import { useActionState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createProducto } from '@/actions/productos';
import type { ActionResult } from '@/types/actions';
import type { Producto } from '@/types/database';

const CATEGORIAS: { value: string; label: string }[] = [
  { value: 'clasicas', label: 'Clásicas' },
  { value: 'brownies', label: 'Brownies' },
  { value: 'especiales', label: 'Especiales' },
];

interface ProductoFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const INITIAL_STATE: ActionResult<Producto> | null = null;

export default function ProductoForm({ onSuccess, onCancel }: ProductoFormProps) {
  const [state, formAction, isPending] = useActionState(createProducto, INITIAL_STATE);

  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="px-6 py-5 space-y-4">
      {state?.success === false && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          name="nombre"
          required
          disabled={isPending}
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
          placeholder="Brownie de Nutella"
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Descripción</label>
        <textarea
          name="descripcion"
          rows={2}
          disabled={isPending}
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60 resize-none"
          placeholder="Descripción breve del producto"
        />
      </div>

      {/* Precio + Stock */}
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
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
            placeholder="55.00"
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
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
            placeholder="10"
          />
        </div>
      </div>

      {/* Categoría + Emoji */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Categoría</label>
          <select
            name="categoria"
            disabled={isPending}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60 bg-white"
          >
            {CATEGORIAS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Emoji</label>
          <input
            name="emoji"
            maxLength={4}
            disabled={isPending}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
            placeholder="🍫"
          />
        </div>
      </div>

      {/* Imagen */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Imagen del producto</label>
        <input
          name="imagen"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={isPending}
          className="w-full text-sm text-stone-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 transition-colors disabled:opacity-60"
        />
        <p className="text-xs text-stone-400 mt-1">PNG, JPG o WebP · Máx. 5 MB</p>
      </div>

      {/* Acciones */}
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
          {isPending ? 'Guardando…' : 'Guardar producto'}
        </button>
      </div>
    </form>
  );
}
