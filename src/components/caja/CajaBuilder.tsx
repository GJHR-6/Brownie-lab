"use client";

// Núcleo del armador de cajas: selector de tamaño, grid de slots, resumen
// sticky con totales y botón de agregar. Compartido por /cajas y por la
// etapa "cajas" del flujo de pedido (/cart).

import { useMemo, useState } from "react";
import Image from "next/image";
import { storeConfig } from "@/config/store";
import { useCartStore } from "@/lib/cartStore";
import BLIcon from "@/components/BLIcon";
import SlotPickerModal from "./SlotPickerModal";
import type { CajaBuilderData, SlotContent } from "./types";
import { round2 } from "./types";

export default function CajaBuilder({
  data,
  initialCajaId,
  showSizeSelector = true,
  addLabel = "Agregar caja al carrito",
  onAdded,
}: {
  data: CajaBuilderData;
  initialCajaId?: string;
  showSizeSelector?: boolean;
  addLabel?: string;
  onAdded: () => void;
}) {
  const sym = storeConfig.currencySymbol;
  const addItem = useCartStore(s => s.addItem);
  const { cajas } = data;

  const initialIdx = Math.max(0, initialCajaId ? cajas.findIndex(c => c.id === initialCajaId) : 0);
  const [cajaIdx, setCajaIdx] = useState(initialIdx);
  const caja = cajas[Math.min(cajaIdx, Math.max(0, cajas.length - 1))] ?? null;

  const [slots, setSlots] = useState<(SlotContent | null)[]>(
    () => Array.from({ length: cajas[initialIdx]?.tamano ?? 0 }, () => null),
  );
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);

  function selectCaja(i: number) {
    if (i === cajaIdx) return;
    setCajaIdx(i);
    const tam = cajas[i]?.tamano ?? 0;
    setSlots(prev => {
      const next = prev.slice(0, tam);
      while (next.length < tam) next.push(null);
      return next;
    });
  }

  function fillSlot(content: SlotContent) {
    if (pickerSlot === null) return;
    setSlots(prev => prev.map((s, i) => (i === pickerSlot ? content : s)));
    setPickerSlot(null);
  }

  function clearSlot(i: number) {
    setSlots(prev => prev.map((s, j) => (j === i ? null : s)));
  }

  // ── Totales ──
  const filled = useMemo(() => slots.filter((s): s is SlotContent => s !== null), [slots]);
  const allFilled = caja !== null && filled.length === caja.tamano;
  const subtotal = round2(filled.reduce((s, i) => s + i.precio, 0));
  const pct = caja?.descuentoPct ?? 0;
  const total = round2(subtotal * (1 - pct / 100));
  const ahorro = round2(subtotal - total);

  function handleAddToCart() {
    if (!caja || !allFilled) return;
    const counts = new Map<string, number>();
    filled.forEach(s => counts.set(s.nombre, (counts.get(s.nombre) ?? 0) + 1));
    const resumen = [...counts].map(([n, c]) => (c > 1 ? `${c}× ${n}` : n)).join(", ");
    const detalle = [
      ...filled.map(s => `${s.nombre} ${sym}${s.precio}`),
      ...(ahorro > 0 ? [`Descuento ${pct}% −${sym}${ahorro}`] : []),
    ].join(" · ");
    addItem({
      id: `caja-${crypto.randomUUID()}`,
      name: `${caja.nombre}: ${resumen}`,
      price: total,
      emoji: "🎁",
      detalle,
      composicion: {
        tipo: "caja",
        cajaId: caja.id,
        slots: filled.map(s => s.tipo === "producto"
          ? { tipo: "producto" as const, productoId: s.productoId }
          : { tipo: "custom" as const, base: s.base, varianteSlug: s.varianteSlug, toppings: s.toppings, relleno: s.relleno }),
      },
    });
    onAdded();
  }

  if (!caja) return null;

  // Miniatura de un slot: foto del producto si existe, si no emoji.
  function slotThumb(s: SlotContent | null, size: number, fontSize: number, empty: string | number) {
    if (s && s.tipo === "producto" && s.imagenUrl) {
      return (
        <span className="relative flex-none block overflow-hidden" style={{ width: size, height: size, borderRadius: Math.round(size * 0.3) }}>
          <Image src={s.imagenUrl} alt="" fill className="object-cover" sizes={`${size}px`} />
        </span>
      );
    }
    return (
      <span className="flex-none grid place-items-center" style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), background: s ? "#fff" : "var(--cream)", fontSize }}>
        {s ? s.emoji ?? "🧁" : empty}
      </span>
    );
  }

  return (
    <>
      {/* ── Builder grid ── */}
      <div
        className="mx-auto px-[var(--gutter)] bl-caja-grid"
        style={{ maxWidth: "var(--maxw)", paddingBlock: "clamp(48px, 6vw, 80px)" }}
      >
        {/* ── Summary (sticky left on desktop) ── */}
        <div className="bl-caja-summary-col">
          <div
            className="rounded-[24px] p-[26px]"
            style={{ background: "var(--paper-card)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-md)" }}
          >
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: "var(--ink-soft)" }}>Tu caja</p>
            <p className="mt-1 font-bold text-[19px]" style={{ fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)", color: "var(--ink)" }}>
              {caja.nombre} · {filled.length}/{caja.tamano}
            </p>

            {/* Contents */}
            <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {slots.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-[14px]" style={{ color: s ? "var(--ink)" : "var(--ink-soft)" }}>
                  {slotThumb(s, 26, 14, i + 1)}
                  {s ? (
                    <>
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nombre}</span>
                      <span className="font-semibold shrink-0" style={{ color: "var(--orange-ink)" }}>{sym}{s.precio}</span>
                    </>
                  ) : (
                    <span style={{ flex: 1 }}>Espacio vacío</span>
                  )}
                </li>
              ))}
            </ul>

            <hr style={{ border: 0, borderTop: "1px solid var(--hairline)", margin: "18px 0" }} />

            {/* Totals */}
            <div className="flex flex-col gap-1.5 text-[14px]">
              <div className="flex justify-between" style={{ color: "var(--ink-soft)" }}>
                <span>Subtotal</span>
                <span>{sym}{subtotal}</span>
              </div>
              <div className="flex justify-between font-semibold" style={{ color: pct > 0 ? "#1f8a5b" : "var(--ink-soft)" }}>
                <span>Descuento {pct}%</span>
                <span>−{sym}{ahorro}</span>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase" style={{ color: "var(--ink-soft)" }}>Total de la caja</p>
              <p
                className="font-extrabold mt-1"
                style={{ fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)", fontSize: "clamp(34px,4.5vw,44px)", color: "var(--orange-ink)", lineHeight: 1.1 }}
              >
                {sym}{total}
              </p>
              {ahorro > 0 && (
                <p className="text-[13px] font-semibold mt-1" style={{ color: "#1f8a5b" }}>
                  Ahorras {sym}{ahorro}
                </p>
              )}
            </div>

            {/* Add to cart — desktop */}
            <button
              onClick={handleAddToCart}
              disabled={!allFilled}
              className="hidden lg:inline-flex w-full mt-5 items-center justify-center gap-2 font-bold text-[15px] py-3.5 rounded-full text-white border-0 transition-colors"
              style={{
                background: allFilled ? "var(--orange)" : "var(--hairline)",
                boxShadow: allFilled ? "0 6px 18px rgba(217,113,30,.32)" : "none",
                cursor: allFilled ? "pointer" : "not-allowed",
              }}
            >
              <BLIcon name="cart" size={18} />
              {allFilled ? addLabel : `Faltan ${caja.tamano - filled.length} postre${caja.tamano - filled.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>

        {/* ── Options panel ── */}
        <div>
          {/* Caja size selector */}
          {showSizeSelector && (
            <>
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase mb-[11px]" style={{ color: "var(--ink-soft)" }}>
                Elige el tamaño
              </p>
              <div className="grid gap-3 mb-[26px]" style={{ gridTemplateColumns: `repeat(${Math.min(cajas.length, 3)}, 1fr)` }}>
                {cajas.map((c, i) => {
                  const on = i === cajaIdx;
                  return (
                    <button
                      key={c.id}
                      onClick={() => selectCaja(i)}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                        padding: "16px 20px", textAlign: "left", cursor: "pointer", transition: "all .15s",
                        borderRadius: "var(--r-md)", border: "1.5px solid",
                        background: on ? "var(--choco-900)" : "var(--paper-card)",
                        borderColor: on ? "var(--choco-900)" : "var(--hairline)",
                      }}
                    >
                      <strong style={{ fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)", fontSize: 19, color: on ? "var(--on-dark)" : "var(--ink)" }}>
                        {c.nombre}
                      </strong>
                      <span style={{ fontSize: 13, color: on ? "var(--on-dark-soft)" : "var(--ink-soft)" }}>
                        {c.tamano} postres{c.descuentoPct > 0 ? ` · −${c.descuentoPct}%` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Slots */}
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <h2 className="font-bold" style={{ fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)", fontSize: "clamp(22px,2.6vw,28px)", color: "var(--ink)" }}>
              Llena tu caja
            </h2>
            <span className="text-[13px] font-semibold shrink-0" style={{ color: allFilled ? "#1f8a5b" : "var(--ink-soft)" }}>
              {filled.length}/{caja.tamano}
            </span>
          </div>
          <p className="mb-5 text-[15px]" style={{ color: "var(--ink-soft)" }}>
            {allFilled ? "¡Caja completa! Agrégala al carrito." : "Toca un espacio para elegir el postre que va ahí."}
          </p>

          <div className="bl-caja-slots grid gap-3">
            {slots.map((s, i) => (
              <div key={i} style={{ position: "relative" }}>
                <button
                  onClick={() => setPickerSlot(i)}
                  className="w-full flex items-center gap-3 text-left cursor-pointer transition-all"
                  style={{
                    padding: "14px 16px", minHeight: 76,
                    borderRadius: "var(--r-md)",
                    border: s ? "1.5px solid var(--orange)" : "1.5px dashed var(--hairline)",
                    background: s ? "#fcf2e4" : "var(--paper-card)",
                  }}
                >
                  {slotThumb(s, 44, 22, "+")}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    {s ? (
                      <>
                        <span className="block font-semibold text-[14px] leading-tight" style={{ color: "var(--ink)" }}>{s.nombre}</span>
                        <span className="text-[13px] font-bold" style={{ color: "var(--orange-ink)" }}>{sym}{s.precio}</span>
                      </>
                    ) : (
                      <span className="block font-semibold text-[14px]" style={{ color: "var(--ink-soft)" }}>Elegir postre</span>
                    )}
                  </span>
                </button>
                {s && (
                  <button
                    onClick={() => clearSlot(i)}
                    aria-label="Quitar del espacio"
                    className="absolute grid place-items-center cursor-pointer"
                    style={{ top: -7, right: -7, width: 22, height: 22, borderRadius: "50%", background: "var(--berry)", color: "#fff", border: "none", fontSize: 11, fontWeight: 700 }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile sticky add button ── */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 p-4 z-30"
        style={{ background: "rgba(251,246,236,.92)", backdropFilter: "blur(10px)", borderTop: "1px solid var(--hairline)" }}
      >
        <button
          onClick={handleAddToCart}
          disabled={!allFilled}
          className="w-full inline-flex items-center justify-center gap-2 font-bold text-[15px] py-4 rounded-full text-white border-0 transition-colors"
          style={{
            background: allFilled ? "var(--orange)" : "var(--hairline)",
            boxShadow: allFilled ? "0 6px 18px rgba(217,113,30,.32)" : "none",
            cursor: allFilled ? "pointer" : "not-allowed",
          }}
        >
          <BLIcon name="cart" size={18} />
          {allFilled ? `${addLabel} — ${sym}${total}` : `Faltan ${caja.tamano - filled.length} · ${sym}${total}`}
        </button>
      </div>

      {/* ── Picker modal ── */}
      {pickerSlot !== null && (
        <SlotPickerModal
          slotIndex={pickerSlot}
          tamano={caja.tamano}
          data={data}
          onSelect={fillSlot}
          onClose={() => setPickerSlot(null)}
        />
      )}

      <style>{`
        .bl-caja-grid {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: clamp(28px, 4vw, 56px);
          align-items: start;
        }
        .bl-caja-summary-col { position: sticky; top: 96px; }
        .bl-caja-slots { grid-template-columns: 1fr 1fr; }

        @media (max-width: 920px) {
          .bl-caja-grid { grid-template-columns: 1fr; }
          .bl-caja-summary-col { position: static; order: 2; }
        }
        @media (max-width: 560px) {
          .bl-caja-slots { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
