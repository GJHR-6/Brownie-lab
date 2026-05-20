"use client";

import { useState, useEffect } from "react";

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
    <div className="bg-amber-600 text-white text-sm py-2 px-4 flex items-center gap-3">
      <div className="flex-1 text-center font-medium">{mensaje}</div>
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        className="text-amber-200 hover:text-white transition-colors flex-shrink-0 text-base leading-none"
      >
        ✕
      </button>
    </div>
  );
}
