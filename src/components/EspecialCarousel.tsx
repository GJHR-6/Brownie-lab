"use client";

import { useState } from "react";
import Image from "next/image";
import type { Especial } from "@/types/database";

export default function EspecialCarousel({ especial }: { especial: Especial }) {
  const imgs = [
    ...(especial.imagen_url ? [especial.imagen_url] : []),
    ...(Array.isArray(especial.imagenes) ? especial.imagenes : []),
  ];

  const [idx, setIdx] = useState(0);

  if (imgs.length === 0) {
    return (
      <div
        className="w-full rounded-[24px] grid place-items-center text-[80px]"
        style={{ aspectRatio: "4/5", background: "rgba(255,255,255,.06)" }}
      >
        {especial.emoji}
      </div>
    );
  }

  return (
    // Sin marco ni recorte: PNG transparente flotante estilo Crumbl
    <div className="relative w-full" style={{ aspectRatio: "1/1" }}>
      <Image
        src={imgs[idx]}
        alt={especial.nombre}
        fill
        className="object-contain transition-opacity duration-300"
        sizes="(max-width: 1024px) 100vw, 45vw"
        style={{ filter: "drop-shadow(0 24px 36px rgba(0,0,0,.35))" }}
      />

      {/* Navigation dots */}
      {imgs.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {imgs.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Foto ${i + 1}`}
              style={{
                width: i === idx ? 20 : 7,
                height: 7,
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                padding: 0,
                background: i === idx ? "#fff" : "rgba(255,255,255,.5)",
                transition: "width .2s, background .2s",
                boxShadow: "0 1px 3px rgba(0,0,0,.3)",
              }}
            />
          ))}
        </div>
      )}

      {/* Prev / Next arrows (only when 2+ images) */}
      {imgs.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + imgs.length) % imgs.length)}
            aria-label="Anterior"
            style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer",
              background: "rgba(255,255,255,.18)", backdropFilter: "blur(4px)", color: "#fff",
              display: "grid", placeItems: "center", fontSize: 16,
            }}
          >‹</button>
          <button
            onClick={() => setIdx((i) => (i + 1) % imgs.length)}
            aria-label="Siguiente"
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer",
              background: "rgba(255,255,255,.18)", backdropFilter: "blur(4px)", color: "#fff",
              display: "grid", placeItems: "center", fontSize: 16,
            }}
          >›</button>
        </>
      )}
    </div>
  );
}
