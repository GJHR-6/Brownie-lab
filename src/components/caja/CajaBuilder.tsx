"use client";

// Builder de cajas estilo Crumbl ("Select N Flavors"): imagen de la caja
// sticky a la izquierda con el resumen, y a la derecha la lista de postres
// con steppers de cantidad, agrupados por categoría. Compartido por /cajas
// y por la etapa "cajas" del flujo de pedido (/cart).

import { useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { storeConfig } from "@/config/store";
import { useCartStore } from "@/lib/cartStore";
import BLIcon from "@/components/BLIcon";
import CustomizerModal, { type CustomContent } from "./CustomizerModal";
import type { CajaBuilderData, ProductoLite } from "./types";
import { round2 } from "./types";

interface CustomRow { content: CustomContent; qty: number }

// Dos customs son "iguales" si comparten base, sabor, toppings y relleno.
function sameCustom(a: CustomContent, b: CustomContent): boolean {
  return a.base === b.base && a.varianteSlug === b.varianteSlug
    && a.relleno === b.relleno
    && a.toppings.length === b.toppings.length
    && a.toppings.every(t => b.toppings.includes(t));
}

export default function CajaBuilder({
  data,
  initialCajaId,
  showSizeSelector = true,
  addLabel = "Agregar a la bolsa",
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
  const { cajas, productos } = data;

  const initialIdx = Math.max(0, initialCajaId ? cajas.findIndex(c => c.id === initialCajaId) : 0);
  const [cajaIdx, setCajaIdx] = useState(initialIdx);
  const caja = cajas[Math.min(cajaIdx, Math.max(0, cajas.length - 1))] ?? null;

  const [qtyMenu, setQtyMenu] = useState<Record<string, number>>({});
  const [customs, setCustoms] = useState<CustomRow[]>([]);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  // ── Totales ──
  const elegidos = useMemo(
    () => Object.values(qtyMenu).reduce((s, q) => s + q, 0) + customs.reduce((s, c) => s + c.qty, 0),
    [qtyMenu, customs],
  );
  const tamano = caja?.tamano ?? 0;
  const completo = caja !== null && elegidos === tamano;
  const lleno = elegidos >= tamano;
  const subtotal = round2(
    productos.reduce((s, p) => s + p.precio * (qtyMenu[p.id] ?? 0), 0)
    + customs.reduce((s, c) => s + c.content.precio * c.qty, 0),
  );
  const pct = caja?.descuentoPct ?? 0;
  const total = round2(subtotal * (1 - pct / 100));
  const ahorro = round2(subtotal - total);

  function setQty(productoId: string, delta: number) {
    setQtyMenu(prev => {
      const current = prev[productoId] ?? 0;
      if (delta > 0 && lleno) return prev;
      const next = Math.max(0, current + delta);
      if (next === 0) { const rest = { ...prev }; delete rest[productoId]; return rest; }
      return { ...prev, [productoId]: next };
    });
  }

  function setCustomQty(idx: number, delta: number) {
    setCustoms(prev => {
      if (delta > 0 && lleno) return prev;
      return prev
        .map((c, i) => (i === idx ? { ...c, qty: Math.max(0, c.qty + delta) } : c))
        .filter(c => c.qty > 0);
    });
  }

  function addCustom(content: CustomContent) {
    setCustomizerOpen(false);
    if (lleno) return;
    setCustoms(prev => {
      const idx = prev.findIndex(c => sameCustom(c.content, content));
      if (idx >= 0) return prev.map((c, i) => (i === idx ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { content, qty: 1 }];
    });
  }

  function selectCaja(i: number) {
    if (i === cajaIdx) return;
    setCajaIdx(i);
    // Las selecciones se conservan; si sobran, el botón de agregar lo indica.
  }

  // ── Agregar a la bolsa ──
  function handleAddToCart() {
    if (!caja || !completo) return;

    const elegidosMenu = productos.filter(p => (qtyMenu[p.id] ?? 0) > 0);
    const partes: { nombre: string; precio: number; qty: number }[] = [
      ...elegidosMenu.map(p => ({ nombre: p.nombre, precio: p.precio, qty: qtyMenu[p.id] })),
      ...customs.map(c => ({ nombre: c.content.nombre, precio: c.content.precio, qty: c.qty })),
    ];
    const resumen = partes.map(p => (p.qty > 1 ? `${p.qty}× ${p.nombre}` : p.nombre)).join(", ");
    const detalle = [
      ...partes.map(p => `${p.qty}× ${p.nombre}`),
      ...(ahorro > 0 ? [`Descuento ${pct}% −${sym}${ahorro}`] : []),
    ].join(" · ");

    // Expandir cantidades → slots (mismo contrato que valida el servidor)
    const slots = [
      ...elegidosMenu.flatMap(p =>
        Array.from({ length: qtyMenu[p.id] }, () => ({ tipo: "producto" as const, productoId: p.id }))),
      ...customs.flatMap(c =>
        Array.from({ length: c.qty }, () => ({
          tipo: "custom" as const,
          base: c.content.base,
          varianteSlug: c.content.varianteSlug,
          toppings: c.content.toppings,
          relleno: c.content.relleno,
        }))),
    ];

    addItem({
      id: `caja-${crypto.randomUUID()}`,
      name: `${caja.nombre}: ${resumen}`,
      price: total,
      emoji: "🎁",
      detalle,
      imagen: caja.imagenUrl ?? undefined,
      composicion: { tipo: "caja", cajaId: caja.id, slots },
    });
    onAdded();
  }

  if (!caja) return null;

  // Productos agrupados por categoría (equivalente a Weekly/Classic Flavors)
  const grupos = productos.reduce<Record<string, ProductoLite[]>>((acc, p) => {
    const key = p.categoria || "otros";
    (acc[key] ??= []).push(p);
    return acc;
  }, {});

  const faltan = tamano - elegidos;

  const addBtnLabel = completo
    ? `${addLabel} — ${sym}${total}`
    : faltan > 0
      ? `Faltan ${faltan} postre${faltan !== 1 ? "s" : ""}`
      : `Sobran ${-faltan} — quita alguno`;

  return (
    <>
      <div
        className="mx-auto px-[var(--gutter)] bl-caja-grid"
        style={{ maxWidth: "var(--maxw)", paddingBlock: "clamp(40px, 5vw, 64px)" }}
      >
        {/* ── Izquierda: imagen de la caja + resumen (sticky) ── */}
        <div className="bl-caja-summary-col">
          {/* PNG de la caja, sin marco, flotante estilo Crumbl */}
          {caja.imagenUrl ? (
            <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
              <Image
                src={caja.imagenUrl}
                alt={caja.nombre}
                fill
                className="object-contain"
                sizes="(max-width: 920px) 100vw, 45vw"
                style={{ filter: "drop-shadow(0 18px 28px rgba(60,32,14,.22))" }}
              />
            </div>
          ) : (
            <div
              className="grid place-items-center w-full rounded-[24px]"
              style={{
                aspectRatio: "4/3",
                fontSize: 72,
                background:
                  "repeating-linear-gradient(135deg, rgba(246,234,212,.06) 0 10px, rgba(246,234,212,0) 10px 20px), linear-gradient(150deg, var(--choco-900), var(--choco-700))",
              }}
            >
              🎁
            </div>
          )}

          <div
            className="rounded-[24px] p-[24px] mt-4"
            style={{ background: "var(--paper-card)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-md)" }}
          >
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: "var(--ink-soft)" }}>Tu caja</p>
            <p className="mt-1 font-bold text-[20px]" style={{ fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)", color: "var(--ink)" }}>
              {caja.nombre}
            </p>
            <p className="text-[14px] mt-0.5" style={{ color: completo ? "#1f8a5b" : "var(--ink-soft)" }}>
              {elegidos}/{tamano} postres elegidos
            </p>

            {(elegidos > 0) && (
              <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {productos.filter(p => (qtyMenu[p.id] ?? 0) > 0).map(p => (
                  <li key={p.id} className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--ink)" }}>
                    <span className="font-bold" style={{ color: "var(--orange-ink)", minWidth: 26 }}>{qtyMenu[p.id]}×</span>
                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</span>
                    <span className="font-semibold shrink-0" style={{ color: "var(--ink-soft)" }}>{sym}{round2(p.precio * qtyMenu[p.id])}</span>
                  </li>
                ))}
                {customs.map((c, i) => (
                  <li key={i} className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--ink)" }}>
                    <span className="font-bold" style={{ color: "var(--orange-ink)", minWidth: 26 }}>{c.qty}×</span>
                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.content.nombre}</span>
                    <span className="font-semibold shrink-0" style={{ color: "var(--ink-soft)" }}>{sym}{round2(c.content.precio * c.qty)}</span>
                  </li>
                ))}
              </ul>
            )}

            <hr style={{ border: 0, borderTop: "1px solid var(--hairline)", margin: "16px 0" }} />

            <div className="flex flex-col gap-1.5 text-[14px]">
              <div className="flex justify-between" style={{ color: "var(--ink-soft)" }}>
                <span>Subtotal</span>
                <span>{sym}{subtotal}</span>
              </div>
              <div className="flex justify-between font-semibold" style={{ color: pct > 0 ? "#1f8a5b" : "var(--ink-soft)" }}>
                <span>Descuento {pct}%</span>
                <span>−{sym}{ahorro}</span>
              </div>
              <div className="flex justify-between font-extrabold text-[17px] mt-1" style={{ color: "var(--ink)" }}>
                <span>Total</span>
                <span style={{ color: "var(--orange-ink)" }}>{sym}{total}</span>
              </div>
            </div>

            {/* Agregar — desktop */}
            <button
              onClick={handleAddToCart}
              disabled={!completo}
              className="hidden lg:inline-flex w-full mt-5 items-center justify-center gap-2 font-bold text-[15px] py-3.5 rounded-full text-white border-0 transition-colors"
              style={{
                background: completo ? "var(--orange)" : "var(--hairline)",
                boxShadow: completo ? "0 6px 18px rgba(217,113,30,.32)" : "none",
                cursor: completo ? "pointer" : "not-allowed",
              }}
            >
              <BLIcon name="cart" size={18} />
              {addBtnLabel}
            </button>
          </div>
        </div>

        {/* ── Derecha: selector de tamaño + lista con steppers ── */}
        <div>
          {showSizeSelector && cajas.length > 1 && (
            <>
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase mb-[11px]" style={{ color: "var(--ink-soft)" }}>
                Elige el tamaño
              </p>
              <div className="grid gap-3 mb-[22px]" style={{ gridTemplateColumns: `repeat(${Math.min(cajas.length, 3)}, 1fr)` }}>
                {cajas.map((c, i) => {
                  const on = i === cajaIdx;
                  return (
                    <button
                      key={c.id}
                      onClick={() => selectCaja(i)}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                        padding: "14px 18px", textAlign: "left", cursor: "pointer", transition: "all .15s",
                        borderRadius: "var(--r-md)", border: "1.5px solid",
                        background: on ? "var(--choco-900)" : "var(--paper-card)",
                        borderColor: on ? "var(--choco-900)" : "var(--hairline)",
                      }}
                    >
                      <strong style={{ fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)", fontSize: 18, color: on ? "var(--on-dark)" : "var(--ink)" }}>
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

          <h2 className="font-bold mb-1" style={{ fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)", fontSize: "clamp(24px,3vw,32px)", color: "var(--ink)" }}>
            Elige {tamano} postre{tamano !== 1 ? "s" : ""}
          </h2>
          <p className="mb-5 text-[15px]" style={{ color: "var(--ink-soft)" }}>
            {completo ? "¡Caja completa! Agrégala a tu bolsa." : "Usa + y − para armar tu combinación."}
          </p>

          {/* Grupos por categoría */}
          {Object.entries(grupos).map(([cat, prods]) => (
            <div key={cat} className="mb-5">
              <div
                className="flex items-center justify-between px-4 py-2 rounded-[10px] mb-1"
                style={{ background: "var(--cream)", border: "1px solid var(--hairline)" }}
              >
                <span className="font-bold text-[13px] capitalize" style={{ color: "var(--ink)" }}>{cat}s</span>
              </div>
              <div className="flex flex-col">
                {prods.map(p => {
                  const q = qtyMenu[p.id] ?? 0;
                  return (
                    <div key={p.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: "1px solid var(--hairline)" }}>
                      {p.imagen_url ? (
                        <span className="relative flex-none block overflow-hidden" style={{ width: 44, height: 44, borderRadius: "50%" }}>
                          <Image src={p.imagen_url} alt="" fill className="object-cover" sizes="44px" />
                        </span>
                      ) : (
                        <span className="flex-none grid place-items-center" style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--cream)", fontSize: 20 }}>
                          {p.emoji ?? "🧁"}
                        </span>
                      )}
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="block font-semibold text-[14.5px] leading-tight" style={{ color: "var(--ink)" }}>{p.nombre}</span>
                        <span className="text-[13px] font-bold" style={{ color: "var(--orange-ink)" }}>{sym}{p.precio}</span>
                      </span>
                      <Stepper
                        qty={q}
                        onMinus={() => setQty(p.id, -1)}
                        onPlus={() => setQty(p.id, 1)}
                        plusDisabled={lleno}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Personalizados */}
          {(data.brownies.length > 0 || data.galletas.length > 0) && (
            <div className="mb-5">
              <div
                className="flex items-center justify-between px-4 py-2 rounded-[10px] mb-1"
                style={{ background: "rgba(232,162,58,.16)", border: "1px solid var(--hairline)" }}
              >
                <span className="font-bold text-[13px]" style={{ color: "var(--ink)" }}>Personalizados</span>
                <span className="text-[12px] font-semibold" style={{ color: "var(--ink-soft)" }}>Tú eliges base y toppings</span>
              </div>
              <div className="flex flex-col">
                {customs.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5" style={{ borderBottom: "1px solid var(--hairline)" }}>
                    <span className="flex-none grid place-items-center" style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--cream)", fontSize: 20 }}>
                      {c.content.emoji}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="block font-semibold text-[14.5px] leading-tight" style={{ color: "var(--ink)" }}>{c.content.nombre}</span>
                      <span className="text-[13px] font-bold" style={{ color: "var(--orange-ink)" }}>{sym}{c.content.precio}</span>
                    </span>
                    <Stepper
                      qty={c.qty}
                      onMinus={() => setCustomQty(i, -1)}
                      onPlus={() => setCustomQty(i, 1)}
                      plusDisabled={lleno}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setCustomizerOpen(true)}
                disabled={lleno}
                className="mt-3 inline-flex items-center gap-2 font-bold text-[14px] px-5 py-2.5 rounded-full transition-colors border"
                style={{
                  background: "transparent",
                  borderColor: lleno ? "var(--hairline)" : "var(--orange)",
                  color: lleno ? "var(--ink-soft)" : "var(--orange-ink)",
                  cursor: lleno ? "not-allowed" : "pointer",
                }}
              >
                <Plus size={15} />
                Crear postre personalizado
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Botón sticky móvil ── */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 p-4 z-30"
        style={{ background: "rgba(251,246,236,.92)", backdropFilter: "blur(10px)", borderTop: "1px solid var(--hairline)" }}
      >
        <button
          onClick={handleAddToCart}
          disabled={!completo}
          className="w-full inline-flex items-center justify-center gap-2 font-bold text-[15px] py-4 rounded-full text-white border-0 transition-colors"
          style={{
            background: completo ? "var(--orange)" : "var(--hairline)",
            boxShadow: completo ? "0 6px 18px rgba(217,113,30,.32)" : "none",
            cursor: completo ? "pointer" : "not-allowed",
          }}
        >
          <BLIcon name="cart" size={18} />
          {completo ? addBtnLabel : `${addBtnLabel} · ${sym}${total}`}
        </button>
      </div>

      {/* ── Modal personalizador ── */}
      {customizerOpen && (
        <CustomizerModal data={data} onConfirm={addCustom} onClose={() => setCustomizerOpen(false)} />
      )}

      <style>{`
        .bl-caja-grid {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: clamp(28px, 4vw, 56px);
          align-items: start;
        }
        .bl-caja-summary-col { position: sticky; top: 96px; }

        @media (max-width: 920px) {
          .bl-caja-grid { grid-template-columns: 1fr; }
          .bl-caja-summary-col { position: static; }
        }
      `}</style>
    </>
  );
}

function Stepper({ qty, onMinus, onPlus, plusDisabled }: { qty: number; onMinus: () => void; onPlus: () => void; plusDisabled: boolean }) {
  return (
    <div className="inline-flex items-center overflow-hidden shrink-0" style={{ border: "1.5px solid var(--hairline)", borderRadius: "var(--r-pill)", background: "var(--paper-card)" }}>
      <button
        onClick={onMinus}
        disabled={qty === 0}
        aria-label="Quitar uno"
        className="w-8 h-8 grid place-items-center border-0 bg-transparent"
        style={{ color: qty === 0 ? "var(--hairline)" : "var(--ink)", cursor: qty === 0 ? "default" : "pointer" }}
      >
        <Minus size={14} />
      </button>
      <span className="text-center font-bold text-sm" style={{ minWidth: 22, color: qty > 0 ? "var(--orange-ink)" : "var(--ink-soft)" }}>{qty}</span>
      <button
        onClick={onPlus}
        disabled={plusDisabled}
        aria-label="Agregar uno"
        className="w-8 h-8 grid place-items-center border-0 bg-transparent"
        style={{ color: plusDisabled ? "var(--hairline)" : "var(--ink)", cursor: plusDisabled ? "default" : "pointer" }}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
