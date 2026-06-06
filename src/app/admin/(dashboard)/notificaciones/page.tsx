'use client';

import { useActionState, useEffect, useState } from 'react';
import { Bell, Send, Loader2, Users } from 'lucide-react';
import { enviarNotificacion } from '@/actions/notificaciones';

const INP: React.CSSProperties = {
  width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)',
  padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14,
  color: 'var(--ink)', background: 'var(--paper)', outline: 'none',
};

export default function NotificacionesPage() {
  const [state, formAction, pending] = useActionState(enviarNotificacion, null);
  const [titulo,  setTitulo]  = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (state?.success) { setTitulo(''); setMensaje(''); }
  }, [state]);

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[800px] w-full">

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>
          Notificaciones Push
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
          Envía un mensaje a todos los usuarios que habilitaron las notificaciones.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'start' }}>

        {/* Form */}
        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {state?.success === false && (
            <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderRadius: 'var(--r-md)', padding: '11px 14px', fontSize: 13, color: 'var(--berry)' }}>
              {state.error}
            </div>
          )}
          {state?.success === true && (
            <div style={{ background: 'rgba(31,138,91,.07)', border: '1px solid rgba(31,138,91,.2)', borderRadius: 'var(--r-md)', padding: '11px 14px', fontSize: 13, color: '#1f8a5b' }}>
              ✓ Notificación enviada correctamente.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
              Título <span style={{ color: 'var(--berry)' }}>*</span>
              <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--ink-soft)' }}>{titulo.length}/60</span>
            </label>
            <input
              name="titulo" required maxLength={60}
              value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Nuevo Brownie de la semana 🍫"
              style={INP}
              onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)'; }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
              Mensaje <span style={{ color: 'var(--berry)' }}>*</span>
              <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--ink-soft)' }}>{mensaje.length}/120</span>
            </label>
            <textarea
              name="mensaje" required maxLength={120} rows={3}
              value={mensaje} onChange={e => setMensaje(e.target.value)}
              placeholder="Disponible solo hoy. Pide por WhatsApp antes de que se agote."
              style={{ ...INP, resize: 'vertical', minHeight: 90, lineHeight: 1.6 }}
              onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--hairline)'; e.target.style.background = 'var(--paper)'; }}
            />
          </div>

          <button
            type="submit" disabled={pending || !titulo.trim() || !mensaje.trim()}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '12px 24px',
              borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer',
              background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)',
              opacity: pending || !titulo.trim() || !mensaje.trim() ? 0.6 : 1, transition: '.16s',
            }}
          >
            {pending ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: 16, height: 16 }} />}
            {pending ? 'Enviando…' : 'Enviar a todos'}
          </button>
        </form>

        {/* Live preview */}
        <div style={{ minWidth: 220 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>Vista previa</p>
          <div style={{ background: 'var(--choco-900)', borderRadius: 16, padding: '14px 16px', maxWidth: 260 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--orange)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 18 }}>🍫</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--on-dark)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {titulo || 'Título de la notificación'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--on-dark-soft)', margin: 0, lineHeight: 1.4 }}>
                  {mensaje || 'Aquí aparecerá tu mensaje...'}
                </p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <Users style={{ width: 14, height: 14, color: 'var(--ink-soft)', flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>
              Se enviará a todos los suscriptores activos
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
