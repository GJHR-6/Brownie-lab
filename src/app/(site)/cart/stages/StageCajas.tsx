"use client";

// Etapa "cajas" del flujo de pedido (estilo Crumbl): tras resolver la
// ubicación, el cliente elige un tamaño de caja y la llena con postres.
// Ruta secundaria: "Prefiero productos individuales" → menú clásico.

import { useEffect, useState } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useHydrated } from "@/hooks/useHydrated";
import { useCartStore } from "@/lib/cartStore";
import CajaSizeCards from "@/components/caja/CajaSizeCards";
import CajaBuilder from "@/components/caja/CajaBuilder";
import type { CajaBuilderData } from "@/components/caja/types";

export default function StageCajas({
  builderData,
  onBack,
  onSkip,
  onBoxAdded,
}: {
  builderData: CajaBuilderData;
  onBack: () => void;
  onSkip: () => void;
  onBoxAdded: () => void;
}) {
  const [view, setView] = useState<"size" | "build">("size");
  const [selectedCajaId, setSelectedCajaId] = useState<string | null>(null);
  const mounted = useHydrated();
  const itemCount = useCartStore(s => s.itemCount());

  // Sin cajas configuradas → directo al menú clásico.
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
            onClick={() => setView("size")}
            className="inline-flex items-center gap-2 font-bold text-[14px] cursor-pointer border-0 bg-transparent p-0"
            style={{ color: "var(--orange-ink)" }}
          >
            <ArrowLeft size={16} />
            Cambiar tamaño de caja
          </button>
        </div>
        <CajaBuilder
          data={builderData}
          initialCajaId={selectedCajaId ?? undefined}
          showSizeSelector={false}
          addLabel="Agregar al pedido"
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

      {/* Ya hay items en la bolsa */}
      {mounted && itemCount > 0 && (
        <div
          className="flex items-center gap-3 mx-auto mb-8 px-5 py-3.5 rounded-[16px]"
          style={{ maxWidth: 560, background: "var(--paper-card)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-sm)" }}
        >
          <ShoppingBag size={20} style={{ color: "var(--orange-ink)", flexShrink: 0 }} />
          <p className="flex-1 text-[14px] m-0" style={{ color: "var(--ink)" }}>
            Ya tienes <strong>{itemCount}</strong> {itemCount === 1 ? "artículo" : "artículos"} en tu bolsa.
          </p>
          <button
            onClick={onSkip}
            className="font-bold text-[14px] cursor-pointer border-0 bg-transparent p-0 shrink-0"
            style={{ color: "var(--orange-ink)" }}
          >
            Ver menú
          </button>
        </div>
      )}

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
