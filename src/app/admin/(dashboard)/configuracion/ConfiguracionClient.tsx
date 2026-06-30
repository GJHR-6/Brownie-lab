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

function ImageUploadTile({
  inputRef, preview, onPreview, fieldName, label, accept, aspect,
}: {
  inputRef: React.RefObject<HTMLInputElement>;
  preview: string | null;
  onPreview: (url: string) => void;
  fieldName: string;
  label: string;
  accept?: string;
  aspect?: string;
}) {
  return (
    <>
      <input ref={inputRef} name={fieldName} type="file" accept={accept ?? 'image/png,image/jpeg,image/webp'}
        onChange={e => { const f = e.target.files?.[0]; if (f) onPreview(URL.createObjectURL(f)); }}
        style={{ display: 'none' }} />
      <button type="button" onClick={() => inputRef.current?.click()}
        style={{
          width: '100%', aspectRatio: aspect ?? '16/9', borderRadius: 'var(--r-md)',
          border: '1.6px dashed var(--hairline)',
          background: `repeating-linear-gradient(135deg,rgba(116,58,20,.06) 0 9px,rgba(116,58,20,0) 9px 18px),var(--cream)`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, cursor: 'pointer', overflow: 'hidden', padding: 0, position: 'relative', transition: '.14s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--hairline)'; }}
      >
        {preview
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <>
              <Upload style={{ width: 22, height: 22, color: 'var(--orange-ink)' }} />
              <span style={{ fontSize: 11, fontFamily: 'ui-monospace,monospace', color: 'var(--ink-soft)' }}>{label}</span>
            </>
        }
      </button>
    </>
  );
}

