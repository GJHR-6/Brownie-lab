"use client";

// Modal para elegir el contenido de un slot de la caja.
// Tab "Del menú": grid de productos con foto grande (estilo Crumbl).
// Tab "Personalizado": mini-personalizador (base + sabor + relleno + toppings).
// El estado del personalizador vive aquí — el mount/unmount del modal lo resetea.

import { useState } from "react";
import Image from "next/image";
import { storeConfig } from "@/config/store";
import type { CajaBuilderData, MainBase, SlotContent } from "./types";
import { MAX_TOPPINGS, round2 } from "./types";

export default function SlotPickerModal({
  slotIndex,
  tamano,
  data,
  onSelect,
  onClose,
}: {
  slotIndex: number;
  tamano: number;
  data: CajaBuilderData;
  onSelect: (content: SlotContent) => void;
  onClose: () => void;
}) {
  const sym = storeConfig.currencySymbol;
  const { productos, toppings, rellenos, brownies, galletas } = data;

  const [pickerTab, setPickerTab] = useState<"menu" | "custom">("menu");

  // Estado del mini-personalizador (tab "Personalizado")
  const [cBase, setCBase] = useState<MainBase>("brownie");
  const [cVariantIdx, setCVariantIdx] = useState(0);
  const [cToppings, setCToppings] = useState<Set<string>>(new Set());
  const [cRelleno, setCRelleno] = useState<string | null>(null);

  const cVariants = cBase === "brownie" ? brownies : galletas;
  const cSafeIdx = Math.min(cVariantIdx, Math.max(0, cVariants.length - 1));
  const cVariant = cVariants[cSafeIdx] ?? null;
  const cRellenoDef = cBase === "galleta" && cRelleno
    ? rellenos.find(r => r.name === cRelleno) ?? null
    : null;
  const cToppingsPrice = toppings.filter(t => cToppings.has(t.name)).reduce((s, t) => s + t.price, 0);
  const cPrice = round2((cVariant?.price ?? 0) + (cRellenoDef?.price ?? 0) + cToppingsPrice);

  function switchCBase(b: MainBase) {
    if (b === cBase) return;
    setCBase(b);
    setCVariantIdx(0);
    setCToppings(new Set());
    setCRelleno(null);
  }

  function toggleCTopping(name: string) {
    setCToppings(prev => {
      const n = new Set(prev);
      if (n.has(name)) { n.delete(name); return n; }
      if (n.size >= MAX_TOPPINGS) return prev;
      n.add(name);
      return n;
    });
  }

  function confirmCustom() {
    if (!cVariant) return;
    const selNames = toppings.filter(t => cToppings.has(t.name)).map(t => t.name);
    const nombre = `${cBase === "brownie" ? "Brownie" : "Galleta"} ${cVariant.name}${
      cRellenoDef ? ` rellena de ${cRellenoDef.name}` : ""
    }${selNames.length > 0 ? ` con ${selNames.join(", ")}` : ""}`;
    onSelect({
      tipo: "custom", nombre, precio: cPrice, emoji: cBase === "brownie" ? "🍫" : "🍪",
      base: cBase, varianteSlug: cVariant.id, toppings: selNames, relleno: cRellenoDef?.name ?? null,
    });
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(28,18,10,.45)", backdropFilter: "blur(3px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ background: "var(--paper, #fbf6ec)", borderRadius: "var(--r-lg, 20px)", boxShadow: "var(--shadow-lg)", width: "100%", maxWidth: 640, maxHeight: "88vh", overflowY: "auto" }}
      >
        {/* Modal header */}
        <div
          className="flex items-center gap-3"
          style={{ padding: "18px 22px", borderBottom: "1px solid var(--hairline)", background: "var(--paper-card)", position: "sticky", top: 0, zIndex: 1 }}
        >
          <h3 className="font-bold text-[19px] flex-1 m-0" style={{ fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)", color: "var(--ink)" }}>
            Postre {slotIndex + 1} de {tamano}
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="grid place-items-center cursor-pointer"
            style={{ width: 32, height: 32, borderRadius: 8, background: "none", border: "none", color: "var(--ink-soft)", fontSize: 20 }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2" style={{ padding: "14px 22px 0" }}>
          {([["menu", "Del menú"], ["custom", "Personalizado"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPickerTab(key)}
              className="font-bold text-[14px] cursor-pointer transition-all"
              style={{
                padding: "8px 18px", borderRadius: "var(--r-pill, 999px)", border: "1.5px solid",
                background: pickerTab === key ? "var(--choco-900)" : "var(--paper-card)",
                borderColor: pickerTab === key ? "var(--choco-900)" : "var(--hairline)",
                color: pickerTab === key ? "var(--on-dark)" : "var(--ink)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding: "18px 22px 24px" }}>
          {pickerTab === "menu" ? (
            /* ── Tab: productos del menú — cards con foto grande ── */
            productos.length === 0 ? (
              <p className="text-[15px]" style={{ color: "var(--ink-soft)" }}>No hay productos disponibles ahora mismo.</p>
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                {productos.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onSelect({ tipo: "producto", productoId: p.id, nombre: p.nombre, precio: p.precio, emoji: p.emoji, imagenUrl: p.imagen_url })}
                    className="flex flex-col text-left cursor-pointer transition-all overflow-hidden"
                    style={{ padding: 0, borderRadius: "var(--r-md)", border: "1.5px solid var(--hairline)", background: "var(--paper-card)" }}
                  >
                    {p.imagen_url ? (
                      <span className="relative block w-full" style={{ aspectRatio: "4/3" }}>
                        <Image src={p.imagen_url} alt={p.nombre} fill className="object-cover" sizes="(max-width: 640px) 50vw, 300px" />
                      </span>
                    ) : (
                      <span className="grid place-items-center w-full" style={{ aspectRatio: "4/3", background: "var(--cream)", fontSize: 44 }}>
                        {p.emoji ?? "🧁"}
                      </span>
                    )}
                    <span style={{ padding: "10px 14px 12px" }}>
                      <span className="block font-semibold text-[14px] leading-tight" style={{ color: "var(--ink)" }}>{p.nombre}</span>
                      <span className="text-[13px] font-bold" style={{ color: "var(--orange-ink)" }}>{sym}{p.precio}</span>
                    </span>
                  </button>
                ))}
              </div>
            )
          ) : (
            /* ── Tab: mini-personalizador ── */
            <div className="flex flex-col gap-5">
              {/* Base */}
              <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                {(["brownie", "galleta"] as const).map(b => (
                  <button
                    key={b}
                    onClick={() => switchCBase(b)}
                    className="font-bold text-[15px] cursor-pointer transition-all"
                    style={{
                      padding: "12px 16px", borderRadius: "var(--r-md)", border: "1.5px solid",
                      background: cBase === b ? "var(--choco-900)" : "var(--paper-card)",
                      borderColor: cBase === b ? "var(--choco-900)" : "var(--hairline)",
                      color: cBase === b ? "var(--on-dark)" : "var(--ink)",
                    }}
                  >
                    {b === "brownie" ? "🍫 Brownie" : "🍪 Galleta"}
                  </button>
                ))}
              </div>

              {/* Sabor */}
              <div>
                <p className="text-[11px] font-bold tracking-[0.16em] uppercase mb-2" style={{ color: "var(--ink-soft)" }}>Sabor</p>
                <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                  {cVariants.map((v, i) => {
                    const on = i === cSafeIdx;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setCVariantIdx(i)}
                        className="text-left cursor-pointer transition-all"
                        style={{
                          padding: "10px 14px", borderRadius: "var(--r-md)", border: "1.5px solid",
                          borderColor: on ? "var(--orange)" : "var(--hairline)",
                          background: on ? "#fcf2e4" : "var(--paper-card)",
                        }}
                      >
                        <span className="block font-semibold text-[14px]" style={{ color: on ? "var(--orange-ink)" : "var(--ink)" }}>{v.name}</span>
                        <span className="text-[12.5px]" style={{ color: "var(--ink-soft)" }}>{sym}{v.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Relleno — solo galletas */}
              {cBase === "galleta" && rellenos.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] uppercase mb-2" style={{ color: "var(--ink-soft)" }}>Relleno (opcional)</p>
                  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                    {rellenos.map(r => {
                      const on = cRelleno === r.name;
                      return (
                        <button
                          key={r.name}
                          onClick={() => setCRelleno(prev => (prev === r.name ? null : r.name))}
                          className="text-left cursor-pointer transition-all"
                          style={{
                            padding: "10px 14px", borderRadius: "var(--r-md)", border: "1.5px solid",
                            borderColor: on ? "var(--orange)" : "var(--hairline)",
                            background: on ? "#fcf2e4" : "var(--paper-card)",
                          }}
                        >
                          <span className="block font-semibold text-[14px]" style={{ color: on ? "var(--orange-ink)" : "var(--ink)" }}>{r.name}</span>
                          <span className="text-[12.5px] font-bold" style={{ color: "var(--orange-ink)" }}>+{sym}{r.price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Toppings */}
              {toppings.length > 0 && (
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-[11px] font-bold tracking-[0.16em] uppercase m-0" style={{ color: "var(--ink-soft)" }}>Toppings</p>
                    <span className="text-[12px] font-semibold" style={{ color: cToppings.size >= MAX_TOPPINGS ? "var(--berry)" : "var(--ink-soft)" }}>
                      {cToppings.size}/{MAX_TOPPINGS}
                    </span>
                  </div>
                  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                    {toppings.map(t => {
                      const on = cToppings.has(t.name);
                      return (
                        <button
                          key={t.name}
                          onClick={() => toggleCTopping(t.name)}
                          className="text-left cursor-pointer transition-all"
                          style={{
                            padding: "10px 14px", borderRadius: "var(--r-md)", border: "1.5px solid",
                            borderColor: on ? "var(--orange)" : "var(--hairline)",
                            background: on ? "#fcf2e4" : "var(--paper-card)",
                          }}
                        >
                          <span className="block font-semibold text-[14px]" style={{ color: on ? "var(--orange-ink)" : "var(--ink)" }}>{t.name}</span>
                          <span className="text-[12.5px] font-bold" style={{ color: "var(--orange-ink)" }}>+{sym}{t.price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Confirm */}
              <button
                onClick={confirmCustom}
                disabled={!cVariant}
                className="w-full inline-flex items-center justify-center gap-2 font-bold text-[15px] py-3.5 rounded-full text-white border-0 transition-colors"
                style={{
                  background: cVariant ? "var(--orange)" : "var(--hairline)",
                  boxShadow: cVariant ? "0 6px 18px rgba(217,113,30,.32)" : "none",
                  cursor: cVariant ? "pointer" : "not-allowed",
                }}
              >
                Agregar a la caja — {sym}{cPrice}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
