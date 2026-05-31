"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storeConfig } from "@/config/store";
import { useCartStore } from "@/lib/cartStore";
import BLIcon from "@/components/BLIcon";

type BaseId = "brownie" | "galleta";

interface Topping {
  id: string;
  name: string;
  price: number;
  color: string;
  shape: "circle" | "drop" | "chip" | "shard" | "blob";
  positions: { x: number; y: number; r: number; rotate?: number }[];
}

const BASE_PRICES: Record<BaseId, number> = {
  brownie: 40,
  galleta: 35,
};

const BASES: { id: BaseId; name: string; description: string }[] = [
  {
    id: "brownie",
    name: "Brownie",
    description: "Base de chocolate oscuro, húmedo y esponjoso",
  },
  {
    id: "galleta",
    name: "Galleta",
    description: "Clásica cookie dorada, crujiente por fuera",
  },
];

const TOPPINGS: Topping[] = [
  {
    id: "pecanas",
    name: "Pecanas",
    price: 10,
    color: "#92400e",
    shape: "blob",
    positions: [
      { x: 28, y: 25, r: 11, rotate: 20 },
      { x: 68, y: 38, r: 10, rotate: -15 },
      { x: 45, y: 65, r: 11, rotate: 35 },
      { x: 20, y: 72, r: 9, rotate: -30 },
      { x: 78, y: 70, r: 10, rotate: 10 },
    ],
  },
  {
    id: "chispas",
    name: "Chispas de Chocolate",
    price: 8,
    color: "#1c0a00",
    shape: "drop",
    positions: [
      { x: 22, y: 30, r: 7 },
      { x: 50, y: 20, r: 6 },
      { x: 75, y: 32, r: 7 },
      { x: 35, y: 55, r: 6 },
      { x: 65, y: 60, r: 7 },
      { x: 20, y: 68, r: 6 },
      { x: 80, y: 72, r: 7 },
      { x: 48, y: 78, r: 6 },
    ],
  },
  {
    id: "arandanos",
    name: "Arándanos",
    price: 10,
    color: "#4c1d95",
    shape: "circle",
    positions: [
      { x: 30, y: 28, r: 9 },
      { x: 65, y: 25, r: 8 },
      { x: 48, y: 50, r: 9 },
      { x: 22, y: 65, r: 8 },
      { x: 75, y: 68, r: 9 },
    ],
  },
  {
    id: "caramelo",
    name: "Caramelo",
    price: 6,
    color: "#d97706",
    shape: "shard",
    positions: [
      { x: 50, y: 20, r: 30, rotate: 0 },
      { x: 50, y: 50, r: 40, rotate: 15 },
    ],
  },
  {
    id: "coco",
    name: "Coco Rallado",
    price: 5,
    color: "#fef3c7",
    shape: "shard",
    positions: [
      { x: 25, y: 25, r: 14, rotate: 30 },
      { x: 70, y: 30, r: 13, rotate: -20 },
      { x: 35, y: 60, r: 15, rotate: 45 },
      { x: 72, y: 65, r: 13, rotate: 10 },
      { x: 50, y: 78, r: 14, rotate: -35 },
    ],
  },
  {
    id: "sal",
    name: "Sal de Mar",
    price: 3,
    color: "#f0fdf4",
    shape: "chip",
    positions: [
      { x: 20, y: 25, r: 4 },
      { x: 55, y: 18, r: 3 },
      { x: 78, y: 35, r: 4 },
      { x: 30, y: 58, r: 3 },
      { x: 65, y: 55, r: 4 },
      { x: 18, y: 72, r: 3 },
      { x: 82, y: 70, r: 4 },
      { x: 48, y: 82, r: 3 },
      { x: 40, y: 38, r: 3 },
      { x: 70, y: 80, r: 4 },
    ],
  },
  {
    id: "almendras",
    name: "Almendras",
    price: 10,
    color: "#c8a86b",
    shape: "blob",
    positions: [
      { x: 30, y: 30, r: 13, rotate: 40 },
      { x: 68, y: 28, r: 12, rotate: -25 },
      { x: 22, y: 68, r: 13, rotate: 15 },
      { x: 72, y: 68, r: 12, rotate: -40 },
    ],
  },
  {
    id: "frambuesas",
    name: "Frambuesas",
    price: 12,
    color: "#e11d48",
    shape: "circle",
    positions: [
      { x: 28, y: 32, r: 11 },
      { x: 68, y: 28, r: 10 },
      { x: 45, y: 60, r: 11 },
      { x: 18, y: 70, r: 10 },
      { x: 78, y: 72, r: 11 },
    ],
  },
];

