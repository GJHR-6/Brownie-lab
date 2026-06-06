'use client';

import { useEffect } from 'react';

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[Admin error]', error); }, [error]);

  return (
    <div style={{ padding: '80px 32px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
      <p style={{ fontSize: 40, marginBottom: 16 }}>⚠️</p>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink)', marginBottom: 8 }}>
        Error al cargar esta sección
      </h2>
      <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>
        {error.message || 'Ocurrió un error inesperado.'}
      </p>
      <button
        onClick={reset}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14,
          padding: '10px 22px', borderRadius: 'var(--r-pill)', border: 'none', cursor: 'pointer',
          background: 'var(--orange)', color: '#fff',
        }}
      >
        Reintentar
      </button>
    </div>
  );
}
