"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storeConfig } from "@/config/store";
import { useCartStore } from "@/lib/cartStore";
import BLIcon from "@/components/BLIcon";

// ── Types ─────────────────────────────────────────────────────────────────────
type MainBase = "brownie" | "galleta";
interface CajaDef { id: string; nombre: string; descripcion: string; tamano: number; descuentoPct: number; }
interface ProductoLite { id: string; nombre: string; precio: number; emoji: string | null; imagen_url: string | null; }
interface Variant { id: string; name: string; desc: string; price: number; }
interface ToppingDef { name: string; price: number; imagen_url?: string | null; }

type SlotContent =
  | { tipo: "producto"; productoId: string; nombre: string; precio: number; emoji: string | null; imagenUrl: string | null }
  | { tipo: "custom"; nombre: string; precio: number; emoji: string; base: MainBase; varianteSlug: string; toppings: string[]; relleno: string | null };

const MAX_TOPPINGS = 2;
const round2 = (n: number) => Math.round(n * 100) / 100;

// ── Component ─────────────────────────────────────────────────────────────────
export default function CajasClient({
  cajas,
  productos,
  toppings,
  rellenos,
  brownies,
  galletas,
}: {
  cajas: CajaDef[];
  productos: ProductoLite[];
  toppings: ToppingDef[];
  rellenos: ToppingDef[];
  brownies: Variant[];
  galletas: Variant[];
}) {
  const sym = storeConfig.currencySymbol;
  const addItem = useCartStore(s => s.addItem);
  const router = useRouter();

  const [cajaIdx, setCajaIdx] = useState(0);
  const caja = cajas[Math.min(cajaIdx, Math.max(0, cajas.length - 1))] ?? null;

  const [slots, setSlots] = useState<(SlotContent | null)[]>(
    () => Array.from({ length: cajas[0]?.tamano ?? 0 }, () => null),
  );
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [pickerTab, setPickerTab] = useState<"menu" | "custom">("menu");

  // Estado del mini-personalizador (tab "Personalizado" del picker)
  const [cBase, setCBase] = useState<MainBase>("brownie");
  const [cVariantIdx, setCVariantIdx] = useState(0);
  const [cToppings, setCToppings] = useState<Set<string>>(new Set());
  const [cRelleno, setCRelleno] = useState<string | null>(null);

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

  function openPicker(slot: number) {
    setPickerSlot(slot);
    setPickerTab("menu");
    setCBase("brownie");
    setCVariantIdx(0);
    setCToppings(new Set());
    setCRelleno(null);
  }

  function fillSlot(content: SlotContent) {
    if (pickerSlot === null) return;
    setSlots(prev => prev.map((s, i) => (i === pickerSlot ? content : s)));
    setPickerSlot(null);
  }

  function clearSlot(i: number) {
    setSlots(prev => prev.map((s, j) => (j === i ? null : s)));
  }

  // ── Mini-personalizador ──
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
    fillSlot({
      tipo: "custom", nombre, precio: cPrice, emoji: cBase === "brownie" ? "🍫" : "🍪",
      base: cBase, varianteSlug: cVariant.id, toppings: selNames, relleno: cRellenoDef?.name ?? null,
    });
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
    router.push("/cart");
  }

  // ── Sin cajas configuradas ──
  if (!caja) {
    return (
      <section className="text-center" style={{ paddingBlock: "clamp(64px, 10vw, 120px)" }}>
        <p className="text-[17px]" style={{ color: "var(--ink-soft)" }}>
          Las cajas estarán disponibles muy pronto.
        </p>
        <Link href="/menu" className="inline-flex items-center gap-2 font-bold text-[15px] no-underline mt-4" style={{ color: "var(--orange-ink)" }}>
          Ver menú completo
          <BLIcon name="arrow-right" size={16} />
        </Link>
      </section>
    );
  }

  return (
    <>
      {/* ── Page header ── */}
      <section
        className="text-center"
        style={{
          color: "var(--on-dark)",
          background: "radial-gradient(110% 120% at 85% -10%, rgba(232,162,58,.25), transparent 55%), linear-gradient(150deg, var(--choco-900) 0%, var(--choco-700) 100%)",
          paddingBlock: "clamp(48px, 7vw, 76px)",
        }}
      >
        <div className="mx-auto px-[var(--gutter)]" style={{ maxWidth: "var(--maxw)" }}>
          <span className="inline-flex items-center gap-2 justify-center text-[12px] font-bold tracking-[0.22em] uppercase" style={{ color: "var(--amber)" }}>
            <BLIcon name="sparkle" size={15} />
            Ahorra en combo
          </span>
          <h1 className="font-extrabold mt-4 mb-3" style={{ fontSize: "clamp(40px, 6vw, 68px)", color: "var(--on-dark)" }}>
            Arma tu caja
          </h1>
          <p style={{ color: "var(--on-dark-soft)", fontSize: "clamp(16px, 1.4vw, 19px)", maxWidth: "46ch", marginInline: "auto" }}>
            Elige el tamaño, llénala con postres del menú o personalizados, y el descuento se aplica solo.
          </p>
        </div>
      </section>

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
                  <span className="flex-none grid place-items-center" style={{ width: 26, height: 26, borderRadius: 8, background: "var(--cream)", fontSize: 14 }}>
                    {s ? (s.tipo === "custom" ? s.emoji : s.emoji ?? "🧁") : i + 1}
                  </span>
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
              {allFilled ? "Agregar caja al carrito" : `Faltan ${caja.tamano - filled.length} postre${caja.tamano - filled.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>

        {/* ── Options panel ── */}
        <div>
          {/* Caja size selector */}
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
                  onClick={() => openPicker(i)}
                  className="w-full flex items-center gap-3 text-left cursor-pointer transition-all"
                  style={{
                    padding: "14px 16px", minHeight: 76,
                    borderRadius: "var(--r-md)",
                    border: s ? "1.5px solid var(--orange)" : "1.5px dashed var(--hairline)",
                    background: s ? "#fcf2e4" : "var(--paper-card)",
                  }}
                >
                  <span className="flex-none grid place-items-center" style={{ width: 44, height: 44, borderRadius: 13, background: s ? "#fff" : "var(--cream)", fontSize: 22 }}>
                    {s ? (s.tipo === "custom" ? s.emoji : s.emoji ?? "🧁") : "+"}
                  </span>
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

      {/* ── Back link ── */}
      <div className="text-center" style={{ paddingBottom: "clamp(40px,5vw,64px)" }}>
        <Link href="/menu" className="inline-flex items-center gap-2 font-bold text-[15px] no-underline" style={{ color: "var(--orange-ink)" }}>
          <BLIcon name="arrow-right" size={16} className="rotate-180" />
          Ver menú completo
        </Link>
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
          {allFilled ? `Agregar caja — ${sym}${total}` : `Faltan ${caja.tamano - filled.length} · ${sym}${total}`}
        </button>
      </div>

      {/* ── Picker modal ── */}
      {pickerSlot !== null && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(28,18,10,.45)", backdropFilter: "blur(3px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setPickerSlot(null); }}
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
                Postre {pickerSlot + 1} de {caja.tamano}
              </h3>
              <button
                onClick={() => setPickerSlot(null)}
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
                /* ── Tab: productos del menú ── */
                productos.length === 0 ? (
                  <p className="text-[15px]" style={{ color: "var(--ink-soft)" }}>No hay productos disponibles ahora mismo.</p>
                ) : (
                  <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    {productos.map(p => (
                      <button
                        key={p.id}
                        onClick={() => fillSlot({ tipo: "producto", productoId: p.id, nombre: p.nombre, precio: p.precio, emoji: p.emoji, imagenUrl: p.imagen_url })}
                        className="flex items-center gap-3 text-left cursor-pointer transition-all"
                        style={{ padding: "12px 14px", borderRadius: "var(--r-md)", border: "1.5px solid var(--hairline)", background: "var(--paper-card)" }}
                      >
                        {p.imagen_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imagen_url} alt="" style={{ width: 42, height: 42, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                        ) : (
                          <span className="flex-none grid place-items-center" style={{ width: 42, height: 42, borderRadius: 12, background: "var(--cream)", fontSize: 20 }}>
                            {p.emoji ?? "🧁"}
                          </span>
                        )}
                        <span style={{ flex: 1, minWidth: 0 }}>
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