function ToppingShape({ topping, pos }: { topping: Topping; pos: (typeof TOPPINGS)[0]["positions"][0] }) {
  const cx = pos.x;
  const cy = pos.y;
  const r = pos.r;
  const rotate = pos.rotate ?? 0;

  if (topping.shape === "circle") {
    return (
      <g transform={`rotate(${rotate} ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={r} fill={topping.color} opacity="0.92" />
        <circle cx={cx - r * 0.25} cy={cy - r * 0.25} r={r * 0.2} fill="white" opacity="0.3" />
      </g>
    );
  }

  if (topping.shape === "drop") {
    return (
      <g transform={`translate(${cx} ${cy})`}>
        <path
          d={`M0,-${r} C${r * 0.8},-${r * 0.2} ${r * 0.6},${r * 0.6} 0,${r} C-${r * 0.6},${r * 0.6} -${r * 0.8},-${r * 0.2} 0,-${r}Z`}
          fill={topping.color}
          opacity="0.95"
        />
      </g>
    );
  }

  if (topping.shape === "chip") {
    return (
      <rect
        x={cx - r}
        y={cy - r * 0.6}
        width={r * 2}
        height={r * 1.2}
        rx={r * 0.3}
        fill={topping.color}
        opacity="0.85"
        transform={`rotate(${rotate} ${cx} ${cy})`}
      />
    );
  }

  if (topping.shape === "shard") {
    return (
      <g transform={`translate(${cx} ${cy}) rotate(${rotate})`}>
        <path
          d={`M0,-${r * 0.15} L${r * 0.5},0 L0,${r * 0.15} L-${r * 0.5},0 Z`}
          fill={topping.color}
          opacity="0.75"
        />
      </g>
    );
  }

  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate})`}>
      <ellipse cx={0} cy={0} rx={r} ry={r * 0.6} fill={topping.color} opacity="0.9" />
      <ellipse cx={r * 0.15} cy={-r * 0.1} rx={r * 0.3} ry={r * 0.2} fill="white" opacity="0.2" />
    </g>
  );
}

function BrownieSVG({ selected }: { selected: Set<string> }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
      <defs>
        <radialGradient id="brownieGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="60%" stopColor="#451a03" />
          <stop offset="100%" stopColor="#1c0a00" />
        </radialGradient>
        <radialGradient id="brownieSheen" cx="30%" cy="25%" r="55%">
          <stop offset="0%" stopColor="#92400e" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#451a03" stopOpacity="0" />
        </radialGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.4" />
        </filter>
        <clipPath id="brownieClip">
          <rect x="8" y="8" width="84" height="84" rx="10" />
        </clipPath>
      </defs>
      <rect x="8" y="8" width="84" height="84" rx="10" fill="url(#brownieGrad)" filter="url(#shadow)" />
      <rect x="8" y="8" width="84" height="84" rx="10" fill="url(#brownieSheen)" />
      <rect x="8" y="8" width="84" height="84" rx="10" fill="none" stroke="#92400e" strokeWidth="1.5" opacity="0.4" />
      <g clipPath="url(#brownieClip)" opacity="0.15">
        <line x1="8" y1="35" x2="92" y2="35" stroke="#78350f" strokeWidth="0.5" />
        <line x1="8" y1="65" x2="92" y2="65" stroke="#78350f" strokeWidth="0.5" />
        <line x1="35" y1="8" x2="35" y2="92" stroke="#78350f" strokeWidth="0.5" />
        <line x1="65" y1="8" x2="65" y2="92" stroke="#78350f" strokeWidth="0.5" />
      </g>
      <g clipPath="url(#brownieClip)">
        {TOPPINGS.filter((t) => selected.has(t.id)).map((topping) =>
          topping.positions.map((pos, i) => (
            <g key={`${topping.id}-${i}`} style={{ animation: "popIn 0.3s ease" }}>
              <ToppingShape topping={topping} pos={pos} />
            </g>
          ))
        )}
      </g>
      <rect x="8" y="8" width="84" height="30" rx="10" fill="white" opacity="0.04" />
    </svg>
  );
}

