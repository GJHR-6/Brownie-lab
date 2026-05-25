'use client';

import { useActionState } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { updateConfiguracion } from '@/actions/configuracion';
import type { Configuracion } from '@/types/database';

interface ConfiguracionClientProps {
  config: Configuracion;
}

export default function ConfiguracionClient({ config }: ConfiguracionClientProps) {
  const [state, formAction, isPending] = useActionState(updateConfiguracion, null);

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Configuración</h1>
        <p className="text-stone-500 text-sm mt-0.5">Datos generales de la tienda.</p>
      </div>

      {state?.success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-green-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Configuración guardada exitosamente.
        </div>
      )}
      {state?.success === false && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}

      <form action={formAction} className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">

        {/* Sección: Identidad */}
        <div className="px-6 py-5">
          <h2 className="font-semibold text-stone-700 mb-4 text-sm uppercase tracking-wide">Identidad</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Nombre de la tienda <span className="text-red-500">*</span>
              </label>
              <input name="nombre" required disabled={isPending} defaultValue={config.nombre}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Tagline</label>
              <input name="tagline" disabled={isPending} defaultValue={config.tagline}
                placeholder="Horneado con amor, cada galleta cuenta"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Descripción</label>
              <textarea name="descripcion" rows={2} disabled={isPending} defaultValue={config.descripcion ?? ''}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60 resize-none" />
            </div>
          </div>
        </div>

        {/* Sección: Contacto */}
        <div className="px-6 py-5">
          <h2 className="font-semibold text-stone-700 mb-4 text-sm uppercase tracking-wide">Contacto</h2>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              WhatsApp <span className="text-red-500">*</span>
            </label>
            <input name="whatsapp" required disabled={isPending} defaultValue={config.whatsapp}
              placeholder="50431534704"
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60" />
            <p className="text-xs text-stone-400 mt-1">Código de país + número, sin espacios. Ej: 50431534704</p>
          </div>
        </div>

        {/* Sección: Redes sociales */}
        <div className="px-6 py-5">
          <h2 className="font-semibold text-stone-700 mb-4 text-sm uppercase tracking-wide">Redes sociales</h2>
          <div className="space-y-4">
            {[
              { name: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/brownielab' },
              { name: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/brownielab' },
              { name: 'tiktok',   label: 'TikTok',    placeholder: 'https://tiktok.com/@brownielab' },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">{label}</label>
                <input name={name} disabled={isPending}
                  defaultValue={(config[name as keyof typeof config] as string) ?? ''}
                  placeholder={placeholder}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60" />
              </div>
            ))}
            <p className="text-xs text-stone-400">Deja en blanco para ocultar en el sitio.</p>
          </div>
        </div>

        {/* Sección: Datos bancarios */}
        <div className="px-6 py-5">
          <h2 className="font-semibold text-stone-700 mb-1 text-sm uppercase tracking-wide">Datos bancarios</h2>
          <p className="text-xs text-stone-400 mb-4">Se muestran al cliente cuando elige pago por transferencia.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Banco</label>
              <input name="banco_nombre" disabled={isPending} defaultValue={config.banco_nombre}
                placeholder="BAC Honduras"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Nombre del titular</label>
              <input name="banco_titular" disabled={isPending} defaultValue={config.banco_titular}
                placeholder="María García"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Número de cuenta</label>
              <input name="banco_numero" disabled={isPending} defaultValue={config.banco_numero}
                placeholder="1234-5678-9012"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60" />
            </div>
          </div>
        </div>

        {/* Guardar */}
        <div className="px-6 py-5 flex justify-end">
          <button type="submit" disabled={isPending}
            className="bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white px-8 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      <p className="text-xs text-stone-400 mt-4">
        * El nombre de la tienda en el menú de navegación y los botones de WhatsApp del carrito y personalizador
        siguen la configuración del código por ahora.
      </p>
    </div>
  );
}
