'use client';

import { useState } from 'react';
import PersonalizaAdminClient from './PersonalizaAdminClient';
import CajasAdminClient from './CajasAdminClient';
import type { PersonalizaVariante, Caja } from '@/types/database';

type Seccion = 'variantes' | 'cajas';

const SECCIONES: { key: Seccion; label: string }[] = [
  { key: 'variantes', label: 'Variantes de base' },
  { key: 'cajas',     label: 'Cajas' },
];

export default function ArmadorTabs({ variantes, cajas }: {
  variantes: PersonalizaVariante[];
  cajas: Caja[];
}) {
  const [seccion, setSeccion] = useState<Seccion>('variantes');

  return (
    <>
      <div className="px-6 md:px-10 pt-8 max-w-[1400px] w-full">
        <div style={{ display: 'inline-flex', background: 'var(--cream-200)', borderRadius: 'var(--r-pill)', padding: 4, gap: 2 }}>
          {SECCIONES.map(s => (
            <button key={s.key} onClick={() => setSeccion(s.key)}
              style={{
                border: seccion === s.key ? '1.5px solid var(--hairline)' : '1.5px solid transparent',
                fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13,
                color: seccion === s.key ? 'var(--ink)' : 'var(--ink-soft)',
                padding: '6px 16px', borderRadius: 'var(--r-pill)', cursor: 'pointer',
                background: seccion === s.key ? 'var(--paper-card)' : 'none',
                boxShadow: seccion === s.key ? 'var(--shadow-sm)' : 'none', transition: '.15s',
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {seccion === 'variantes'
        ? <PersonalizaAdminClient initialVariantes={variantes} />
        : (
          <div className="px-6 md:px-10 py-8 pb-16 max-w-[1400px] w-full">
            <CajasAdminClient initialCajas={cajas} />
          </div>
        )}
    </>
  );
}