function GalletaSVG({ selected }: { selected: Set<string> }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
      <defs>
        <radialGradient id="cookieGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="55%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        <radialGradient id="cookieSheen" cx="30%" cy="25%" r="55%">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
        </radialGradient>
        <filter id="shadow2">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
        </filter>
        <clipPath id="cookieClip">
          <circle cx="50" cy="50" r="42" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="42" fill="url(#cookieGrad)" filter="url(#shadow2)" />
      <circle cx="50" cy="50" r="42" fill="url(#cookieSheen)" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#b45309" strokeWidth="2" opacity="0.5" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#fef3c7" strokeWidth="0.5" opacity="0.2" />
      <g clipPath="url(#cookieClip)" opacity="0.12">
        <path d="M30 30 Q50 45 70 35" stroke="#92400e" strokeWidth="1" fill="none" />
        <path d="M25 60 Q45 55 60 70" stroke="#92400e" strokeWidth="1" fill="none" />
        <path d="M60 28 Q55 50 70 65" stroke="#92400e" strokeWidth="1" fill="none" />
      </g>
      <g clipPath="url(#cookieClip)">
        {TOPPINGS.filter((t) => selected.has(t.id)).map((topping) =>
          topping.positions.map((pos, i) => (
            <g key={`${topping.id}-${i}`}>
              <ToppingShape topping={topping} pos={pos} />
            </g>
          ))
        )}
      </g>
      <ellipse cx="40" cy="35" rx="18" ry="10" fill="white" opacity="0.06" transform="rotate(-15 40 35)" />
    </svg>
  );
}

