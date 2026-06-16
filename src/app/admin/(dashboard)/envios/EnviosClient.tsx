'use client';

import { useActionState, useState } from 'react';
import { Loader2, Check, Plus, Trash2, LocateFixed, Map } from 'lucide-react';
import { updateConfiguracionEnvios } from '@/actions/configuracion';
import type { ConfigEnvio } from '@/lib/envio';
import dynamic from 'next/dynamic';

const MapPickerModal = dynamic(() => import('./MapPickerModal'), { ssr: false });

type SedeForm = { nombre: string; lat: string; lng: string; tarifa_base: string };

const inp: React.CSSProperties = {
  width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)',
  padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14,
  color: 'var(--ink)', background: 'var(--paper)', outline: 'none',
};

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{label}</label>
      {children}
    </div>
  );
}

function Inp(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      style={{ ...inp, ...props.style }}
      onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)'; }} />
  );
}

function sedesIniciales(config: ConfigEnvio): SedeForm[] {
  return config.sedes.map(s => ({
    nombre: s.nombre, lat: String(s.lat), lng: String(s.lng), tarifa_base: String(s.tarifa_base),
  }));
}

export default function EnviosClient({ config }: { config: ConfigEnvio }) {
  const [state, formAction, isPending] = useActionState(updateConfiguracionEnvios, null);
  const [sedes, setSedes] = useState<SedeForm[]>(() => sedesIniciales(config));
  const [gpsSedeIdx, setGpsSedeIdx] = useState<number | null>(null);
  const [mapSedeIdx, setMapSedeIdx] = useState<number | null>(null);

  function setSede(i: number, patch: Partial<SedeForm>) {
    setSedes(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  }

  // El admin configura la sede estando físicamente en ella → GPS del navegador
  function usarUbicacionActual(i: number) {
    if (!('geolocation' in navigator)) return;
    setGpsSedeIdx(i);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setSede(i, { lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) });
        setGpsSedeIdx(null);
      },
      () => setGpsSedeIdx(null),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const sedesJson = JSON.stringify(
    sedes
      .filter(s => s.nombre.trim() && s.lat.trim() && s.lng.trim())
      .map(s => ({ nombre: s.nombre.trim(), lat: Number(s.lat), lng: Number(s.lng), tarifa_base: Number(s.tarifa_base) || 0 }))
  );

  // Ejemplo en vivo de tarifa con los valores actuales del form (sede 1, 5 km)
  const ejemploBase = Number(sedes[0]?.tarifa_base) || 0;

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[860px] w-full">
      {/* Page head */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>Envíos</h1>
        <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
          Sedes de despacho y tarifas. El cliente comparte su ubicación y el costo se calcula desde la sede más cercana.
        </p>
      </div>

      {state?.success === false && (
        <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderLeft: '4px solid var(--berry)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 14, color: 'var(--berry)', marginBottom: 20 }}>
          {state.error}
        </div>
      )}

      <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <input type="hidden" name="envio_sedes_json" value={sedesJson} />

        {/* Sedes */}
        <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', margin: 0 }}>Sedes de despacho</p>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
              Parate en cada sede y usa &ldquo;Usar mi ubicación actual&rdquo; para capturar las coordenadas exactas.
            </p>
          </div>

          {sedes.map((s, i) => (
            <div key={i} style={{ border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '16px 18px', background: 'var(--paper)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 14 }}>
                <Field label={`Sede ${i + 1} — nombre`}>
                  <Inp value={s.nombre} onChange={e => setSede(i, { nombre: e.target.value })} placeholder="San Pedro Sula" disabled={isPending} maxLength={80} />
                </Field>
                <Field label="Tarifa base L.">
                  <Inp type="number" step="1" min="0" value={s.tarifa_base} onChange={e => setSede(i, { tarifa_base: e.target.value })} placeholder="50" disabled={isPending} />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Latitud">
                  <Inp type="number" step="any" value={s.lat} onChange={e => setSede(i, { lat: e.target.value })} placeholder="15.5042" disabled={isPending} />
                </Field>
                <Field label="Longitud">
                  <Inp type="number" step="any" value={s.lng} onChange={e => setSede(i, { lng: e.target.value })} placeholder="-88.0250" disabled={isPending} />
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setMapSedeIdx(i)} disabled={isPending}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, padding: '8px 14px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--orange)', cursor: 'pointer', background: 'var(--cream)', color: 'var(--orange-ink)' }}>
                  <Map style={{ width: 13, height: 13 }} />
                  Seleccionar en mapa
                </button>
                <button type="button" onClick={() => usarUbicacionActual(i)} disabled={isPending || gpsSedeIdx !== null}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, padding: '8px 14px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)', cursor: 'pointer', background: 'var(--paper-card)', color: 'var(--orange-ink)' }}>
                  {gpsSedeIdx === i
                    ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                    : <LocateFixed style={{ width: 13, height: 13 }} />}
                  Usar mi ubicación
                </button>
                <button type="button" onClick={() => setSedes(prev => prev.filter((_, idx) => idx !== i))} disabled={isPending}
                  aria-label={`Eliminar sede ${s.nombre || i + 1}`}
                  style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, padding: '8px 14px', borderRadius: 'var(--r-pill)', border: '1px solid var(--hairline)', cursor: 'pointer', background: 'none', color: 'var(--berry)' }}>
                  <Trash2 style={{ width: 13, height: 13 }} />
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          <button type="button" disabled={isPending}
            onClick={() => setSedes(prev => [...prev, { nombre: '', lat: '', lng: '', tarifa_base: '50' }])}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 13, fontWeight: 700, padding: '11px 16px', borderRadius: 'var(--r-md)', border: '1.6px dashed var(--hairline)', cursor: 'pointer', background: 'var(--cream)', color: 'var(--orange-ink)' }}>
            <Plus style={{ width: 15, height: 15 }} />
            Agregar sede
          </button>
        </div>

        {/* Tarifas */}
        <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', margin: 0 }}>Tarifas</p>
          <div className="bl-grid-field2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Lempiras por km">
              <Inp name="envio_por_km" type="number" step="0.5" min="0" defaultValue={config.por_km} placeholder="10" disabled={isPending} />
            </Field>
            <Field label={<>Factor de ruta <span style={{ color: 'var(--ink-soft)', fontWeight: 500, fontSize: 12 }}>(línea recta → calle, típico 1.3)</span></>}>
              <Inp name="envio_factor_ruta" type="number" step="0.05" min="1" defaultValue={config.factor_ruta} placeholder="1.3" disabled={isPending} />
            </Field>
          </div>
          <div className="bl-grid-field2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label={<>Distancia máxima km <span style={{ color: 'var(--ink-soft)', fontWeight: 500, fontSize: 12 }}>(0 = sin límite)</span></>}>
              <Inp name="envio_km_max" type="number" step="1" min="0" defaultValue={config.km_max} placeholder="15" disabled={isPending} />
            </Field>
            <Field label={<>Envío gratis desde L. <span style={{ color: 'var(--ink-soft)', fontWeight: 500, fontSize: 12 }}>(0 = nunca)</span></>}>
              <Inp name="envio_gratis_monto" type="number" step="1" min="0" defaultValue={config.gratis_desde} placeholder="500" disabled={isPending} />
            </Field>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: 0, background: 'var(--cream)', borderRadius: 'var(--r-md)', padding: '10px 14px' }}>
            Costo = tarifa base + km × tarifa, redondeado al múltiplo de 5.
            Ejemplo a 5 km de la sede 1: L.{ejemploBase} + 5 × tarifa/km. Sin sedes configuradas, el checkout no cobra envío.
          </p>
        </div>

        {/* Guardar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="submit" disabled={isPending}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 22px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer', background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', opacity: isPending ? 0.7 : 1 }}>
            {isPending
              ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
              : <Check style={{ width: 16, height: 16 }} />}
            {isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {state?.success && (
            <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check style={{ width: 14, height: 14 }} />
              Guardado
            </span>
          )}
        </div>
      </form>

      {mapSedeIdx !== null && (
        <MapPickerModal
          sedeName={sedes[mapSedeIdx]?.nombre || `Sede ${mapSedeIdx + 1}`}
          initialLat={Number(sedes[mapSedeIdx]?.lat) || undefined}
          initialLng={Number(sedes[mapSedeIdx]?.lng) || undefined}
          onConfirm={(lat, lng) => {
            setSede(mapSedeIdx, { lat: lat.toFixed(6), lng: lng.toFixed(6) });
            setMapSedeIdx(null);
          }}
          onClose={() => setMapSedeIdx(null)}
        />
      )}
    </div>
  );
}
