"use client";

import { useState, useSyncExternalStore } from "react";
import BLIcon from "@/components/BLIcon";

interface BannerBarProps {
  mensaje: string;
  bannerId: string;
}

const emptySubscribe = () => () => {};

export default function BannerBar({ mensaje, bannerId }: BannerBarProps) {
  const key = `banner-dismissed-${bannerId}`;
  // Lectura de sessionStorage como external store: en SSR se asume descartado
  // (oculto) y en cliente se lee el valor real sin render doble.
  const descartadoGuardado = useSyncExternalStore(
    emptySubscribe,
    () => sessionStorage.getItem(key) === "1",
    () => true
  );
  const [descartadoAhora, setDescartadoAhora] = useState(false);
  const visible = !descartadoGuardado && !descartadoAhora;

  function dismiss() {
    sessionStorage.setItem(key, "1");
    setDescartadoAhora(true);
  }

  if (!visible) return null;

  return (
    <div
      className="relative flex items-center justify-center gap-2.5 py-2.5 px-10 sm:px-12 text-sm font-semibold text-white"
      style={{ background: "var(--orange)" }}
    >
      <BLIcon name="truck" size={18} />
      <span>{mensaje}</span>
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full grid place-items-center cursor-pointer border-0"
        style={{ background: "rgba(255,255,255,.18)" }}
        onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.32)")}
        onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.18)")}
      >
        <BLIcon name="close" size={13} />
      </button>
    </div>
  );
}
