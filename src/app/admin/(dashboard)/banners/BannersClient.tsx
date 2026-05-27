'use client';

import { useState, useCallback, useTransition, useActionState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, X, Pencil } from 'lucide-react';
import { createBanner, updateBanner, toggleBanner, deleteBanner } from '@/actions/banners';
import type { Banner } from '@/types/database';

type ModalState = { open: false } | { open: true; modo: 'crear' } | { open: true; modo: 'editar'; banner: Banner };

function BannerForm({
  bannerInicial,
  onSuccess,
  onCancel,
}: {
  bannerInicial?: Banner;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEditing = !!bannerInicial;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const action = useMemo(() => isEditing ? updateBanner.bind(null, bannerInicial!.id) : createBanner, []);
  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => { if (state?.success) onSuccess(); }, [state, onSuccess]);

  return (
    <form action={formAction} className="px-6 py-5 space-y-4">
      {state?.success === false && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          Mensaje <span className="text-red-500">*</span>
        </label>
        <textarea name="mensaje" required rows={2} disabled={isPending}
          defaultValue={bannerInicial?.mensaje}
          placeholder="🎉 ¡Envío gratis en pedidos mayores a L.200!"
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60 resize-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Orden (menor = primero)</label>
        <input name="orden" type="number" min="0" disabled={isPending} defaultValue={bannerInicial?.orden ?? 0}
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60" />
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} disabled={isPending}
          className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-colors disabled:opacity-60">
          Cancelar
        </button>
        <button type="submit" disabled={isPending}
          className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear banner'}
        </button>
      </div>
    </form>
  );
}

export default function BannersClient({ initialBanners }: { initialBanners: Banner[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => { startTransition(() => { router.refresh(); }); }, [router]);

  async function handleToggle(id: string, current: boolean) {
    setTogglingId(id);
    await toggleBanner(id, !current);
    setTogglingId(null);
    refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este banner?')) return;
    setDeletingId(id);
    await deleteBanner(id);
    setDeletingId(null);
    refresh();
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Banners</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            Mensajes que aparecen en la parte superior del sitio.
            {isPending && <span className="ml-2 text-amber-600">Actualizando…</span>}
          </p>
        </div>
        <button onClick={() => setModal({ open: true, modo: 'crear' })}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" />Nuevo banner
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50 text-stone-600">
              <th className="text-left px-4 py-3 font-semibold">Mensaje</th>
              <th className="text-center px-4 py-3 font-semibold">Orden</th>
              <th className="text-center px-4 py-3 font-semibold">Activo</th>
              <th className="text-right px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {initialBanners.map((b) => (
              <tr key={b.id} className="hover:bg-stone-50/70 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-stone-800 max-w-md">{b.mensaje}</p>
                </td>
                <td className="px-4 py-3 text-center text-stone-500">{b.orden}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleToggle(b.id, b.activo)} disabled={togglingId === b.id} className="disabled:opacity-50">
                    {togglingId === b.id ? <Loader2 className="w-5 h-5 animate-spin text-stone-400 mx-auto" /> :
                      b.activo ? <ToggleRight className="w-7 h-7 text-green-500 mx-auto" /> :
                      <ToggleLeft className="w-7 h-7 text-stone-300 mx-auto" />}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => setModal({ open: true, modo: 'editar', banner: b })}
                      className="text-stone-300 hover:text-amber-600 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(b.id)} disabled={deletingId === b.id}
                      className="text-stone-300 hover:text-red-500 transition-colors disabled:opacity-50">
                      {deletingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {initialBanners.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-16 text-center text-stone-400">No hay banners. Agrega el primero.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModal({ open: false }); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-800">
                {modal.modo === 'crear' ? 'Nuevo banner' : 'Editar banner'}
              </h2>
              <button onClick={() => setModal({ open: false })} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <BannerForm
              bannerInicial={modal.modo === 'editar' ? modal.banner : undefined}
              onSuccess={() => { setModal({ open: false }); refresh(); }}
              onCancel={() => setModal({ open: false })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
