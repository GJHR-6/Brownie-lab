"use client";

import { useState, useEffect } from "react";
import BLIcon from "@/components/BLIcon";

interface BannerBarProps {
  mensaje: string;
  bannerId: string;
}

export default function BannerBar({ mensaje, bannerId }: BannerBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = `banner-dismissed-${bannerId}`;
    if (!sessionStorage.getItem(key)) setVisible(true);
  }, [bannerId]);

  function dismiss() {
    sessionStorage.setItem(`banner-dismissed-${bannerId}`, "1");
    setVisible(false);
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
