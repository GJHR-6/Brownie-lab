'use client';

// Reemplazo accesible de window.confirm() para el panel admin.
// Uso: const confirmar = useConfirm();  if (!(await confirmar({ mensaje: '...' }))) return;
// Teclado: Escape cancela, Enter confirma. Foco inicial en "Cancelar" (acción segura).

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmOpts {
  titulo?: string;
  mensaje: string;
  confirmLabel?: string;
  cancelLabel?: string;
  peligro?: boolean; // rojo para acciones destructivas
}

type ConfirmFn = (opts: ConfirmOpts) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  return ctx;
}

interface Pendiente extends ConfirmOpts {
  resolve: (ok: boolean) => void;
}

export default function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      setPendiente({ ...opts, resolve });
    });
  }, []);

  const cerrar = useCallback((ok: boolean) => {
    setPendiente(p => { p?.resolve(ok); return null; });
  }, []);

  // Teclado + bloqueo de scroll del body mientras el diálogo está abierto
  useEffect(() => {
    if (!pendiente) return;
    cancelRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(false); }
      if (e.key === 'Enter')  { e.preventDefault(); cerrar(true); }
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [pendiente, cerrar]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pendiente && (
        <div
          onClick={e => { if (e.target === e.currentTarget) cerrar(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,10,.46)', backdropFilter: 'blur(2px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-titulo"
            aria-describedby="confirm-mensaje"
            style={{ background: 'var(--paper)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 400, padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', flexShrink: 0,
                background: pendiente.peligro ? 'rgba(158,59,70,.12)' : 'rgba(232,162,58,.16)',
                color: pendiente.peligro ? 'var(--berry)' : 'var(--orange-ink)',
              }}>
                <AlertTriangle style={{ width: 20, height: 20 }} />
              </span>
              <h3 id="confirm-titulo" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--ink)', margin: 0 }}>
                {pendiente.titulo ?? '¿Estás seguro?'}
              </h3>
            </div>

            <p id="confirm-mensaje" style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, margin: 0 }}>
              {pendiente.mensaje}
            </p>

            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button
                ref={cancelRef}
                onClick={() => cerrar(false)}
                style={{ flex: 1, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)', cursor: 'pointer', background: 'var(--paper-card)', color: 'var(--ink)' }}
              >
                {pendiente.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                onClick={() => cerrar(true)}
                style={{
                  flex: 1, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer', color: '#fff',
                  background: pendiente.peligro ? 'var(--berry)' : 'var(--orange)',
                  boxShadow: pendiente.peligro ? '0 6px 16px rgba(158,59,70,.28)' : '0 6px 16px rgba(217,113,30,.28)',
                }}
              >
                {pendiente.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', margin: 0, textAlign: 'center' }}>
              Enter confirma · Escape cancela
            </p>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
