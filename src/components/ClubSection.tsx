'use client';

import { useState } from 'react';
import LoyaltySection from './LoyaltySection';
import BLIcon from './BLIcon';

/* Círculos de sellos — sincronizados con el usuario encontrado */
function SellosDemoGrid({ sellos }: { sellos: number }) {
  return (
    <div
      className="grid gap-3 mt-7"
      style={{ gridTemplateColumns: 'repeat(5, 1fr)', maxWidth: 360 }}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className="aspect-square rounded-full grid place-items-center transition-all duration-500"
          style={
            i < sellos
              ? {
                  border: '1.5px solid var(--amber)',
                  background: 'rgba(232,162,58,.16)',
                  color: 'var(--amber)',
                }
              : {
                  border: '1.5px dashed rgba(246,234,212,.3)',
                  color: 'rgba(246,234,212,.3)',
                }
          }
        >
          {i < sellos && <BLIcon name="brownie" size={20} />}
        </div>
      ))}
    </div>
  );
}

const SEC: React.CSSProperties = { paddingBlock: 'clamp(64px, 9vw, 120px)' };

export default function ClubSection() {
  const [sellos, setSellos] = useState(0);

  return (
    <section
      id="club"
      style={{ background: 'var(--choco-900)', color: 'var(--on-dark)', ...SEC }}
    >
      <div
        className="mx-auto px-[var(--gutter)] grid items-center gap-[clamp(32px,5vw,72px)] bl-grid-2col"
        style={{ maxWidth: 'var(--maxw)', gridTemplateColumns: '1fr 1fr' }}
      >
        {/* ── Izquierda: copy + sellos dinámicos ── */}
        <div>
          <span
            className="w-14 h-14 rounded-[14px] grid place-items-center mb-5"
            style={{ background: 'rgba(232,162,58,.15)', color: 'var(--amber)' }}
          >
            <BLIcon name="brownie" size={30} />
          </span>
          <span
            className="text-[12px] font-bold tracking-[0.22em] uppercase"
            style={{ color: 'var(--amber)' }}
          >
            Club de fidelización
          </span>
          <h2 className="mt-3 mb-4" style={{ fontSize: 'clamp(32px, 4.4vw, 48px)' }}>
            Club Brownie Lab
          </h2>
          <p style={{ color: 'var(--on-dark-soft)', fontSize: 17, maxWidth: '42ch' }}>
            Acumula un sello con cada compra. Al llegar a 10, tu brownie va por la casa.
          </p>

          <SellosDemoGrid sellos={sellos} />

          {sellos > 0 && sellos < 10 && (
            <p
              className="mt-4 text-sm font-semibold"
              style={{ color: 'var(--amber)', opacity: 0.8 }}
            >
              {sellos} de 10 sellos
            </p>
          )}
          {sellos === 10 && (
            <p className="mt-4 text-sm font-bold" style={{ color: 'var(--amber)' }}>
              ¡Tienes un brownie gratis disponible! 🎉
            </p>
          )}
        </div>

        {/* ── Derecha: card lookup ── */}
        <div
          className="rounded-[24px] p-8"
          style={{
            background: 'var(--paper-card)',
            boxShadow: 'var(--shadow-lg)',
            borderTop: '5px solid var(--orange)',
          }}
        >
          <LoyaltySection onClienteFound={setSellos} />
        </div>
      </div>
    </section>
  );
}
