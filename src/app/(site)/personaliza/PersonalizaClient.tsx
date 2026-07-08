"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storeConfig } from "@/config/store";
import { useCartStore } from "@/lib/cartStore";
import BLIcon from "@/components/BLIcon";
import {
  brownieDefs,
  toppingArt,
  toppingIconStable,
  order as toppingOrder,
  spots,
  chunkSpots,
} from "@/lib/brownieArt";

// ── Types ─────────────────────────────────────────────────────────────────────
type MainBase = "brownie" | "galleta";
interface Variant { id: string; name: string; desc: string; price: number; img: string; proximamente?: boolean; }
interface ToppingDef { name: string; price: number; imagen_url?: string | null; }

const MAX_TOPPINGS = 2;

function minAvailablePrice(variants: Variant[]): number | null {
  const available = variants.filter(v => !v.proximamente);
  if (available.length === 0) return null;
  return Math.min(...available.map(v => v.price));
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PersonalizaClient({
  toppings,
  rellenos,
  brownies,
  galletas,
}: {
  toppings: ToppingDef[];
  rellenos: ToppingDef[];
  brownies: Variant[];
  galletas: Variant[];
}) {
  const TOPPINGS = toppings;
  const RELLENOS = rellenos;
  const [base, setBase] = useState<MainBase>("brownie");
  const [brownieVariantIdx, setBrownieVariantIdx] = useState(0);
  const [galletaVariantIdx, setGalletaVariantIdx] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [relleno, setRelleno] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const addItem = useCartStore(s => s.addItem);
  const router = useRouter();

  const activeVariants = base === "brownie" ? brownies : galletas;
  const activeVariantIdx = base === "brownie" ? brownieVariantIdx : galletaVariantIdx;
  const safeIdx = Math.min(activeVariantIdx, Math.max(0, activeVariants.length - 1));
  const activeVariant = activeVariants[safeIdx] ?? { id: '', name: '', desc: '', price: 0, img: '' };
  const sym = storeConfig.currencySymbol;

  function switchBase(b: MainBase) {
    if (b === base) return;
    setBase(b);
    setSelected(new Set());
    setRelleno(null);
  }
  function setVariantIdx(i: number) {
    if (base === "brownie") setBrownieVariantIdx(i);
    else setGalletaVariantIdx(i);
  }
  function toggleTopping(name: string) {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(name)) { n.delete(name); return n; }
      if (n.size >= MAX_TOPPINGS) return prev;
      n.add(name);
      return n;
    });
  }

  const selectedNames = useMemo(
    () => toppingOrder.filter(n => selected.has(n)),
    [selected],
  );
  const extraPrice = useMemo(
    () => TOPPINGS.filter(t => selected.has(t.name)).reduce((s, t) => s + t.price, 0),
    [selected, TOPPINGS],
  );
  // Relleno: solo galletas, selección única
  const rellenoDef = base === "galleta" && relleno
    ? RELLENOS.find(r => r.name === relleno) ?? null
    : null;
  const unitPrice = activeVariant.price + (rellenoDef?.price ?? 0) + extraPrice;
  const totalPrice = unitPrice * qty;

  // Topping placements for the SVG stage
  const placements = useMemo(
    () => chunkSpots(spots(base), selectedNames),
    [base, selectedNames],
  );

  // Stable idle animation delay per topping-spot key — hash determinista
  // (sin Math.random: puro, mismo resultado en server y cliente)
  function idleDelay(key: string): number {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 9973;
    return -((h % 300) / 100); // 0 a -2.99s
  }

  const llevaBase = rellenoDef
    ? `${activeVariant.name} · relleno de ${rellenoDef.name}`
    : activeVariant.name;
  const llevaText = selectedNames.length === 0
    ? `${llevaBase} · sin toppings`
    : `${llevaBase} · ${selectedNames.join(" · ")}`;

  const itemName = `${base === "brownie" ? "Brownie" : "Galleta"} ${activeVariant.name}${
    rellenoDef ? ` rellena de ${rellenoDef.name}` : ""
  }${
    selectedNames.length > 0 ? ` con ${selectedNames.join(", ")}` : ""
  }`;

  function handleAddToCart() {
    const id = `custom-${crypto.randomUUID()}`;
    const emoji = base === "brownie" ? "🍫" : "🍪";
    const sym = storeConfig.currencySymbol;
    const detalle = [
      `${activeVariant.name} ${sym}${activeVariant.price}`,
      ...(rellenoDef ? [`Relleno de ${rellenoDef.name} +${sym}${rellenoDef.price}`] : []),
      ...TOPPINGS.filter(t => selected.has(t.name)).map(t => `${t.name} +${sym}${t.price}`),
    ].join(" · ");
    const composicion = {
      tipo: "custom" as const,
      base,
      varianteSlug: activeVariant.id,
      toppings: selectedNames,
      relleno: rellenoDef?.name ?? null,
    };
    for (let i = 0; i < qty; i++)
      addItem({ id: i === 0 ? id : `${id}-${i}`, name: itemName, price: unitPrice, emoji, detalle, composicion });
    router.push("/cart");
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
            Interactivo
          </span>
          <h1 className="font-extrabold mt-4 mb-3" style={{ fontSize: "clamp(40px, 6vw, 68px)", color: "var(--on-dark)" }}>
            Arma tu postre
          </h1>
          <p style={{ color: "var(--on-dark-soft)", fontSize: "clamp(16px, 1.4vw, 19px)", maxWidth: "44ch", marginInline: "auto" }}>
            Elige la base, agrégale los toppings que quieras y míralo cobrar forma. Lo que ves es lo que pides.
          </p>
        </div>
      </section>

      {/* ── Builder grid ── */}
      <div
        className="mx-auto px-[var(--gutter)] bl-builder-grid"
        style={{ maxWidth: "var(--maxw)", paddingBlock: "clamp(48px, 6vw, 80px)" }}
      >
        {/* ── Preview (sticky left on desktop, top on mobile) ── */}
        <div className="bl-preview-col">
          <div
            className="rounded-[24px] p-[30px]"
            style={{ background: "var(--paper-card)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-md)" }}
          >
            {/* Illustrated stage */}
            <div className="bl-stage" style={{ width: "100%", maxWidth: 360, margin: "2px auto 6px", position: "relative" }}>
              {/* Base illustration — sits under the SVG toppings layer */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeVariant.img}
                alt=""
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "2.778%",
                  top: "19.69%",
                  width: "94.444%",
                  height: "60.625%",
                  objectFit: "contain",
                  objectPosition: "center",
                  pointerEvents: "none",
                  transition: "opacity 0.25s ease",
                }}
              />
              {/* SVG toppings overlay */}
              <svg
                viewBox="0 0 360 320"
                role="img"
                aria-label="Vista previa del postre"
                style={{ width: "100%", height: "auto", overflow: "visible", display: "block", position: "relative" }}
              >
                <defs dangerouslySetInnerHTML={{ __html: brownieDefs }} suppressHydrationWarning />
                {placements.map(({ name, spot }, i) => {
                  const key = `${name}-${spot[0]}-${spot[1]}`;
                  const artFn = toppingArt[name];
                  const delay = idleDelay(`${i}-${name}`);
                  return (
                    <g key={key} transform={`translate(${spot[0]},${spot[1]})`} className="bl-topping">
                      <g className="bl-bump">
                        {artFn ? (
                          <g
                            className="bl-idle"
                            style={{ animationDelay: `${delay.toFixed(2)}s` }}
                            dangerouslySetInnerHTML={{ __html: artFn() }}
                          />
                        ) : (
                          /* Generic blob for custom toppings without SVG art */
                          <g className="bl-idle" style={{ animationDelay: `${delay.toFixed(2)}s` }}>
                            <ellipse cx="1" cy="13" rx="11" ry="3.2" fill="rgba(0,0,0,.18)" />
                            <circle cx="0" cy="0" r="11" fill="#d97826" stroke="#9a5310" strokeWidth="1.5" />
                            <ellipse cx="-3" cy="-4" rx="4" ry="2.5" fill="rgba(255,255,255,.42)" />
                          </g>
                        )}
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Lleva */}
            <div className="text-center mt-2">
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: "var(--ink-soft)" }}>Lleva</p>
              <p className="mt-1 text-[15px]" style={{ color: "var(--ink)", minHeight: 22 }}>{llevaText}</p>
            </div>

            <hr style={{ border: 0, borderTop: "1px solid var(--hairline)", margin: "22px 0" }} />

            {/* Quantity stepper */}
            <div className="flex items-center justify-center gap-4">
              <span className="text-[11px] font-bold tracking-[0.16em] uppercase" style={{ color: "var(--ink-soft)" }}>Cantidad</span>
              <div className="inline-flex items-center overflow-hidden" style={{ border: "1.5px solid var(--hairline)", borderRadius: "var(--r-pill)" }}>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-[38px] h-[38px] grid place-items-center border-0 cursor-pointer transition-colors"
                  style={{ background: "transparent", color: "var(--ink)" }}
                  onMouseOver={e => (e.currentTarget.style.background = "var(--cream)")}
                  onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                  aria-label="Menos"
                >
                  <BLIcon name="minus" size={16} />
                </button>
                <span className="w-[26px] text-center font-bold text-[15px]" style={{ color: "var(--ink)" }}>{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(50, q + 1))}
                  className="w-[38px] h-[38px] grid place-items-center border-0 cursor-pointer transition-colors"
                  style={{ background: "transparent", color: "var(--ink)" }}
                  onMouseOver={e => (e.currentTarget.style.background = "var(--cream)")}
                  onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                  aria-label="Más"
                >
                  <BLIcon name="plus" size={16} />
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="text-center mt-5">
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase" style={{ color: "var(--ink-soft)" }}>Total estimado</p>
              <p
                className="font-extrabold mt-1"
                style={{ fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)", fontSize: "clamp(36px,5vw,48px)", color: "var(--orange-ink)", lineHeight: 1.1 }}
              >
                {sym}{totalPrice}
              </p>
            </div>

            {/* Add to cart — desktop */}
            <button
              onClick={handleAddToCart}
              className="hidden lg:inline-flex w-full mt-5 items-center justify-center gap-2 font-bold text-[15px] py-3.5 rounded-full text-white border-0 cursor-pointer transition-colors"
              style={{ background: "var(--orange)", boxShadow: "0 6px 18px rgba(217,113,30,.32)" }}
            >
              <BLIcon name="cart" size={18} />
              Agregar al carrito{qty > 1 ? ` (${qty})` : ""}
            </button>
          </div>
        </div>

        {/* ── Options panel ── */}
        <div>
          {/* Main base selector */}
          <div className="grid gap-3 mb-[22px]" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {(["brownie", "galleta"] as const).map(b => {
              const variants = b === "brownie" ? brownies : galletas;
              const desde = minAvailablePrice(variants);
              const subline = b === "brownie"
                ? `Base de chocolate${desde != null ? ` · desde ${sym}${desde}` : ""}`
                : `Base de mantequilla${desde != null ? ` · desde ${sym}${desde}` : ""}`;
              return (
                <button
                  key={b}
                  onClick={() => switchBase(b)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                    padding: "16px 20px", textAlign: "left", cursor: "pointer", transition: "all .15s",
                    borderRadius: "var(--r-md)", border: "1.5px solid",
                    background: base === b ? "var(--choco-900)" : "var(--paper-card)",
                    borderColor: base === b ? "var(--choco-900)" : "var(--hairline)",
                  }}
                >
                  <strong style={{ fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)", fontSize: 19, color: base === b ? "var(--on-dark)" : "var(--ink)" }}>
                    {b === "brownie" ? "Brownie" : "Galleta"}
                  </strong>
                  <span style={{ fontSize: 13, color: base === b ? "var(--on-dark-soft)" : "var(--ink-soft)" }}>
                    {subline}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Variant selector */}
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase mb-[11px]" style={{ color: "var(--ink-soft)" }}>
            Elige el sabor
          </p>
          <div className="bl-variants-grid grid gap-3 mb-6">
            {activeVariants.map((v, i) => {
              const on = i === activeVariantIdx;
              const prox = !!v.proximamente;
              return (
                <button
                  key={v.id}
                  onClick={() => !prox && setVariantIdx(i)}
                  disabled={prox}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3,
                    padding: "13px 16px", textAlign: "left", transition: "all .15s",
                    borderRadius: "var(--r-md)", border: "1.5px solid",
                    borderColor: prox ? "var(--hairline)" : on ? "var(--orange)" : "var(--hairline)",
                    background: prox ? "var(--cream-200)" : on ? "#fcf2e4" : "var(--paper-card)",
                    boxShadow: on && !prox ? "0 0 0 3px rgba(217,113,30,.12)" : "none",
                    cursor: prox ? "not-allowed" : "pointer",
                    opacity: prox ? 0.7 : 1,
                    position: "relative",
                  }}
                >
                  <strong style={{ fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)", fontSize: 17, color: prox ? "var(--ink-soft)" : on ? "var(--orange-ink)" : "var(--ink)", lineHeight: 1.08 }}>
                    {v.name}
                  </strong>
                  {prox ? (
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
                      Próximamente
                    </span>
                  ) : (
                    <span style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.3 }}>{v.desc} · {sym}{v.price}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Relleno — solo galletas, selección única */}
          {base === "galleta" && RELLENOS.length > 0 && (
            <>
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <h2 className="font-bold" style={{ fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)", fontSize: "clamp(22px,2.6vw,28px)", color: "var(--ink)" }}>
                  Elige tu relleno
                </h2>
                <span className="text-[13px] font-semibold shrink-0" style={{ color: "var(--ink-soft)" }}>
                  {relleno ? "1/1" : "0/1"}
                </span>
              </div>
              <p className="mb-5 text-[15px]" style={{ color: "var(--ink-soft)" }}>
                Opcional. Toca uno para elegirlo; toca de nuevo para quitarlo.
              </p>
              <div className="bl-toppings-grid grid gap-3 mb-6">
                {RELLENOS.map(r => {
                  const isOn = relleno === r.name;
                  return (
                    <button
                      key={r.name}
                      onClick={() => setRelleno(prev => (prev === r.name ? null : r.name))}
                      className="relative flex items-center gap-3 text-left cursor-pointer transition-all"
                      style={{
                        padding: "14px 16px",
                        borderRadius: "var(--r-md)", border: "1.5px solid",
                        background: "var(--paper-card)",
                        borderColor: isOn ? "var(--orange)" : "var(--hairline)",
                        boxShadow: isOn ? "0 0 0 3px rgba(217,113,30,.14)" : "none",
                        transform: isOn ? "translateY(-1px)" : "none",
                      }}
                    >
                      {r.imagen_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.imagen_url}
                          alt={r.name}
                          style={{ width: 44, height: 44, borderRadius: 13, objectFit: "cover", flexShrink: 0, border: isOn ? "1.5px solid var(--orange)" : "1px solid var(--hairline)" }}
                        />
                      ) : (
                        <span
                          className="flex-none grid place-items-center"
                          style={{ width: 44, height: 44, borderRadius: 13, background: isOn ? "#fff" : "var(--cream)", fontSize: 22 }}
                        >
                          🍯
                        </span>
                      )}
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="block font-semibold text-[15px] leading-tight" style={{ color: "var(--ink)" }}>
                          {r.name}
                        </span>
                        <span className="text-[13px] font-bold" style={{ color: "var(--orange-ink)" }}>
                          +{sym}{r.price}
                        </span>
                      </span>
                      {isOn && (
                        <span
                          className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full grid place-items-center"
                          style={{ background: "var(--orange)", color: "#fff", fontSize: 10, fontWeight: 700 }}
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Toppings */}
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <h2 className="font-bold" style={{ fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)", fontSize: "clamp(22px,2.6vw,28px)", color: "var(--ink)" }}>
              Elige tus toppings
            </h2>
            <span
              className="text-[13px] font-semibold shrink-0"
              style={{ color: selected.size >= MAX_TOPPINGS ? "var(--berry)" : "var(--ink-soft)" }}
            >
              {selected.size}/{MAX_TOPPINGS}
            </span>
          </div>
          <p className="mb-5 text-[15px]" style={{ color: "var(--ink-soft)" }}>
            {selected.size >= MAX_TOPPINGS
              ? "Llegaste al máximo. Quitá uno para cambiar."
              : "Toca cada uno para agregarlo o quitarlo de tu postre."}
          </p>

          <div className="bl-toppings-grid grid gap-3">
            {TOPPINGS.map(topping => {
              const isOn = selected.has(topping.name);
              const iconSvg = toppingIconStable(topping.name);
              return (
                <button
                  key={topping.name}
                  onClick={() => toggleTopping(topping.name)}
                  className="relative flex items-center gap-3 text-left cursor-pointer transition-all"
                  style={{
                    padding: "14px 16px",
                    borderRadius: "var(--r-md)", border: "1.5px solid",
                    background: "var(--paper-card)",
                    borderColor: isOn ? "var(--orange)" : "var(--hairline)",
                    boxShadow: isOn ? "0 0 0 3px rgba(217,113,30,.14)" : "none",
                    transform: isOn ? "translateY(-1px)" : "none",
                  }}
                >
                  {/* Illustrated mini-icon — SVG art, uploaded image, or fallback */}
                  {iconSvg ? (
                    <span
                      className="flex-none grid place-items-center overflow-hidden"
                      style={{
                        width: 44, height: 44, borderRadius: 13,
                        background: isOn ? "#fff" : "var(--cream)",
                        boxShadow: isOn ? "inset 0 0 0 1px rgba(217,113,30,.35)" : "inset 0 0 0 1px rgba(0,0,0,.05)",
                      }}
                      suppressHydrationWarning
                      dangerouslySetInnerHTML={{ __html: iconSvg }}
                    />
                  ) : topping.imagen_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={topping.imagen_url}
                      alt={topping.name}
                      style={{ width: 44, height: 44, borderRadius: 13, objectFit: "cover", flexShrink: 0, border: isOn ? "1.5px solid var(--orange)" : "1px solid var(--hairline)" }}
                    />
                  ) : (
                    <span
                      className="flex-none grid place-items-center"
                      style={{ width: 44, height: 44, borderRadius: 13, background: isOn ? "#fff" : "var(--cream)", fontSize: 22 }}
                    >
                      ✨
                    </span>
                  )}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="block font-semibold text-[15px] leading-tight" style={{ color: "var(--ink)" }}>
                      {topping.name}
                    </span>
                    <span className="text-[13px] font-bold" style={{ color: "var(--orange-ink)" }}>
                      +{sym}{topping.price}
                    </span>
                  </span>
                  {/* Check indicator */}
                  {isOn && (
                    <span
                      className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full grid place-items-center"
                      style={{ background: "var(--orange)", color: "#fff", fontSize: 10, fontWeight: 700 }}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selected.size > 0 && (
            <button
              onClick={() => setSelected(new Set())}
              className="mt-4 text-[14px] underline cursor-pointer border-0 bg-transparent"
              style={{ color: "var(--ink-soft)" }}
            >
              Limpiar selección
            </button>
          )}
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
          className="w-full inline-flex items-center justify-center gap-2 font-bold text-[15px] py-4 rounded-full text-white border-0 cursor-pointer transition-colors"
          style={{ background: "var(--orange)", boxShadow: "0 6px 18px rgba(217,113,30,.32)" }}
        >
          <BLIcon name="cart" size={18} />
          Agregar al carrito{qty > 1 ? ` (${qty})` : ""} — {sym}{totalPrice}
        </button>
      </div>

      <style>{`
        /* Builder layout */
        .bl-builder-grid {
          display: grid;
          grid-template-columns: 1.05fr .95fr;
          gap: clamp(28px, 4vw, 56px);
          align-items: start;
        }
        .bl-preview-col { position: sticky; top: 96px; }
        /* auto-fill + minmax: las variantes envuelven a la siguiente fila en vez de desbordar */
        .bl-variants-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
        .bl-toppings-grid { grid-template-columns: 1fr 1fr; }

        /* Topping drop-in animation */
        .bl-bump { opacity: 0; }
        .bl-topping .bl-bump { opacity: 1; animation: bl-drop .42s cubic-bezier(.34,1.6,.5,1); }
        @keyframes bl-drop {
          0%   { transform: translateY(-11px); }
          60%  { transform: translateY(2px); }
          100% { transform: translateY(0); }
        }
        /* Idle sway */
        .bl-idle {
          transform-box: fill-box;
          transform-origin: center bottom;
          animation: bl-idle 3.2s ease-in-out infinite;
        }
        @keyframes bl-idle {
          0%, 100% { transform: rotate(-1.8deg); }
          50%       { transform: rotate(1.8deg); }
        }
        /* Coconut-specific animations */
        .coco-wv {
          transform-box: fill-box;
          transform-origin: center;
          animation: coco-wv 2.1s ease-in-out infinite;
        }
        @keyframes coco-wv {
          0%, 100% { transform: translateY(.5px) rotate(-1.2deg); }
          50%       { transform: translateY(-.6px) rotate(1.2deg); }
        }
        .coco-tw { transform-box: fill-box; animation: coco-tw 1.5s ease-in-out infinite; }
        @keyframes coco-tw { 0%, 100% { opacity: .2; } 45% { opacity: 1; } }

        @media (prefers-reduced-motion: reduce) {
          .bl-topping .bl-bump { animation: none; }
          .bl-idle { animation: none; }
          .coco-wv, .coco-tw { animation: none; }
        }
        @media (max-width: 920px) {
          .bl-builder-grid { grid-template-columns: 1fr; }
          .bl-preview-col { position: static; order: -1; }
        }
        @media (max-width: 640px) {
          .bl-toppings-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
