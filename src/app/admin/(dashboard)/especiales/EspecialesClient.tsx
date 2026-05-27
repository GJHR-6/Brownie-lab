'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, X } from 'lucide-react';
import { useActionState, useEffect } from 'react';
import { createEspecial, toggleEspecial, deleteEspecial } from '@/actions/especiales';
import type { Especial } from '@/types/database';

function getDiasRestantes(fechaInicio: string, duracionDias: number): number {
  const end = new Date(fechaInicio);
  end.setDate(end.getDate() + duracionDias);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function EspecialForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [state, formAction, isPending] = useActionState(createEspecial, null);
  const today = new Date().toISOString().split('T')[0];

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

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input name="nombre" required disabled={isPending}
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
          placeholder="Brownie de Matcha" />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          Descripción <span className="text-red-500">*</span>
        </label>
        <textarea name="descripcion" required rows={2} disabled={isPending}
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60 resize-none"
          placeholder="Brownie experimental con matcha japonés y frambuesa." />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Emoji</label>
          <input name="emoji" maxLength={4} disabled={isPending} defaultValue="🍪"
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Fecha inicio</label>
          <input name="fecha_inicio" type="date" disabled={isPending} defaultValue={today}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Días <span className="text-red-500">*</span>
          </label>
          <input name="duracion_dias" type="number" min="1" required disabled={isPending} defaultValue={7}
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
          {isPending ? 'Guardando…' : 'Crear especial'}
        </button>
      </div>
    </form>
  );
}

interface EspecialesClientProps {
  initialEspeciales: Especial[];
}

export default function EspecialesClient({ initialEspeciales }: EspecialesClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => { router.refresh(); });
  }, [router]);

  async function handleToggle(id: string, current: boolean) {
    setTogglingId(id);
    await toggleEspecial(id, !current);
    setTogglingId(null);
    refresh();
  }

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    setDeletingId(id);
    await deleteEspecial(id);
    setDeletingId(null);
    refresh();
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Capricho del Chef</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {initialEspeciales.length} {initialEspeciales.length === 1 ? 'especial' : 'especiales'}
            {isPending && <span className="ml-2 text-amber-600">Actualizando…</span>}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo especial
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-stone-600">
                <th className="text-left px-4 py-3 font-semibold">Especial</th>
                <th className="text-left px-4 py-3 font-semibold">Fecha inicio</th>
                <th className="text-center px-4 py-3 font-semibold">Duración</th>
                <th className="text-center px-4 py-3 font-semibold">Días restantes</th>
                <th className="text-center px-4 py-3 font-semibold">Activo</th>
                <th className="text-right px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {initialEspeciales.map((e) => {
                const dias = getDiasRestantes(e.fecha_inicio, e.duracion_dias);
                const expirado = dias === 0;
                return (
                  <tr key={e.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{e.emoji}</span>
                        <div>
                          <p className="font-medium text-stone-800">{e.nombre}</p>
                          <p className="text-xs text-stone-400 max-w-[240px] truncate">{e.descripcion}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-500">{e.fecha_inicio}</td>
                    <td className="px-4 py-3 text-center text-stone-500">{e.duracion_dias} días</td>
                    <td className="px-4 py-3 text-center">
                      {expirado ? (
                        <span className="text-xs bg-stone-100 text-stone-500 rounded-full px-2 py-0.5 font-medium">Expirado</span>
                      ) : (
                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${dias <= 2 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                          {dias} {dias === 1 ? 'día' : 'días'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggle(e.id, e.activo)}
                        disabled={togglingId === e.id}
                        className="disabled:opacity-50 transition-opacity"
                      >
                        {togglingId === e.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-stone-400 mx-auto" />
                        ) : e.activo ? (
                          <ToggleRight className="w-7 h-7 text-green-500 mx-auto" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-stone-300 mx-auto" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(e.id, e.nombre)}
                        disabled={deletingId === e.id}
                        className="text-stone-300 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {deletingId === e.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {initialEspeciales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-stone-400">
                    No hay especiales. Agrega el primero.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-800">Nuevo especial del chef</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <EspecialForm
              onSuccess={() => { setIsModalOpen(false); refresh(); }}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
