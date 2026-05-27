"use client";

import { useState } from "react";
import Link from "next/link";
import { storeConfig } from "@/config/store";

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

  const whatsappText = `Hola! Quisiera pedir ${qty > 1 ? `${qty}x` : "un"} ${baseName}${toppingsText} — Precio unitario: ${storeConfig.currencySymbol}${unitPrice}${qty > 1 ? ` | Total (${qty} unidades): ${storeConfig.currencySymbol}${totalPrice}` : ""}`;

  const whatsappHref = `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="min-h-screen bg-amber-50 pb-24 lg:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-900 to-amber-700 text-white py-10 md:py-14 px-4 text-center">
        <p className="text-amber-300 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
          Interactivo
        </p>
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Arma tu postre
        </h1>
        <p className="text-amber-200 text-base md:text-lg max-w-md mx-auto">
          Elige la base y los toppings. Lo que ves es lo que pides.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start">

          {/* Visual — arriba en móvil, sticky en desktop */}
          <div className="lg:sticky lg:top-24">
            {/* Base selector */}
            <div className="flex gap-3 mb-4 md:mb-6">
              {BASES.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBase(b.id)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95 ${
                    base === b.id
                      ? "bg-amber-800 text-white border-amber-800"
                      : "bg-white text-amber-800 border-amber-200 hover:border-amber-400"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>

            {/* Product visual */}
            <div className="bg-white rounded-3xl p-4 md:p-8 shadow-lg border border-amber-100">
              <div className="w-full max-w-[160px] sm:max-w-[220px] md:max-w-xs mx-auto aspect-square">
                {base === "brownie" ? (
                  <BrownieSVG selected={selected} />
                ) : (
                  <GalletaSVG selected={selected} />
                )}
              </div>

              {/* Toppings seleccionados */}
              <div className="mt-4 md:mt-6 text-center">
                <p className="text-xs text-stone-400 uppercase tracking-widest mb-2">Lleva</p>
                {selected.size === 0 ? (
                  <p className="text-stone-400 text-sm">
                    Solo {base === "brownie" ? "brownie" : "galleta"} base
                  </p>
                ) : (
                  <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
                    {selectedToppings.map((t) => (
                      <span
                        key={t.id}
                        className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-medium"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-amber-100">
                {/* Quantity selector */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <p className="text-xs text-stone-400 uppercase tracking-widest">Cantidad</p>
                  <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors font-bold text-lg"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-base font-bold text-stone-800">{qty}</span>
                    <button
                      onClick={() => setQty(q => Math.min(50, q + 1))}
                      className="w-10 h-10 flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors font-bold text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">
                    Total estimado{qty > 1 && <span className="normal-case ml-1 text-stone-400">({qty} × {storeConfig.currencySymbol}{unitPrice})</span>}
                  </p>
                  <p className="text-2xl font-bold text-amber-800">
                    {storeConfig.currencySymbol}{totalPrice}
                  </p>
                </div>
              </div>
            </div>

            {/* Botón WhatsApp — solo visible en desktop aquí */}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex mt-4 w-full items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              <span>💬</span>
              <span>Pedir {qty > 1 ? `${qty} unidades` : "por WhatsApp"}</span>
            </a>
          </div>

          {/* Toppings — debajo del visual en móvil */}
          <div className="mt-8 lg:mt-0">
            <h2 className="text-lg md:text-xl font-bold text-amber-800 mb-1">Elige tus toppings</h2>
            <p className="text-stone-500 text-sm mb-4 md:mb-6">
              Toca cada uno para agregarlo o quitarlo de tu postre.
            </p>

            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {TOPPINGS.map((topping) => {
                const isOn = selected.has(topping.id);
                return (
                  <button
                    key={topping.id}
                    onClick={() => toggleTopping(topping.id)}
                    className={`relative flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                      isOn
                        ? "border-amber-600 bg-amber-50 shadow-md"
                        : "border-stone-200 bg-white hover:border-amber-300"
                    }`}
                  >
                    <span
                      className="w-7 h-7 md:w-8 md:h-8 rounded-full flex-shrink-0 border-2 border-white shadow"
                      style={{ backgroundColor: topping.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs md:text-sm font-medium leading-tight block ${isOn ? "text-amber-800" : "text-stone-600"}`}>
                        {topping.name}
                      </span>
                      <span className="text-xs text-amber-600 font-medium">
                        +{storeConfig.currencySymbol}{topping.price}
                      </span>
                    </div>
                    {isOn && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-amber-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
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
                className="mt-4 text-sm text-stone-400 hover:text-stone-600 underline underline-offset-2 transition-colors"
              >
                Limpiar selección
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 md:mt-10 text-center">
          <Link href="/menu" className="text-sm text-amber-700 hover:underline">
            ← Ver menú completo
          </Link>
        </div>
      </div>

      {/* Botón WhatsApp fijo en la parte inferior — solo móvil */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-amber-50/90 backdrop-blur-sm border-t border-amber-100">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          <span>💬</span>
          <span>Pedir {qty > 1 ? `${qty} unidades` : "por WhatsApp"}</span>
        </a>
      </div>

      <style jsx>{`
        @keyframes popIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
