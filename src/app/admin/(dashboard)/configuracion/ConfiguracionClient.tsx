'use client';

import { useActionState } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { updateConfiguracion } from '@/actions/configuracion';
import type { Configuracion } from '@/types/database';

const T = {
  inp: { width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' },
  btnPrimary: { display: 'inline-flex' as const, alignItems: 'center' as const, gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer' as const, background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', transition: '.16s' },
};

function inpFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--orange)';
  e.target.style.background = '#fff';
}
function inpBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--hairline)';
  e.target.style.background = 'var(--paper)';
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 18, marginTop: 0 }}>
      {children}
    </p>
  );
}

export default function ConfiguracionClient({ config }: { config: Configuracion }) {
  const [state, formAction, isPending] = useActionState(updateConfiguracion, null);

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[860px] w-full">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>
          Configuración
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>Datos generales de la tienda.</p>
      </div>

      {state?.success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#d8f0e2', border: '1px solid #a5d6b8', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 14, color: '#157a4d', marginBottom: 20 }}>
          <CheckCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
          Configuración guardada exitosamente.
        </div>
      )}
      {state?.success === false && (
        <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 14, color: 'var(--berry)', marginBottom: 20 }}>
          {state.error}
        </div>
      )}

      <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 0, background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>

        {/* Identidad */}
        <div style={{ padding: '24px 26px', borderBottom: '1px solid var(--hairline)' }}>
          <SectionTitle>Identidad</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Nombre de la tienda <span style={{ color: 'var(--berry)' }}>*</span></label>
              <input name="nombre" required disabled={isPending} defaultValue={config.nombre}
                style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Tagline</label>
              <input name="tagline" disabled={isPending} defaultValue={config.tagline}
                placeholder="Horneado con amor, cada galleta cuenta"
                style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Descripción</label>
              <textarea name="descripcion" rows={2} disabled={isPending} defaultValue={config.descripcion ?? ''}
                style={{ ...T.inp, resize: 'vertical', minHeight: 80, lineHeight: 1.6, opacity: isPending ? 0.6 : 1 }}
                onFocus={inpFocus} onBlur={inpBlur} />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div style={{ padding: '24px 26px', borderBottom: '1px solid var(--hairline)' }}>
          <SectionTitle>Contacto</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>WhatsApp <span style={{ color: 'var(--berry)' }}>*</span></label>
            <input name="whatsapp" required disabled={isPending} defaultValue={config.whatsapp}
              placeholder="50431534704"
              style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
            <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Código de país + número, sin espacios. Ej: 50431534704</p>
          </div>
        </div>

        {/* Redes sociales */}
        <div style={{ padding: '24px 26px', borderBottom: '1px solid var(--hairline)' }}>
          <SectionTitle>Redes sociales</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { name: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/brownielab' },
              { name: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/brownielab' },
              { name: 'tiktok',   label: 'TikTok',    placeholder: 'https://tiktok.com/@brownielab' },
            ].map(({ name, label, placeholder }) => (
              <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{label}</label>
                <input name={name} disabled={isPending}
                  defaultValue={(config[name as keyof typeof config] as string) ?? ''}
                  placeholder={placeholder}
                  style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
              </div>
            ))}
            <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Deja en blanco para ocultar en el sitio.</p>
          </div>
        </div>

        {/* Datos bancarios */}
        <div style={{ padding: '24px 26px', borderBottom: '1px solid var(--hairline)' }}>
          <SectionTitle>Datos bancarios</SectionTitle>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 20, marginTop: -10 }}>Se muestran al cliente cuando elige pago por transferencia.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Banco</label>
              <input name="banco_nombre" disabled={isPending} defaultValue={config.banco_nombre}
                placeholder="BAC Honduras"
                style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Titular</label>
              <input name="banco_titular" disabled={isPending} defaultValue={config.banco_titular}
                placeholder="María García"
                style={{ ...T.inp, opacity: isPending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Número de cuenta</label>
              <input name="banco_numero" disabled={isPending} defaultValue={config.banco_numero}
                placeholder="1234-5678-9012"
                style={{ ...T.inp, fontFamily: 'ui-monospace,monospace', opacity: isPending ? 0.6 : 1 }} onFocus={inpFocus} onBlur={inpBlur} />
            </div>
          </div>
        </div>

        {/* Save */}
        <div style={{ padding: '20px 26px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={isPending} style={{ ...T.btnPrimary, opacity: isPending ? 0.7 : 1 }}>
            {isPending && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
            {isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 16 }}>
        * El nombre de la tienda en el menú de navegación y los botones de WhatsApp siguen la configuración del código por ahora.
      </p>
    </div>
  );
}
