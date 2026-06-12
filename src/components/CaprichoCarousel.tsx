"use client";

// Carrusel de especiales activos para la sección "Capricho del Chef".
// Cada slide = foto + copy + countdown + CTA. Auto-avanza cada 7s.

import { useEffect, useState } from "react";
import BLIcon from "@/components/BLIcon";
import EspecialCarousel from "@/components/EspecialCarousel";
import type { Especial } from "@/types/database";

function getDaysLeft(fechaInicio: string, duracionDias: number): number {
  const start = new Date(fechaInicio + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + duracionDias);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function CaprichoCarousel({ especiales, whatsapp }: { especiales: Especial[]; whatsapp: string }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = especiales.length;

  // Auto-avance — solo con 2+ especiales y sin hover
  useEffect(() => {
    if (total < 2 || paused) return;
    const t = setInterval(() => setIdx(i => (i + 1) % total), 7000);
    return () => clearInterval(t);
  }, [total, paused]);

  if (total === 0) return null;
  const e = especiales[Math.min(idx, total - 1)];
  const dias = getDaysLeft(e.fecha_inicio, e.duracion_dias);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        key={e.id}
        className="mx-auto px-[var(--gutter)] grid items-center gap-[clamp(28px,5vw,64px)] bl-grid-2col"
        style={{ maxWidth: "var(--maxw)", gridTemplateColumns: ".9fr 1.1fr", animation: "fadeIn .45s ease" }}
      >
        {/* Media — carousel de imágenes del especial */}
        {e.imagen_url || (e.imagenes?.length > 0) ? (
          <EspecialCarousel especial={e} />
        ) : (
          <div
            className="rounded-[24px] grid place-items-center text-[80px]"
            style={{
              aspectRatio: "4/5",
              background:
                "repeating-linear-gradient(135deg, rgba(246,234,212,.06) 0 10px, rgba(246,234,212,0) 10px 20px), var(--choco-800)",
            }}
          >
            {e.emoji}
          </div>
        )}

        {/* Copy */}
        <div>
          <span className="text-[12px] font-bold tracking-[0.22em] uppercase" style={{ color: "var(--amber)" }}>
            Edición limitada
          </span>
          <h3 className="font-bold mt-4 mb-4" style={{ fontSize: "clamp(34px, 5vw, 52px)" }}>
            {e.nombre}
          </h3>
          <p style={{ color: "var(--on-dark-soft)", fontSize: 17, maxWidth: "46ch" }}>
            {e.descripcion}
          </p>
          <div className="flex items-center flex-wrap gap-4 mt-7">
            <span
              className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full"
              style={{ background: "rgba(232,162,58,.15)", color: "var(--amber)" }}
            >
              Solo esta semana
            </span>
            <span className="inline-flex items-center gap-2 font-bold text-[15px]" style={{ color: "var(--amber)" }}>
              <BLIcon name="clock" size={18} />
              {dias === 1 ? "Queda 1 día" : `Quedan ${dias} días`}
            </span>
          </div>
          <div className="mt-5">
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola! Me interesa el ${e.nombre} del Capricho del Chef`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-6 py-3.5 rounded-full text-white no-underline transition-colors"
              style={{ background: "var(--orange)", boxShadow: "0 6px 18px rgba(217,113,30,.32)" }}
            >
              Pedir ahora
              <BLIcon name="arrow-right" size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* Controles del carrusel — solo con 2+ especiales */}
      {total > 1 && (
        <div
          className="mx-auto px-[var(--gutter)] flex items-center gap-4"
          style={{ maxWidth: "var(--maxw)", marginTop: "clamp(24px, 4vw, 40px)" }}
        >
          <button
            onClick={() => setIdx(i => (i - 1 + total) % total)}
            aria-label="Especial anterior"
            style={{
              width: 38, height: 38, borderRadius: "50%", border: "1px solid rgba(246,234,212,.3)",
              cursor: "pointer", background: "transparent", color: "var(--on-dark)",
              display: "grid", placeItems: "center", fontSize: 18, transition: ".15s",
            }}
          >‹</button>
          <div className="flex gap-2">
            {especiales.map((esp, i) => (
              <button
                key={esp.id}
                onClick={() => setIdx(i)}
                aria-label={`Ver ${esp.nombre}`}
                aria-current={i === idx}
                style={{
                  width: i === idx ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  background: i === idx ? "var(--amber)" : "rgba(246,234,212,.35)",
                  transition: "width .2s, background .2s",
                }}
              />
            ))}
          </div>
          <button
            onClick={() => setIdx(i => (i + 1) % total)}
            aria-label="Siguiente especial"
            style={{
              width: 38, height: 38, borderRadius: "50%", border: "1px solid rgba(246,234,212,.3)",
              cursor: "pointer", background: "transparent", color: "var(--on-dark)",
              display: "grid", placeItems: "center", fontSize: 18, transition: ".15s",
            }}
          >›</button>
          <span className="text-[13px] font-semibold" style={{ color: "var(--on-dark-soft)", marginLeft: 4 }}>
            {idx + 1} / {total}
          </span>
        </div>
      )}
    </div>
  );
}
