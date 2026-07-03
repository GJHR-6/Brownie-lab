"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import BLIcon from "@/components/BLIcon";

const KEY = "bl_gift_opened_v1";
type Phase = "visible" | "opening" | "welcome" | "done" | "gone";

function overlayClass(phase: Phase) {
  if (phase === "opening") return "gift opening";
  if (phase === "welcome") return "gift opening welcome";
  if (phase === "done")    return "gift opening welcome done";
  return "gift";
}

const emptySubscribe = () => () => {};

export default function GiftIntro() {
  // ¿Ya vio la intro? localStorage como external store; en SSR se asume que sí
  // (no se renderiza overlay hasta hidratar).
  const yaVista = useSyncExternalStore(
    emptySubscribe,
    () => { try { return localStorage.getItem(KEY) === "1"; } catch { return true; } },
    () => true
  );
  // null = sin interacción: la fase inicial se deriva de yaVista.
  const [phaseManual, setPhase] = useState<Phase | null>(null);
  const phase: Phase = phaseManual ?? (yaVista ? "gone" : "visible");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isVisible = phase !== "gone";

  // Bloquear scroll del body mientras el overlay está activo.
  useEffect(() => {
    document.body.style.overflow = isVisible ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isVisible]);

  useEffect(() => {
    // El array de timers nunca se reasigna (solo se muta), así el cleanup
    // capturado aquí siempre ve los timeouts vigentes al desmontar.
    const pendientes = timers.current;
    return () => pendientes.forEach(clearTimeout);
  }, []);

  function cancelarTimers() {
    timers.current.forEach(clearTimeout);
    timers.current.length = 0;
  }

  function show() {
    cancelarTimers();
    setPhase("visible");
  }

  function open() {
    cancelarTimers();
    setPhase("opening");
    timers.current.push(
      setTimeout(() => setPhase("welcome"), 750),
      setTimeout(() => setPhase("done"), 2700),
      setTimeout(() => {
        setPhase("gone");
        try { localStorage.setItem(KEY, "1"); } catch {}
      }, 3500),
    );
  }

  return (
    <>
      {isVisible && (
        <div
          className={overlayClass(phase)}
          role="dialog"
          aria-modal="true"
          aria-label="Bienvenido a Brownie Lab"
          onClick={(e) => { if (e.target === e.currentTarget) open(); }}
        >
          <div className="gift__half gift__half--top" />
          <div className="gift__half gift__half--bottom" />
          <div className="gift__rib gift__rib--h" />
          <div className="gift__rib gift__rib--v" />
          <div className="gift__bow" aria-hidden="true">
            <svg viewBox="0 0 100 100" fill="currentColor">
              <path d="M47 50C36 38 24 33 16 36c-7 3-8 13-1 19 7 5 22 4 32-2z" />
              <path d="M53 50c11-12 23-17 31-14 7 3 8 13 1 19-7 5-22 4-32-2z" />
              <path d="M47 50l-7 34c-.5 3 1.5 5 4 4l8-4z" opacity={0.85} />
              <path d="M53 50l7 34c.5 3-1.5 5-4 4l-8-4z" opacity={0.85} />
              <ellipse cx={50} cy={50} rx={8.5} ry={10} />
            </svg>
          </div>
          <button className="gift__btn" type="button" onClick={open}>
            <BLIcon name="sparkle" size={20} style={{ color: "var(--amber)" } as React.CSSProperties} />
            Toca para abrir tu regalo
          </button>
          <div className="gift__welcome" aria-live="polite">
            <div className="gift__card">
              <BLIcon
                name="brownie"
                size={46}
                style={{ margin: "0 auto 18px", color: "var(--amber)" } as React.CSSProperties}
              />
              <p style={{ color: "var(--amber)", marginBottom: 12, fontSize: 12, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase" }}>
                Hecho a mano · con obsesión
              </p>
              <h2>Bienvenido a<br />Brownie Lab</h2>
              <p style={{ color: "var(--on-dark-soft)", fontSize: 18, marginTop: 14 }}>
                Pasa, está recién horneado.
              </p>
            </div>
          </div>
        </div>
      )}
      <button className="gift-replay" type="button" onClick={show}>
        <BLIcon name="sparkle" size={15} style={{ color: "var(--amber)" } as React.CSSProperties} />
        Ver intro
      </button>
    </>
  );
}
