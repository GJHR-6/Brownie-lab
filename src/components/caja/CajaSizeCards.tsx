"use client";

// Cards grandes de selección de tamaño de caja (estilo Crumbl):
// foto de la caja, nombre, "X postres", badge de descuento y descripción.

import Image from "next/image";
import type { CajaDef } from "./types";

export default function CajaSizeCards({
  cajas,
  onSelect,
}: {
  cajas: CajaDef[];
  onSelect: (cajaId: string) => void;
}) {
  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
      {cajas.map(c => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className="flex flex-col text-left cursor-pointer overflow-hidden transition-all bl-caja-sizecard"
          style={{
            padding: 0,
            borderRadius: "var(--r-lg, 20px)",
            border: "1.5px solid var(--hairline)",
            background: "var(--paper-card)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* Foto de la caja */}
          {c.imagenUrl ? (
            <span className="relative block w-full" style={{ aspectRatio: "4/3" }}>
              <Image src={c.imagenUrl} alt={c.nombre} fill className="object-cover" sizes="(max-width: 768px) 100vw, 360px" />
              {c.descuentoPct > 0 && (
                <span
                  className="absolute top-3 right-3 text-[12px] font-bold px-3 py-1.5 rounded-full text-white"
                  style={{ background: "var(--berry)" }}
                >
                  −{c.descuentoPct}%
                </span>
              )}
            </span>
          ) : (
            <span
              className="relative grid place-items-center w-full"
              style={{
                aspectRatio: "4/3",
                fontSize: 56,
                background:
                  "repeating-linear-gradient(135deg, rgba(246,234,212,.06) 0 10px, rgba(246,234,212,0) 10px 20px), linear-gradient(150deg, var(--choco-900), var(--choco-700))",
              }}
            >
              🎁
              {c.descuentoPct > 0 && (
                <span
                  className="absolute top-3 right-3 text-[12px] font-bold px-3 py-1.5 rounded-full text-white"
                  style={{ background: "var(--berry)" }}
                >
                  −{c.descuentoPct}%
                </span>
              )}
            </span>
          )}

          {/* Copy */}
          <span className="flex flex-col gap-1" style={{ padding: "16px 20px 20px" }}>
            <strong
              style={{ fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)", fontSize: 22, color: "var(--ink)", lineHeight: 1.15 }}
            >
              {c.nombre}
            </strong>
            <span className="text-[13.5px] font-bold" style={{ color: "var(--orange-ink)" }}>
              {c.tamano} postres{c.descuentoPct > 0 ? ` · ahorra ${c.descuentoPct}%` : ""}
            </span>
            {c.descripcion && (
              <span className="text-[14px]" style={{ color: "var(--ink-soft)", lineHeight: 1.5 }}>
                {c.descripcion}
              </span>
            )}
          </span>
        </button>
      ))}

      <style>{`
        .bl-caja-sizecard:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
          border-color: var(--orange);
        }
      `}</style>
    </div>
  );
}
