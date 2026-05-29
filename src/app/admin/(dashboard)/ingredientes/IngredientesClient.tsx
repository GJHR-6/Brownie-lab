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

// ── Form ──────────────────────────────────────────────────────────────────────

function IngredienteForm({
  inicial,
  onSuccess,
  onCancel,
}: {
  inicial?: Ingrediente;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!inicial;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const boundAction = useMemo(
    () => isEdit ? updateIngrediente.bind(null, inicial.id) : createIngrediente,
    []
  );

  const [state, formAction, pending] = useActionState(boundAction, null);

  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="px-6 py-4 space-y-4">
      {state && !state.success && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-stone-600 mb-1">Nombre *</label>
          <input
            name="nombre"
            defaultValue={inicial?.nombre}
            required
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-semibold text-stone-600 mb-1">Descripción del paquete</label>
          <input
            name="descripcion_paquete"
            defaultValue={inicial?.descripcion_paquete ?? ''}
            placeholder="Ej: Bolsa 1800g, Cartón 30 unidades"
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Unidad de medida *</label>
          <select
            name="unidad"
            defaultValue={inicial?.unidad ?? 'g'}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Tamaño del paquete *</label>
          <input
            name="tamano_paquete"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={inicial?.tamano_paquete}
            required
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Costo del paquete (L.) *</label>
          <input
            name="costo_paquete"
            type="number"
            step="0.01"
            min="0"
            defaultValue={inicial?.costo_paquete}
            required
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Stock (paquetes)</label>
          <input
            name="stock_paquetes"
            type="number"
            step="0.5"
            min="0"
            defaultValue={inicial?.stock_paquetes ?? 0}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Cantidad por bandeja</label>
          <input
            name="cantidad_por_bandeja"
            type="number"
            step="0.01"
            min="0"
            defaultValue={inicial?.cantidad_por_bandeja ?? ''}
            placeholder="En la misma unidad"
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Costo por bandeja (L.)</label>
          <input
            name="costo_por_bandeja"
            type="number"
            step="0.01"
            min="0"
            defaultValue={inicial?.costo_por_bandeja ?? ''}
            placeholder="Calculado o manual"
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="col-span-2 flex gap-4 items-center">
          <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer select-none">
            <input
              type="checkbox"
              name="es_topping"
              value="true"
              defaultChecked={inicial?.es_topping ?? false}
              className="rounded accent-amber-500"
            />
            Es topping
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer select-none">
            <input
              type="checkbox"
              name="activo"
              value="true"
              defaultChecked={inicial?.activo ?? true}
              className="rounded accent-amber-500"
            />
            Activo
          </label>
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-semibold text-stone-600 mb-1">Notas</label>
          <textarea
            name="notas"
            rows={2}
            defaultValue={inicial?.notas ?? ''}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? 'Guardar cambios' : 'Crear ingrediente'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm text-stone-600 hover:bg-stone-100 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── Summary cards ─────────────────────────────────────────────────────────────

function ResumenCostos({ ingredientes }: { ingredientes: Ingrediente[] }) {
  const totalBandeja = ingredientes
    .filter((i) => i.activo && i.costo_por_bandeja !== null)
    .reduce((sum, i) => sum + (i.costo_por_bandeja ?? 0), 0);

  const costoPorUnidad = totalBandeja / PORCIONES_POR_BANDEJA;
  const margenBajo = PRECIO_VENTA_BAJO - costoPorUnidad;
  const margenAlto = PRECIO_VENTA_ALTO - costoPorUnidad;

  const cards = [
    {
      label: 'Costo por bandeja',
      value: `L. ${totalBandeja.toFixed(2)}`,
      sub: `${PORCIONES_POR_BANDEJA} porciones`,
      icon: FlaskConical,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Costo por unidad',
      value: `L. ${costoPorUnidad.toFixed(2)}`,
      sub: 'ingredientes solamente',
      icon: Package,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: `Margen a L. ${PRECIO_VENTA_BAJO}`,
      value: `L. ${margenBajo.toFixed(2)}`,
      sub: `${((margenBajo / PRECIO_VENTA_BAJO) * 100).toFixed(0)}% de margen`,
      icon: TrendingUp,
      color: margenBajo > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600',
    },
    {
      label: `Margen a L. ${PRECIO_VENTA_ALTO}`,
      value: `L. ${margenAlto.toFixed(2)}`,
      sub: `${((margenAlto / PRECIO_VENTA_ALTO) * 100).toFixed(0)}% de margen`,
      icon: ShoppingBag,
      color: margenAlto > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map(({ label, value, sub, icon: Icon, color }) => (
        <div key={label} className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2 ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <p className="text-xs text-stone-500 font-medium">{label}</p>
          <p className="text-lg font-bold text-stone-800 mt-0.5">{value}</p>
          <p className="text-xs text-stone-400 mt-0.5">{sub}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Filtro = 'todos' | 'base' | 'toppings';

interface Props { initialIngredientes: Ingrediente[] }

export default function IngredientesClient({ initialIngredientes }: Props) {
  const router = useRouter();
  type ModalState = { open: false } | { open: true; modo: 'crear' } | { open: true; modo: 'editar'; ingrediente: Ingrediente };

  const [modal, setModal] = useState<ModalState>({ open: false });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => { router.refresh(); });
  }, [router]);

  const handleSuccess = useCallback(() => {
    setModal({ open: false });
    refresh();
  }, [refresh]);

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    await deleteIngrediente(id);
    setDeletingId(null);
    refresh();
  }

  const filtered = initialIngredientes.filter((i) => {
    if (filtro === 'base') return !i.es_topping;
    if (filtro === 'toppings') return i.es_topping;
    return true;
  });

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Ingredientes</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {initialIngredientes.length} ingredientes registrados
            {isPending && <span className="ml-2 text-amber-600">Actualizando…</span>}
          </p>
        </div>
        <button
          onClick={() => setModal({ open: true, modo: 'crear' })}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo ingrediente
        </button>
      </div>

      {/* Resumen costos */}
      <ResumenCostos ingredientes={initialIngredientes} />

      {/* Filtro tabs */}
      <div className="flex gap-1 mb-4">
        {(['todos', 'base', 'toppings'] as Filtro[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              filtro === f
                ? 'bg-amber-700 text-white'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
            }`}
          >
            {f === 'todos' ? 'Todos' : f === 'base' ? 'Receta base' : 'Toppings'}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-stone-600">
                <th className="text-left px-4 py-3 font-semibold">Ingrediente</th>
                <th className="text-left px-4 py-3 font-semibold">Paquete</th>
                <th className="text-right px-4 py-3 font-semibold">Costo pkg.</th>
                <th className="text-right px-4 py-3 font-semibold">Costo/unidad</th>
                <th className="text-right px-4 py-3 font-semibold">Costo/bandeja</th>
                <th className="text-right px-4 py-3 font-semibold">Stock</th>
                <th className="text-center px-4 py-3 font-semibold">Tipo</th>
                <th className="text-right px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((i) => (
                <tr key={i.id} className={`hover:bg-stone-50/70 transition-colors ${!i.activo ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-800">{i.nombre}</p>
                    {i.notas && <p className="text-xs text-stone-400 max-w-[200px] truncate">{i.notas}</p>}
                  </td>

                  <td className="px-4 py-3 text-stone-500">
                    {i.descripcion_paquete ?? '—'}
                    {i.cantidad_por_bandeja !== null && (
                      <p className="text-xs text-stone-400">{i.cantidad_por_bandeja} {i.unidad} por bandeja</p>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right font-medium text-stone-700">
                    L. {i.costo_paquete.toFixed(2)}
                  </td>

                  <td className="px-4 py-3 text-right text-stone-500 text-xs">
                    {i.costo_por_unidad != null
                      ? `L. ${Number(i.costo_por_unidad).toFixed(4)}/${i.unidad}`
                      : '—'}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {i.costo_por_bandeja != null ? (
                      <span className="font-semibold text-amber-700">L. {Number(i.costo_por_bandeja).toFixed(2)}</span>
                    ) : (
                      <span className="text-stone-300">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <span className={i.stock_paquetes === 0 ? 'text-red-500 font-bold' : i.stock_paquetes <= 2 ? 'text-amber-500 font-semibold' : 'text-stone-600'}>
                      {i.stock_paquetes}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block text-xs rounded-full px-2.5 py-0.5 font-medium ${
                      i.es_topping
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {i.es_topping ? 'Topping' : 'Base'}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setModal({ open: true, modo: 'editar', ingrediente: i })}
                        aria-label="Editar"
                        className="text-stone-300 hover:text-amber-600 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(i.id, i.nombre)}
                        disabled={deletingId === i.id}
                        aria-label="Eliminar"
                        className="text-stone-300 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {deletingId === i.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-stone-400">
                    No hay ingredientes en esta categoría.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Nota empaques */}
        <div className="border-t border-stone-100 px-4 py-3 bg-amber-50/50">
          <p className="text-xs text-amber-700">
            <strong>Nota:</strong> el costo de empaques no está incluido en el resumen. Estimado: ~L17 por bandeja (L1.90/unidad).
          </p>
        </div>
      </div>

      {/* Modal crear / editar */}
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModal({ open: false }); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-stone-800">
                {modal.modo === 'crear' ? 'Nuevo ingrediente' : 'Editar ingrediente'}
              </h2>
              <button
                onClick={() => setModal({ open: false })}
                className="text-stone-400 hover:text-stone-600 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
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