export default function PersonalizaPage() {
  const [base, setBase] = useState<BaseId>("brownie");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  function toggleTopping(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedToppings = TOPPINGS.filter((t) => selected.has(t.id));
  const unitPrice = BASE_PRICES[base] + selectedToppings.reduce((sum, t) => sum + t.price, 0);
  const totalPrice = unitPrice * qty;

  const baseName = base === "brownie" ? "Brownie" : "Galleta";
  const toppingsText = selectedToppings.length > 0
    ? ` con: ${selectedToppings.map((t) => t.name).join(", ")}`
    : " sin toppings adicionales";

  const itemName = `${baseName}${selectedToppings.length > 0 ? ` con ${selectedToppings.map((t) => t.name).join(", ")}` : ""}`;
  const itemEmoji = base === "brownie" ? "🍫" : "🍪";

  function handleAddToCart() {
    const id = `custom-${base}-${Date.now()}`;
    for (let i = 0; i < qty; i++) {
      addItem({ id, name: itemName, price: unitPrice, emoji: itemEmoji });
    }
    router.push("/cart");
  }

  return (
    <>
      {/* Header */}
      <section
        className="text-center"
        style={{
          color: "var(--on-dark)",
          background:
            "radial-gradient(110% 120% at 85% -10%, rgba(232,162,58,.25), transparent 55%), linear-gradient(150deg, var(--choco-900) 0%, var(--choco-700) 100%)",
          paddingBlock: "clamp(48px, 7vw, 76px)",
        }}
      >
        <div className="mx-auto px-[var(--gutter)]" style={{ maxWidth: "var(--maxw)" }}>
          <span
            className="inline-flex items-center gap-2 justify-center text-[12px] font-bold tracking-[0.22em] uppercase"
            style={{ color: "var(--amber)" }}
          >
            <BLIcon name="sparkle" size={15} />
            Interactivo
          </span>
          <h1
            className="font-extrabold mt-4 mb-3"
            style={{ fontSize: "clamp(40px, 6vw, 68px)", color: "var(--on-dark)" }}
          >
            Arma tu postre
          </h1>
          <p style={{ color: "var(--on-dark-soft)", fontSize: "clamp(16px, 1.4vw, 19px)", maxWidth: "44ch", marginInline: "auto" }}>
            Elige la base, agrégale los toppings que quieras y míralo cobrar forma. Lo que ves es lo que pides.
          </p>
        </div>
      </section>

      {/* Builder */}
      <div
        className="mx-auto px-[var(--gutter)] grid items-start gap-[clamp(28px,4vw,56px)] pb-24 lg:pb-0 bl-grid-2col"
        style={{
          maxWidth: "var(--maxw)",
          gridTemplateColumns: "1.05fr .95fr",
          paddingBlock: "clamp(48px, 6vw, 80px)",
        }}
      >
        {/* Preview — sticky on desktop */}
        <div className="lg:sticky lg:top-24">
          <div
            className="rounded-[24px] p-[30px]"
            style={{
              background: "var(--paper-card)",
              border: "1px solid var(--hairline)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {/* Dessert visual */}
            <div className="w-full max-w-[300px] mx-auto aspect-square">
              {base === "brownie" ? (
                <BrownieSVG selected={selected} />
              ) : (
                <GalletaSVG selected={selected} />
              )}
            </div>

            {/* Lleva */}
            <div className="text-center mt-2">
              <p
                className="text-[11px] font-bold tracking-[0.2em] uppercase"
                style={{ color: "var(--ink-soft)" }}
              >
                Lleva
              </p>
              <p className="mt-1 text-[15px]" style={{ color: "var(--ink)", minHeight: 22 }}>
                {selected.size === 0
                  ? `Solo ${base === "brownie" ? "brownie" : "galleta"} base`
                  : selectedToppings.map((t) => t.name).join(" · ")}
              </p>
            </div>

            <hr style={{ border: 0, borderTop: "1px solid var(--hairline)", margin: "22px 0" }} />

            {/* Quantity */}
            <div className="flex items-center justify-center gap-4">
              <span
                className="text-[11px] font-bold tracking-[0.16em] uppercase"
                style={{ color: "var(--ink-soft)" }}
              >
                Cantidad
              </span>
              <div
                className="inline-flex items-center overflow-hidden"
                style={{ border: "1.5px solid var(--hairline)", borderRadius: "var(--r-pill)" }}
              >
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-[38px] h-[38px] grid place-items-center border-0 cursor-pointer transition-colors"
                  style={{ background: "transparent", color: "var(--ink)" }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--cream)")}
                  onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
                >
                  <BLIcon name="minus" size={16} />
                </button>
                <span className="w-[26px] text-center font-bold text-[15px]" style={{ color: "var(--ink)" }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(50, q + 1))}
                  className="w-[38px] h-[38px] grid place-items-center border-0 cursor-pointer transition-colors"
                  style={{ background: "transparent", color: "var(--ink)" }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--cream)")}
                  onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
                >
                  <BLIcon name="plus" size={16} />
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="text-center mt-5">
              <p
                className="text-[11px] font-bold tracking-[0.16em] uppercase"
                style={{ color: "var(--ink-soft)" }}
              >
                Total estimado
              </p>
              <p
                className="font-extrabold mt-1"
                style={{
                  fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif",
                  fontSize: "clamp(36px, 5vw, 48px)",
                  color: "var(--orange-ink)",
                  lineHeight: 1.1,
                }}
              >
                {storeConfig.currencySymbol}{totalPrice}
              </p>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              className="w-full mt-5 inline-flex items-center justify-center gap-2 font-bold text-[15px] py-3.5 rounded-full text-white border-0 cursor-pointer transition-colors"
              style={{ background: "var(--orange)", boxShadow: "0 6px 18px rgba(217,113,30,.32)" }}
            >
              <BLIcon name="cart" size={18} />
              Agregar al carrito{qty > 1 ? ` (${qty})` : ""}
            </button>
          </div>
        </div>

        {/* Options */}
        <div>
          {/* Base selector */}
          <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {BASES.map((b) => (
              <button
                key={b.id}
                onClick={() => setBase(b.id)}
                className="flex flex-col items-start gap-0.5 rounded-[16px] border cursor-pointer transition-all text-left"
                style={{
                  padding: "16px 20px",
                  borderWidth: "1.5px",
                  background: base === b.id ? "var(--choco-900)" : "var(--paper-card)",
                  borderColor: base === b.id ? "var(--choco-900)" : "var(--hairline)",
                }}
              >
                <strong
                  className="text-[19px]"
                  style={{
                    fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif",
                    color: base === b.id ? "var(--on-dark)" : "var(--ink)",
                  }}
                >
                  {b.name}
                </strong>
                <span className="text-[13px]" style={{ color: base === b.id ? "var(--on-dark-soft)" : "var(--ink-soft)" }}>
                  {b.description}
                </span>
              </button>
            ))}
          </div>

          {/* Toppings */}
          <h2
            className="font-bold mb-1.5"
            style={{ fontSize: "clamp(22px, 2.6vw, 28px)", color: "var(--ink)" }}
          >
            Elige tus toppings
          </h2>
          <p className="mb-5 text-[15px]" style={{ color: "var(--ink-soft)" }}>
            Toca cada uno para agregarlo o quitarlo de tu postre.
          </p>

          <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {TOPPINGS.map((topping) => {
              const isOn = selected.has(topping.id);
              return (
                <button
                  key={topping.id}
                  onClick={() => toggleTopping(topping.id)}
                  className="relative flex items-center gap-3 rounded-[16px] border cursor-pointer transition-all text-left"
                  style={{
                    padding: "14px 16px",
                    borderWidth: "1.5px",
                    background: "var(--paper-card)",
                    borderColor: isOn ? "var(--orange)" : "var(--hairline)",
                    boxShadow: isOn ? "0 0 0 3px rgba(217,113,30,.14)" : "none",
                  }}
                  onMouseOver={(e) => {
                    if (!isOn) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--orange)";
                  }}
                  onMouseOut={(e) => {
                    if (!isOn) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--hairline)";
                  }}
                >
                  <span
                    className="w-[30px] h-[30px] rounded-full flex-none shadow"
                    style={{ background: topping.color, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)" }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-[15px] leading-tight" style={{ color: "var(--ink)" }}>
                      {topping.name}
                    </span>
                    <span className="text-[13px] font-bold" style={{ color: "var(--orange-ink)" }}>
                      +{storeConfig.currencySymbol}{topping.price}
                    </span>
                  </span>
                  {isOn && (
                    <span
                      className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full grid place-items-center"
                      style={{ background: "var(--orange)", color: "#fff" }}
                    >
                      <span className="text-[10px] font-bold">✓</span>
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

      {/* Back link */}
      <div className="text-center pb-16">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 font-bold text-[15px] no-underline transition-colors"
          style={{ color: "var(--orange-ink)" }}
        >
          <BLIcon name="arrow-right" size={16} className="rotate-180" />
          Ver menú completo
        </Link>
      </div>

      {/* Mobile sticky add button */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 p-4"
        style={{
          background: "rgba(251,246,236,.92)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid var(--hairline)",
        }}
      >
        <button
          onClick={handleAddToCart}
          className="w-full inline-flex items-center justify-center gap-2 font-bold text-[15px] py-4 rounded-full text-white border-0 cursor-pointer transition-colors"
          style={{ background: "var(--orange)" }}
        >
          <BLIcon name="cart" size={18} />
          Agregar al carrito{qty > 1 ? ` (${qty})` : ""}
        </button>
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
