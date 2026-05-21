'use client';

import { useState, useCallback, useTransition, useActionState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, X, Pencil } from 'lucide-react';
import { createCategoria, updateCategoria, deleteCategoria } from '@/actions/categorias';
import type { Categoria } from '@/types/database';
import type { ActionResult } from '@/types/actions';

type ModalState = { open: false } | { open: true; modo: 'crear' } | { open: true; modo: 'editar'; categoria: Categoria };

function CategoriaForm({ categoriaInicial, onSuccess, onCancel }: {
  categoriaInicial?: Categoria; onSuccess: () => void; onCancel: () => void;
}) {
  const isEditing = !!categoriaInicial;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const action = useMemo(() => isEditing ? updateCategoria.bind(null, categoriaInicial!.id) : createCategoria, []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, formAction, isPending] = useActionState<ActionResult<Categoria> | null, FormData>(action as any, null);
  useEffect(() => { if (state?.success) onSuccess(); }, [state, onSuccess]);

  return (
    <form action={formAction} className="px-6 py-5 space-y-4">
      {state?.success === false && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Nombre <span className="text-red-500">*</span></label>
        <input name="nombre" required disabled={isPending} defaultValue={categoriaInicial?.nombre}
          placeholder="Postres de Temporada"
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60" />
      </div>
      {!isEditing && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Slug <span className="text-red-500">*</span></label>
          <input name="slug" required disabled={isPending} placeholder="postres-temporada"
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60 font-mono" />
          <p className="text-xs text-stone-400 mt-1">Solo letras, números y guiones. No cambia después de creado.</p>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Orden</label>
        <input name="orden" type="number" min="0" disabled={isPending} defaultValue={categoriaInicial?.orden ?? 0}
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60" />
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} disabled={isPending}
          className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-colors disabled:opacity-60">Cancelar</button>
        <button type="submit" disabled={isPending}
          className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? 'Guardando…' : isEditing ? 'Guardar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}

export default function CategoriasClient({ initialCategorias }: { initialCategorias: Categoria[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => { startTransition(() => { router.refresh(); }); }, [router]);

  async function handleDelete(id: string, slug: string, nombre: string) {
    if (!confirm(`¿Eliminar la categoría "${nombre}"?`)) return;
    setDeletingId(id); setDeleteError(null);
    const { deleteCategoria: del } = await import('@/actions/categorias');
    const result = await del(id, slug);
    if (!result.success) setDeleteError(result.error);
    setDeletingId(null);
    if (result.success) refresh();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Categorías</h1>
          <p className="text-stone-500 text-sm mt-0.5">Organización del menú público.{isPending && <span className="ml-2 text-amber-600">Actualizando…</span>}</p>
        </div>
        <button onClick={() => setModal({ open: true, modo: 'crear' })}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" />Nueva categoría
        </button>
      </div>

      {deleteError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{deleteError}</div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50 text-stone-600">
              <th className="text-left px-4 py-3 font-semibold">Nombre</th>
              <th className="text-left px-4 py-3 font-semibold">Slug</th>
              <th className="text-center px-4 py-3 font-semibold">Orden</th>
              <th className="text-right px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {initialCategorias.map((c) => (
              <tr key={c.id} className="hover:bg-stone-50/70 transition-colors">
                <td className="px-4 py-3 font-medium text-stone-800">{c.nombre}</td>
                <td className="px-4 py-3"><span className="font-mono text-xs bg-stone-100 px-2 py-0.5 rounded">{c.slug}</span></td>
                <td className="px-4 py-3 text-center text-stone-500">{c.orden}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => setModal({ open: true, modo: 'editar', categoria: c })}
                      className="text-stone-300 hover:text-amber-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c.id, c.slug, c.nombre)} disabled={deletingId === c.id}
                      className="text-stone-300 hover:text-red-500 transition-colors disabled:opacity-50">
                      {deletingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModal({ open: false }); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-800">
                {modal.modo === 'crear' ? 'Nueva categoría' : 'Editar categoría'}
              </h2>
              <button onClick={() => setModal({ open: false })} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
            </div>
            <CategoriaForm
              categoriaInicial={modal.modo === 'editar' ? modal.categoria : undefined}
              onSuccess={() => { setModal({ open: false }); refresh(); }}
              onCancel={() => setModal({ open: false })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
