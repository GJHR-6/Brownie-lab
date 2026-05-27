'use client';

import { useState, useCallback, useTransition, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, X } from 'lucide-react';
import { createPromocion, togglePromocion, deletePromocion } from '@/actions/promociones';
import type { Promocion } from '@/types/database';

function PromocionForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [state, formAction, isPending] = useActionState(createPromocion, null);
  useEffect(() => { if (state?.success) onSuccess(); }, [state, onSuccess]);

  return (
    <form action={formAction} className="px-6 py-5 space-y-4">
      {state?.success === false && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          Código <span className="text-red-500">*</span>
        </label>
        <input name="codigo" required disabled={isPending} placeholder="BROWNIE20"
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60 uppercase"
          style={{ textTransform: 'uppercase' }} />
        <p className="text-xs text-stone-400 mt-1">Se guardará en mayúsculas automáticamente.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Descuento % <span className="text-red-500">*</span>
          </label>
          <input name="descuento_porcentaje" type="number" min="1" max="100" required disabled={isPending} defaultValue={10}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Usos permitidos <span className="text-red-500">*</span>
          </label>
          <input name="usos_restantes" type="number" min="1" required disabled={isPending} defaultValue={1}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60" />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} disabled={isPending}
          className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-colors disabled:opacity-60">
          Cancelar
        </button>
        <button type="submit" disabled={isPending}
          className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? 'Creando…' : 'Crear código'}
        </button>
      </div>
    </form>
  );
}

export default function PromocionesClient({ initialPromociones }: { initialPromociones: Promocion[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => { startTransition(() => { router.refresh(); }); }, [router]);

  async function handleToggle(id: string, current: boolean) {
    setTogglingId(id);
    await togglePromocion(id, !current);
    setTogglingId(null);
    refresh();
  }

  async function handleDelete(id: string, codigo: string) {
    if (!confirm(`¿Eliminar el código "${codigo}"?`)) return;
    setDeletingId(id);
    await deletePromocion(id);
    setDeletingId(null);
    refresh();
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Promociones</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            Códigos de descuento para tus clientes.
            {isPending && <span className="ml-2 text-amber-600">Actualizando…</span>}
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" />Nuevo código
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50 text-stone-600">
              <th className="text-left px-4 py-3 font-semibold">Código</th>
              <th className="text-center px-4 py-3 font-semibold">Descuento</th>
              <th className="text-center px-4 py-3 font-semibold">Usos restantes</th>
              <th className="text-center px-4 py-3 font-semibold">Activa</th>
              <th className="text-right px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {initialPromociones.map((p) => (
              <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-xs">
                    {p.codigo}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-semibold text-green-600">{p.descuento_porcentaje}%</td>
                <td className="px-4 py-3 text-center">
                  <span className={p.usos_restantes === 0 ? 'text-red-500 font-bold' : 'text-stone-600'}>
                    {p.usos_restantes}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleToggle(p.id, p.activa)} disabled={togglingId === p.id} className="disabled:opacity-50">
                    {togglingId === p.id ? <Loader2 className="w-5 h-5 animate-spin text-stone-400 mx-auto" /> :
                      p.activa ? <ToggleRight className="w-7 h-7 text-green-500 mx-auto" /> :
                      <ToggleLeft className="w-7 h-7 text-stone-300 mx-auto" />}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(p.id, p.codigo)} disabled={deletingId === p.id}
                    className="text-stone-300 hover:text-red-500 transition-colors disabled:opacity-50">
                    {deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
            {initialPromociones.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-16 text-center text-stone-400">No hay códigos. Crea el primero.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-800">Nuevo código de descuento</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <PromocionForm
              onSuccess={() => { setIsModalOpen(false); refresh(); }}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
