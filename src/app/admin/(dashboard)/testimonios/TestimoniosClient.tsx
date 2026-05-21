'use client';

import { useState, useCallback, useTransition, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, X } from 'lucide-react';
import { createTestimonio, toggleAprobado, deleteTestimonio } from '@/actions/testimonios';
import type { Testimonio } from '@/actions/testimonios';
import type { ActionResult } from '@/types/actions';

function TestimonioForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [state, formAction, isPending] = useActionState<ActionResult<Testimonio> | null, FormData>(createTestimonio as any, null);
  useEffect(() => { if (state?.success) onSuccess(); }, [state, onSuccess]);

  return (
    <form action={formAction} className="px-6 py-5 space-y-4">
      {state?.success === false && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Autor <span className="text-red-500">*</span></label>
        <input name="autor" required disabled={isPending} placeholder="María López"
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60" />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Texto <span className="text-red-500">*</span></label>
        <textarea name="texto" required rows={3} disabled={isPending} placeholder="Excelentes brownies, los mejores que he probado..."
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60 resize-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Estrellas</label>
        <select name="estrellas" defaultValue="5" disabled={isPending}
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60 bg-white">
          {[5,4,3,2,1].map(n => <option key={n} value={n}>{'⭐'.repeat(n)} ({n})</option>)}
        </select>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} disabled={isPending}
          className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-colors disabled:opacity-60">Cancelar</button>
        <button type="submit" disabled={isPending}
          className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? 'Guardando…' : 'Agregar'}
        </button>
      </div>
    </form>
  );
}

export default function TestimoniosClient({ initialTestimonios }: { initialTestimonios: Testimonio[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => { startTransition(() => { router.refresh(); }); }, [router]);

  async function handleToggle(id: string, current: boolean) {
    setTogglingId(id);
    await toggleAprobado(id, !current);
    setTogglingId(null);
    refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este testimonio?')) return;
    setDeletingId(id);
    await deleteTestimonio(id);
    setDeletingId(null);
    refresh();
  }

  const aprobados = initialTestimonios.filter(t => t.aprobado).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Testimonios</h1>
          <p className="text-stone-500 text-sm mt-0.5">{aprobados} aprobados · {initialTestimonios.length} total{isPending && <span className="ml-2 text-amber-600">Actualizando…</span>}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" />Agregar testimonio
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50 text-stone-600">
              <th className="text-left px-4 py-3 font-semibold">Autor</th>
              <th className="text-left px-4 py-3 font-semibold">Testimonio</th>
              <th className="text-center px-4 py-3 font-semibold">⭐</th>
              <th className="text-center px-4 py-3 font-semibold">Visible</th>
              <th className="text-right px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {initialTestimonios.map((t) => (
              <tr key={t.id} className="hover:bg-stone-50/70 transition-colors">
                <td className="px-4 py-3 font-medium text-stone-800 whitespace-nowrap">{t.autor}</td>
                <td className="px-4 py-3 text-stone-500 max-w-xs truncate">{t.texto}</td>
                <td className="px-4 py-3 text-center">{'⭐'.repeat(t.estrellas)}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleToggle(t.id, t.aprobado)} disabled={togglingId === t.id} className="disabled:opacity-50">
                    {togglingId === t.id ? <Loader2 className="w-5 h-5 animate-spin text-stone-400 mx-auto" /> :
                      t.aprobado ? <ToggleRight className="w-7 h-7 text-green-500 mx-auto" /> :
                      <ToggleLeft className="w-7 h-7 text-stone-300 mx-auto" />}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id}
                    className="text-stone-300 hover:text-red-500 transition-colors disabled:opacity-50">
                    {deletingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
            {initialTestimonios.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-16 text-center text-stone-400">No hay testimonios aún.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-800">Nuevo testimonio</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
            </div>
            <TestimonioForm onSuccess={() => { setIsModalOpen(false); refresh(); }} onCancel={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
