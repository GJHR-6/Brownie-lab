"use client";

// Etapa "cajas" del flujo de pedido (estilo Crumbl): el cliente llega desde
// la sección "Cajas" del menú con un tamaño elegido (initialCajaId) y llena
// la caja con steppers. Sin initialCajaId (p. ej. sesión restaurada) muestra
// primero las cards de tamaño.

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import CajaSizeCards from "@/components/caja/CajaSizeCards";
import CajaBuilder from "@/components/caja/CajaBuilder";
import type { CajaBuilderData } from "@/components/caja/types";

export default function StageCajas({
  builderData,
  initialCajaId,
  onBack,
  onSkip,
  onBoxAdded,
}: {
  builderData: CajaBuilderData;
  initialCajaId?: string;
  onBack: () => void;
  onSkip: () => void;
  onBoxAdded: () => void;
}) {
  const [view, setView] = useState<"size" | "build">(initialCajaId ? "build" : "size");
  const [selectedCajaId, setSelectedCajaId] = useState<string | null>(initialCajaId ?? null);

  // Sin cajas configuradas → directo al menú.
  const sinCajas = builderData.cajas.length === 0;
  useEffect(() => {
    if (sinCajas) onSkip();
  }, [sinCajas, onSkip]);
  if (sinCajas) return null;

  if (view === "build") {
    return (
      <div style={{ paddingBottom: 40 }}>
        <div className="mx-auto px-[var(--gutter)] pt-8" style={{ maxWidth: "var(--maxw)" }}>
          <button
            onClick={() => { if (initialCajaId) { onBack(); } else { setView("size"); } }}
            className="inline-flex items-center gap-2 font-bold text-[14px] cursor-pointer border-0 bg-transparent p-0"
            style={{ color: "var(--orange-ink)" }}
          >
            <ArrowLeft size={16} />
            {initialCajaId ? "Volver al menú" : "Cambiar tamaño de caja"}
          </button>
        </div>
        <CajaBuilder
          data={builderData}
          initialCajaId={selectedCajaId ?? undefined}
          showSizeSelector={false}
          addLabel="Agregar a la bolsa"
          onAdded={onBoxAdded}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto px-[var(--gutter)] py-12" style={{ maxWidth: "var(--maxw)" }}>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 font-bold text-[14px] cursor-pointer border-0 bg-transparent p-0 mb-6"
        style={{ color: "var(--orange-ink)" }}
      >
        <ArrowLeft size={16} />
        Volver
      </button>

      <div className="text-center mb-9">
        <h1
          className="font-bold mb-2"
          style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif", fontSize: 34, color: "var(--ink)" }}
        >
          Elige tu caja
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 15.5 }}>
          Entre más grande la caja, más ahorras.
        </p>
      </div>

      <CajaSizeCards
        cajas={builderData.cajas}
        onSelect={(cajaId) => { setSelectedCajaId(cajaId); setView("build"); }}
      />

      <div className="text-center mt-10">
        <button
          onClick={onSkip}
          className="font-semibold text-[15px] cursor-pointer border-0 bg-transparent underline underline-offset-4"
          style={{ color: "var(--ink-soft)" }}
        >
          Prefiero productos individuales
        </button>
      </div>
    </div>
  );
}
