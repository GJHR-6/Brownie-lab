'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, X, Pencil } from 'lucide-react';
import { deleteProducto, toggleDisponible } from '@/actions/productos';
import ProductoForm from './ProductoForm';
import type { Producto, Categoria } from '@/types/database';

interface InventarioClientProps {
  initialProducts: Producto[];
  categorias: Categoria[];
}

export default function InventarioClient({ initialProducts, categorias }: InventarioClientProps) {
  const router = useRouter();
  type ModalState = { open: false } | { open: true; modo: 'crear' } | { open: true; modo: 'editar'; producto: Producto };
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => { router.refresh(); });
  }, [router]);

  const handleSuccess = useCallback(() => {
    setModal({ open: false });
    refresh();
  }, [refresh]);

  async function handleToggle(id: string, current: boolean) {
    setTogglingId(id);
    await toggleDisponible(id, !current);
    setTogglingId(null);
    refresh();
  }

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    await deleteProducto(id);
    setDeletingId(null);
    refresh();
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Inventario</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {initialProducts.length} {initialProducts.length === 1 ? 'producto' : 'productos'}
            {isPending && <span className="ml-2 text-amber-600">Actualizando…</span>}
          </p>
        </div>
        <button
          onClick={() => setModal({ open: true, modo: 'crear' })}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-stone-600">
                <th className="text-left px-4 py-3 font-semibold">Producto</th>
                <th className="text-left px-4 py-3 font-semibold">Categoría</th>
                <th className="text-right px-4 py-3 font-semibold">Precio</th>
                <th className="text-right px-4 py-3 font-semibold">Stock</th>
                <th className="text-center px-4 py-3 font-semibold">Disponible</th>
                <th className="text-right px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {initialProducts.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                  {/* Producto */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-amber-100">
                        {p.imagen_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{p.emoji ?? '🍫'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-stone-800 truncate">{p.nombre}</p>
                        {p.descripcion && (
                          <p className="text-xs text-stone-400 truncate max-w-[220px]">{p.descripcion}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Categoría */}
                  <td className="px-4 py-3">
                    <span className="inline-block text-xs bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 capitalize font-medium">
                      {p.categoria}
                    </span>
                  </td>

                  {/* Precio */}
                  <td className="px-4 py-3 text-right font-semibold text-stone-800">
                    L. {p.precio.toFixed(2)}
                  </td>

                  {/* Stock */}
                  <td className="px-4 py-3 text-right">
                    <span className={p.stock <= 5 ? 'text-red-500 font-bold' : 'text-stone-600'}>
                      {p.stock}
                    </span>
                  </td>

                  {/* Toggle disponible */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(p.id, p.disponible)}
                      disabled={togglingId === p.id}
                      aria-label={p.disponible ? 'Deshabilitar producto' : 'Habilitar producto'}
                      className="disabled:opacity-50 transition-opacity"
                    >
                      {togglingId === p.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-stone-400 mx-auto" />
                      ) : p.disponible ? (
                        <ToggleRight className="w-7 h-7 text-green-500 mx-auto" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-stone-300 mx-auto" />
                      )}
                    </button>
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setModal({ open: true, modo: 'editar', producto: p })}
                        aria-label="Editar producto"
                        className="text-stone-300 hover:text-amber-600 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.nombre)}
                        disabled={deletingId === p.id}
                        aria-label="Eliminar producto"
                        className="text-stone-300 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {deletingId === p.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {initialProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-stone-400">
                    No hay productos aún. Agrega el primero.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear / editar */}
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModal({ open: false }); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-800">
                {modal.modo === 'crear' ? 'Nuevo producto' : 'Editar producto'}
              </h2>
              <button
                onClick={() => setModal({ open: false })}
                className="text-stone-400 hover:text-stone-600 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ProductoForm
              productoInicial={modal.modo === 'editar' ? modal.producto : undefined}
              categorias={categorias}
              onSuccess={handleSuccess}
              onCancel={() => setModal({ open: false })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