export default function ConfiguracionClient({ config }: { config: Configuracion }) {
  const [state, formAction, isPending] = useActionState(updateConfiguracion, null);
  const [formKey, setFormKey] = useState(0);
  const [logoPreview,          setLogoPreview]          = useState<string | null>(config.logo_url               ?? null);
  const [heroPreview,          setHeroPreview]          = useState<string | null>(config.hero_imagen_url         ?? null);
  const [nosotrosPreview,      setNosotrosPreview]      = useState<string | null>(config.nosotros_imagen_url     ?? null);
  const [personalizadorPreview, setPersonalizadorPreview] = useState<string | null>(config.personalizador_imagen_url ?? null);
  const logoRef          = useRef<HTMLInputElement>(null);
  const heroRef          = useRef<HTMLInputElement>(null);
  const nosotrosRef      = useRef<HTMLInputElement>(null);
  const personalizadorRef = useRef<HTMLInputElement>(null);

  function handleDiscard() {
    setFormKey(k => k + 1);
    setLogoPreview(config.logo_url ?? null);
    setHeroPreview(config.hero_imagen_url ?? null);
    setNosotrosPreview(config.nosotros_imagen_url ?? null);
    setPersonalizadorPreview(config.personalizador_imagen_url ?? null);
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
        <div style={{ gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }} className="block lg:grid">

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Datos del negocio */}
            <FCard title="Datos del negocio" sub="Nombre y contacto visibles para los clientes.">
              <Field label="Nombre del negocio">
                <Inp name="nombre" required defaultValue={config.nombre} placeholder="Brownie Lab" disabled={isPending} />
              </Field>
              <div className="bl-grid-field2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
              <Field label="Descripción del negocio">
                <textarea
                  name="descripcion"
                  defaultValue={config.descripcion ?? ''}
                  placeholder="Somos una pequeña tienda artesanal especializada en galletas y brownies…"
                  rows={3}
                  disabled={isPending}
                  style={{ ...inp, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </Field>
            </FCard>

            {/* Operación */}
            <FCard title="Operación" sub="Reglas de pedidos y horario.">
              <div className="bl-grid-field2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Anticipación mínima">
                  <Inp name="anticipacion_minima" defaultValue={config.anticipacion_minima} placeholder="24 horas" disabled={isPending} />
                </Field>
                <Field label="Horario de atención">
                  <Inp name="horario_atencion" defaultValue={config.horario_atencion} placeholder="Lun–Sáb · 9:00 a.m. – 7:00 p.m." disabled={isPending} />
                </Field>
              </div>
              <div className="bl-grid-field2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label={<>Franja de entrega 1 <span style={{ color: 'var(--ink-soft)', fontWeight: 500, fontSize: 12 }}>(el cliente elige una)</span></>}>
                  <Inp name="hora_entrega_1" defaultValue={config.horas_entrega?.[0] ?? '10:00 AM'} placeholder="10:00 AM" maxLength={20} disabled={isPending} />
                </Field>
                <Field label="Franja de entrega 2">
                  <Inp name="hora_entrega_2" defaultValue={config.horas_entrega?.[1] ?? '3:00 PM'} placeholder="3:00 PM" maxLength={20} disabled={isPending} />
                </Field>
              </div>
              <Field label={<>Hora de corte <span style={{ color: 'var(--ink-soft)', fontWeight: 500, fontSize: 12 }}>(pedidos después de esta hora se entregan un día después; ej. corte 19:00 → pedido lunes 8 PM se entrega miércoles)</span></>}>
                <Inp name="hora_corte" type="time" defaultValue={config.hora_corte ?? '19:00'} disabled={isPending} style={{ maxWidth: 180 }} />
              </Field>
            </FCard>

            {/* Envíos → gestionados en su propia página */}
            <div style={{ background: 'var(--cream)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--orange-ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>
                Las sedes y tarifas de envío a domicilio se gestionan en{' '}
                <a href="/admin/envios" style={{ color: 'var(--orange-ink)', fontWeight: 700 }}>Envíos</a>.
              </p>
            </div>


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

            {/* Datos bancarios */}
            <FCard title="Datos bancarios" sub="Información de transferencia que ve el cliente al pagar.">
              <Field label="Nombre del banco">
                <Inp name="banco_nombre" defaultValue={config.banco_nombre} placeholder="Banco Atlántida" disabled={isPending} />
              </Field>
              <Field label="Nombre del titular">
                <Inp name="banco_titular" defaultValue={config.banco_titular} placeholder="María López" disabled={isPending} />
              </Field>
              <Field label="Número de cuenta">
                <Inp name="banco_numero" defaultValue={config.banco_numero} placeholder="0123-4567-8901" disabled={isPending} />
              </Field>
            </FCard>

            {/* Logo y marca */}
            <FCard title="Logo y marca" sub="Imagen que aparece en el encabezado.">
              <ImageUploadTile
                inputRef={logoRef as React.RefObject<HTMLInputElement>}
                preview={logoPreview}
                onPreview={setLogoPreview}
                fieldName="logo"
                label="subir logo (PNG/SVG)"
                accept="image/png,image/svg+xml,image/webp"
                aspect="16/9"
              />
            </FCard>

            {/* Imágenes del sitio */}
            <FCard title="Imágenes del sitio" sub="Hero de inicio, sección nosotros y personalizador.">
              <Field label="Imagen hero (inicio)">
                <ImageUploadTile
                  inputRef={heroRef as React.RefObject<HTMLInputElement>}
                  preview={heroPreview}
                  onPreview={setHeroPreview}
                  fieldName="hero_imagen"
                  label="subir imagen hero (16:9)"
                  aspect="16/9"
                />
              </Field>
              <Field label="Imagen nosotros">
                <ImageUploadTile
                  inputRef={nosotrosRef as React.RefObject<HTMLInputElement>}
                  preview={nosotrosPreview}
                  onPreview={setNosotrosPreview}
                  fieldName="nosotros_imagen"
                  label="subir imagen nosotros (16:9)"
                  aspect="16/9"
                />
              </Field>
              <Field label="Imagen personalizador">
                <ImageUploadTile
                  inputRef={personalizadorRef as React.RefObject<HTMLInputElement>}
                  preview={personalizadorPreview}
                  onPreview={setPersonalizadorPreview}
                  fieldName="personalizador_imagen"
                  label="subir imagen personalizador (16:9)"
                  aspect="16/9"
                />
              </Field>
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
