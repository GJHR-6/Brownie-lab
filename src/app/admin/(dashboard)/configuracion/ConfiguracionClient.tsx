'use client';

import { useActionState, useRef, useState } from 'react';
import { Loader2, Check, Upload } from 'lucide-react';
import { updateConfiguracion } from '@/actions/configuracion';
import type { Configuracion } from '@/types/database';

const inp: React.CSSProperties = {
  width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)',
  padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14,
  color: 'var(--ink)', background: 'var(--paper)', outline: 'none',
};

function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff';
}
function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)';
}

function FCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ marginBottom: 2 }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', margin: 0 }}>{title}</p>
        {sub && <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{label}</label>
      {children}
    </div>
  );
}

function Inp(props: React.InputHTMLAttributes<HTMLInputElement> & { style?: React.CSSProperties }) {
  const { style: extra, ...rest } = props;
  return (
    <input {...rest}
      style={{ ...inp, ...extra }}
      onFocus={onFocus} onBlur={onBlur} />
  );
}

export default function ConfiguracionClient({ config }: { config: Configuracion }) {
  const [state, formAction, isPending] = useActionState(updateConfiguracion, null);
  const [formKey, setFormKey] = useState(0);
  const [logoPreview, setLogoPreview] = useState<string | null>(config.logo_url ?? null);
  const logoRef = useRef<HTMLInputElement>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleDiscard() {
    setFormKey(k => k + 1);
    setLogoPreview(config.logo_url ?? null);
  }

  return (
    <div className="px-6 md:px-10 py-8 pb-32 max-w-[1500px] w-full">
      {/* Page head */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>
          Configuración
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>Datos del negocio que aparecen en todo el sitio.</p>
      </div>

      {state?.success === false && (
        <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderLeft: '4px solid var(--berry)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 14, color: 'var(--berry)', marginBottom: 20 }}>
          {state.error}
        </div>
      )}

      <form key={formKey} action={formAction}>
        {/* 2-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }} className="block lg:grid">

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Datos del negocio */}
            <FCard title="Datos del negocio" sub="Nombre y contacto visibles para los clientes.">
              <Field label="Nombre del negocio">
                <Inp name="nombre" required defaultValue={config.nombre} placeholder="Brownie Lab" disabled={isPending} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="WhatsApp de pedidos">
                  <Inp name="whatsapp" required defaultValue={config.whatsapp} placeholder="+504 3153-4704" disabled={isPending} />
                </Field>
                <Field label="Correo de contacto">
                  <Inp name="correo" type="email" defaultValue={config.correo} placeholder="hola@brownielab.com" disabled={isPending} />
                </Field>
              </div>
              <Field label="Ubicación">
                <Inp name="ubicacion" defaultValue={config.ubicacion} placeholder="Honduras" disabled={isPending} />
              </Field>
            </FCard>

            {/* Operación */}
            <FCard title="Operación" sub="Reglas de pedidos y envío.">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Envío gratis desde">
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--ink-soft)', fontFamily: 'var(--font-display)', fontSize: 14, pointerEvents: 'none' }}>
                      L.
                    </span>
                    <Inp name="envio_gratis_desde" defaultValue={config.envio_gratis_desde} placeholder="200" disabled={isPending} style={{ paddingLeft: 42 }} />
                  </div>
                </Field>
                <Field label="Anticipación mínima">
                  <Inp name="anticipacion_minima" defaultValue={config.anticipacion_minima} placeholder="24 horas" disabled={isPending} />
                </Field>
              </div>
              <Field label="Horario de atención">
                <Inp name="horario_atencion" defaultValue={config.horario_atencion} placeholder="Lun–Sáb · 9:00 a.m. – 7:00 p.m." disabled={isPending} />
              </Field>
            </FCard>

            {/* Mensajes del sitio */}
            <FCard title="Mensajes del sitio" sub="Textos que se muestran a los clientes.">
              <Field label="Aviso barra superior">
                <Inp name="aviso_barra_superior" defaultValue={config.aviso_barra_superior} placeholder="Envíos gratis por encargos mayores a L.200" disabled={isPending} />
              </Field>
              <Field label="Mensaje de bienvenida">
                <textarea
                  name="mensaje_bienvenida"
                  defaultValue={config.mensaje_bienvenida}
                  placeholder="Hecho a mano, con obsesión. Galletas y brownies horneados el mismo día."
                  rows={4}
                  disabled={isPending}
                  style={{ ...inp, resize: 'vertical', minHeight: 96, lineHeight: 1.6 }}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </Field>
            </FCard>

          </div>

          {/* ── Right column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Redes sociales */}
            <FCard title="Redes sociales">
              <Field label="Instagram">
                <Inp name="instagram" defaultValue={config.instagram} placeholder="@brownielab" disabled={isPending} />
              </Field>
              <Field label="Facebook">
                <Inp name="facebook" defaultValue={config.facebook} placeholder="/brownielab" disabled={isPending} />
              </Field>
              <Field label={<>TikTok <span style={{ color: 'var(--ink-soft)', fontWeight: 500, fontSize: 12 }}>(opcional)</span></>}>
                <Inp name="tiktok" defaultValue={config.tiktok} placeholder="@usuario" disabled={isPending} />
              </Field>
            </FCard>

            {/* Logo y marca */}
            <FCard title="Logo y marca" sub="Imagen que aparece en el encabezado.">
              <input ref={logoRef} name="logo" type="file" accept="image/png,image/svg+xml,image/webp"
                onChange={handleLogoChange} style={{ display: 'none' }} />
              <button type="button" onClick={() => logoRef.current?.click()}
                style={{
                  aspectRatio: '16/9', width: '100%', borderRadius: 'var(--r-md)',
                  border: '1.6px dashed var(--hairline)',
                  background: `repeating-linear-gradient(135deg,rgba(116,58,20,.06) 0 9px,rgba(116,58,20,0) 9px 18px),var(--cream)`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, cursor: 'pointer', overflow: 'hidden', padding: 0, position: 'relative', transition: '.14s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--hairline)'; }}
              >
                {logoPreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} />
                ) : (
                  <>
                    <Upload style={{ width: 22, height: 22, color: 'var(--orange-ink)' }} />
                    <span style={{ fontSize: 11, fontFamily: 'ui-monospace,monospace', color: 'var(--ink-soft)' }}>
                      subir logo (PNG/SVG)
                    </span>
                  </>
                )}
              </button>
            </FCard>

          </div>
        </div>

        {/* ── Action bar ── */}
        <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="submit"
            disabled={isPending}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 22px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer', background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', transition: '.16s', opacity: isPending ? 0.7 : 1 }}
          >
            {isPending
              ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
              : <Check style={{ width: 16, height: 16 }} />
            }
            {isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isPending}
            style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, padding: '10px 20px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer', background: 'none', color: 'var(--ink-soft)', transition: '.16s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--ink)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-soft)'; }}
          >
            Descartar
          </button>
          {state?.success && (
            <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check style={{ width: 14, height: 14 }} />
              Guardado
            </span>
          )}
        </div>

      </form>
    </div>
  );
}
