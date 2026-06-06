'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function SiteError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div
      className="text-center"
      style={{ paddingBlock: 'clamp(80px, 12vw, 140px)', paddingInline: 'var(--gutter)' }}
    >
      <p className="text-5xl mb-6">🍪</p>
      <h1
        className="font-extrabold mb-3"
        style={{ fontSize: 'clamp(28px, 4vw, 40px)', color: 'var(--ink)' }}
      >
        Algo salió mal
      </h1>
      <p className="mb-8" style={{ color: 'var(--ink-soft)', fontSize: 17 }}>
        Ocurrió un error inesperado. Estamos trabajando en solucionarlo.
      </p>
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 font-bold text-[15px] px-6 py-3.5 rounded-full text-white border-0 cursor-pointer"
          style={{ background: 'var(--orange)', boxShadow: '0 6px 18px rgba(217,113,30,.32)' }}
        >
          Intentar de nuevo
        </button>
        <Link
          href="/"
          className="font-semibold text-[15px] no-underline"
          style={{ color: 'var(--orange-ink)' }}
        >
          ← Ir al inicio
        </Link>
      </div>
    </div>
  );
}
