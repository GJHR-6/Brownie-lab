"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storeConfig } from "@/config/store";
import { useCartStore } from "@/lib/cartStore";
import BLIcon from "@/components/BLIcon";

// ── Types ─────────────────────────────────────────────────────────────────────
type MainBase = "brownie" | "galleta";
interface Variant { id: string; name: string; desc: string; price: number; }
interface Topping {
  id: string; name: string; price: number; color: string; dur: string;
  shape: "circle" | "drop" | "chip" | "shard" | "blob";
  positions: { x: number; y: number; r: number; rotate?: number }[];
}

// ── Data ──────────────────────────────────────────────────────────────────────
const BROWNIE_VARIANTS: Variant[] = [
  { id: "clasico", name: "Clásico",  desc: "Denso y húmedo",   price: 40 },
  { id: "nuez",    name: "Con Nuez", desc: "Con nuez tostada", price: 45 },
];
const GALLETA_VARIANTS: Variant[] = [
  { id: "mocca",     name: "Mocca",               desc: "Café y chocolate",      price: 35 },
  { id: "chispas",   name: "Chispas de Chocolate", desc: "Con chispas incluidas", price: 35 },
  { id: "redvelvet", name: "Red Velvet",           desc: "Terciopelo rojo",       price: 35 },
];

const TOPPINGS: Topping[] = [
  { id: "pecanas",    name: "Pecanas",             price: 10, color: "#92400e", dur: "2.3s", shape: "blob",
    positions: [{x:28,y:25,r:11,rotate:20},{x:68,y:38,r:10,rotate:-15},{x:45,y:65,r:11,rotate:35},{x:20,y:72,r:9,rotate:-30},{x:78,y:70,r:10,rotate:10}] },
  { id: "chispas",   name: "Chispas de Chocolate", price: 8,  color: "#1c0a00", dur: "2.6s", shape: "drop",
    positions: [{x:22,y:30,r:7},{x:50,y:20,r:6},{x:75,y:32,r:7},{x:35,y:55,r:6},{x:65,y:60,r:7},{x:20,y:68,r:6},{x:80,y:72,r:7},{x:48,y:78,r:6}] },
  { id: "arandanos",  name: "Arándanos",           price: 10, color: "#4c1d95", dur: "1.9s", shape: "circle",
    positions: [{x:30,y:28,r:9},{x:65,y:25,r:8},{x:48,y:50,r:9},{x:22,y:65,r:8},{x:75,y:68,r:9}] },
  { id: "caramelo",   name: "Caramelo",            price: 6,  color: "#d97706", dur: "2.8s", shape: "shard",
    positions: [{x:50,y:20,r:30,rotate:0},{x:50,y:50,r:40,rotate:15}] },
  { id: "coco",       name: "Coco Rallado",        price: 5,  color: "#fef3c7", dur: "2.1s", shape: "shard",
    positions: [{x:25,y:25,r:14,rotate:30},{x:70,y:30,r:13,rotate:-20},{x:35,y:60,r:15,rotate:45},{x:72,y:65,r:13,rotate:10},{x:50,y:78,r:14,rotate:-35}] },
  { id: "sal",        name: "Sal de Mar",          price: 3,  color: "#f0fdf4", dur: "3.2s", shape: "chip",
    positions: [{x:20,y:25,r:4},{x:55,y:18,r:3},{x:78,y:35,r:4},{x:30,y:58,r:3},{x:65,y:55,r:4},{x:18,y:72,r:3},{x:82,y:70,r:4},{x:48,y:82,r:3},{x:40,y:38,r:3},{x:70,y:80,r:4}] },
  { id: "almendras",  name: "Almendras",           price: 10, color: "#c8a86b", dur: "2.5s", shape: "blob",
    positions: [{x:30,y:30,r:13,rotate:40},{x:68,y:28,r:12,rotate:-25},{x:22,y:68,r:13,rotate:15},{x:72,y:68,r:12,rotate:-40}] },
  { id: "frambuesas", name: "Frambuesas",          price: 12, color: "#e11d48", dur: "2.0s", shape: "circle",
    positions: [{x:28,y:32,r:11},{x:68,y:28,r:10},{x:45,y:60,r:11},{x:18,y:70,r:10},{x:78,y:72,r:11}] },
];

// ── Topping SVG shape (for dessert preview) ───────────────────────────────────
function ToppingShape({ t, pos }: { t: Topping; pos: Topping["positions"][0] }) {
  const { x: cx, y: cy, r, rotate: rot = 0 } = pos;
  if (t.shape === "circle") return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={t.color} opacity="0.92" />
      <circle cx={cx - r*0.25} cy={cy - r*0.25} r={r*0.2} fill="white" opacity="0.3" />
    </g>
  );
  if (t.shape === "drop") return (
    <g transform={`translate(${cx} ${cy})`}>
      <path d={`M0,-${r} C${r*.8},-${r*.2} ${r*.6},${r*.6} 0,${r} C-${r*.6},${r*.6} -${r*.8},-${r*.2} 0,-${r}Z`} fill={t.color} opacity="0.95" />
    </g>
  );
  if (t.shape === "chip") return (
    <rect x={cx-r} y={cy-r*.6} width={r*2} height={r*1.2} rx={r*.3} fill={t.color} opacity="0.85" transform={`rotate(${rot} ${cx} ${cy})`} />
  );
  if (t.shape === "shard") return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
      <path d={`M0,-${r*.15} L${r*.5},0 L0,${r*.15} L-${r*.5},0 Z`} fill={t.color} opacity="0.75" />
    </g>
  );
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
      <ellipse cx={0} cy={0} rx={r} ry={r*.6} fill={t.color} opacity="0.9" />
      <ellipse cx={r*.15} cy={-r*.1} rx={r*.3} ry={r*.2} fill="white" opacity="0.2" />
    </g>
  );
}

// ── Illustrated topping icons (card swatch) ───────────────────────────────────
function ToppingIcon({ id, on, dur }: { id: string; on: boolean; dur: string }) {
  const anim: React.CSSProperties = {
    display: "block", width: "100%", height: "100%",
    animation: `${on ? "toppingWiggle" : "toppingFloat"} ${dur} ease-in-out infinite`,
  };
  if (id === "pecanas") return (
    <svg viewBox="0 0 32 32" style={anim} aria-hidden="true">
      <ellipse cx="16" cy="17" rx="8" ry="11" fill="#8b5e3c" transform="rotate(-12 16 17)"/>
      <ellipse cx="16" cy="16" rx="5.5" ry="8.5" fill="#7a4a22" transform="rotate(-12 16 16)"/>
      <path d="M13 7 Q16 17 13.5 25" stroke="#5a2d0c" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <ellipse cx="14" cy="13" rx="3.5" ry="5" fill="#b07840" opacity="0.35" transform="rotate(-12 14 13)"/>
    </svg>
  );
  if (id === "chispas") return (
    <svg viewBox="0 0 32 32" style={anim} aria-hidden="true">
      <path d="M16 4 C21 4 26 10 26 17 C26 23 21 28 16 28 C11 28 6 23 6 17 C6 10 11 4 16 4Z" fill="#1c0a00"/>
      <path d="M16 4 C19 7 20 12 18 16" stroke="#3d1a00" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <ellipse cx="12" cy="12" rx="3" ry="2" fill="#4a2000" opacity="0.55" transform="rotate(-25 12 12)"/>
      <circle cx="21" cy="14" r="1.5" fill="#3d1800" opacity="0.4"/>
    </svg>
  );
  if (id === "arandanos") return (
    <svg viewBox="0 0 32 32" style={anim} aria-hidden="true">
      <circle cx="16" cy="18" r="11" fill="#3d318a"/>
      <circle cx="16" cy="17" r="9" fill="#5548b8"/>
      <path d="M12 10 L14 8 L16 10.5 L18 8 L20 10" stroke="#2a1f6a" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="13" cy="14" r="3" fill="white" opacity="0.15"/>
      <circle cx="12.5" cy="13" r="1.5" fill="white" opacity="0.18"/>
    </svg>
  );
  if (id === "caramelo") return (
    <svg viewBox="0 0 32 32" style={anim} aria-hidden="true">
      <path d="M4 10 Q8.5 5.5 13 10 Q17.5 14.5 22 10 Q25 7 28 10" stroke="#d98a1e" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M3 19 Q8 14.5 13 19 Q18 23.5 23 19 Q26 16.5 29 19" stroke="#c47010" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M6 27 Q11 23 16 27 Q20 30 25 27" stroke="#d98a1e" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
  if (id === "coco") return (
    <svg viewBox="0 0 32 32" style={anim} aria-hidden="true">
      <path d="M5 12 Q9 8 12 13 Q14 17 10 19" stroke="#d8c890" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M13 7 Q17 9 16 15 Q15 20 20 21" stroke="#c8b878" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M20 9 Q24 7 25 14 Q26 20 22 22" stroke="#d8c890" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M5 22 Q10 19 11 25" stroke="#c8b878" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      <path d="M21 23 Q25 21 26 27" stroke="#d8c890" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    </svg>
  );
  if (id === "sal") return (
    <svg viewBox="0 0 32 32" style={anim} aria-hidden="true">
      <polygon points="16,4 25,10 25,22 16,28 7,22 7,10" fill="#cce8d8"/>
      <polygon points="16,4 25,10 16,28 7,10" fill="white" opacity="0.25"/>
      <polygon points="16,4 25,10 20.5,16 11.5,16" fill="white" opacity="0.15"/>
      <line x1="16" y1="4" x2="16" y2="28" stroke="#88c0a0" strokeWidth="0.8" opacity="0.7"/>
      <line x1="7" y1="10" x2="25" y2="22" stroke="#88c0a0" strokeWidth="0.6" opacity="0.5"/>
      <line x1="25" y1="10" x2="7" y2="22" stroke="#88c0a0" strokeWidth="0.6" opacity="0.5"/>
    </svg>
  );
  if (id === "almendras") return (
    <svg viewBox="0 0 32 32" style={anim} aria-hidden="true">
      <path d="M16 3 Q28 10 28 19 Q28 26 16 29 Q4 26 4 19 Q4 10 16 3Z" fill="#c9a86a"/>
      <path d="M16 3 Q22 10 22 19 Q22 25 16 29" stroke="#9a7840" strokeWidth="1" fill="none"/>
      <ellipse cx="12.5" cy="11" rx="4" ry="2.5" fill="#e8c880" opacity="0.4" transform="rotate(-20 12.5 11)"/>
      <path d="M11.5 5 Q15 11 14 20" stroke="#a08040" strokeWidth="0.8" fill="none" opacity="0.5"/>
    </svg>
  );
  if (id === "frambuesas") return (
    <svg viewBox="0 0 32 32" style={anim} aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="#d04040"/>
      <circle cx="20" cy="12" r="4" fill="#cf4444"/>
      <circle cx="16" cy="10" r="4" fill="#c83838"/>
      <circle cx="9" cy="18" r="4" fill="#cf4444"/>
      <circle cx="16" cy="17.5" r="4" fill="#c03838"/>
      <circle cx="23" cy="18" r="4" fill="#d04040"/>
      <circle cx="12" cy="24" r="4" fill="#cf4444"/>
      <circle cx="20" cy="24" r="4" fill="#d04040"/>
      <circle cx="11" cy="11" r="1.5" fill="white" opacity="0.22"/>
      <circle cx="19" cy="11" r="1.5" fill="white" opacity="0.22"/>
      <circle cx="8" cy="17" r="1.5" fill="white" opacity="0.22"/>
      <path d="M14 7 Q16 5 18 7" stroke="#a02020" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
  return null;
}

// ── Dessert previews ──────────────────────────────────────────────────────────
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
        <filter id="bshadow">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.4" />
        </filter>
        <clipPath id="brownieClip">
          <rect x="8" y="8" width="84" height="84" rx="10" />
        </clipPath>
      </defs>
      <rect x="8" y="8" width="84" height="84" rx="10" fill="url(#brownieGrad)" filter="url(#bshadow)" />
      <rect x="8" y="8" width="84" height="84" rx="10" fill="url(#brownieSheen)" />
      <rect x="8" y="8" width="84" height="84" rx="10" fill="none" stroke="#92400e" strokeWidth="1.5" opacity="0.4" />
      <g clipPath="url(#brownieClip)" opacity="0.15">
        <line x1="8" y1="35" x2="92" y2="35" stroke="#78350f" strokeWidth="0.5" />
        <line x1="8" y1="65" x2="92" y2="65" stroke="#78350f" strokeWidth="0.5" />
        <line x1="35" y1="8" x2="35" y2="92" stroke="#78350f" strokeWidth="0.5" />
        <line x1="65" y1="8" x2="65" y2="92" stroke="#78350f" strokeWidth="0.5" />
      </g>
      <g clipPath="url(#brownieClip)">
        {TOPPINGS.filter(t => selected.has(t.id)).map(t =>
          t.positions.map((pos, i) => (
            <g key={`${t.id}-${i}`} style={{ animation: "popIn 0.3s ease" }}>
              <ToppingShape t={t} pos={pos} />
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
        <filter id="cshadow">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
        </filter>
        <clipPath id="cookieClip">
          <circle cx="50" cy="50" r="42" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="42" fill="url(#cookieGrad)" filter="url(#cshadow)" />
      <circle cx="50" cy="50" r="42" fill="url(#cookieSheen)" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#b45309" strokeWidth="2" opacity="0.5" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#fef3c7" strokeWidth="0.5" opacity="0.2" />
      <g clipPath="url(#cookieClip)" opacity="0.12">
        <path d="M30 30 Q50 45 70 35" stroke="#92400e" strokeWidth="1" fill="none" />
        <path d="M25 60 Q45 55 60 70" stroke="#92400e" strokeWidth="1" fill="none" />
        <path d="M60 28 Q55 50 70 65" stroke="#92400e" strokeWidth="1" fill="none" />
      </g>
      <g clipPath="url(#cookieClip)">
        {TOPPINGS.filter(t => selected.has(t.id)).map(t =>
          t.positions.map((pos, i) => (
            <g key={`${t.id}-${i}`} style={{ animation: "popIn 0.3s ease" }}>
              <ToppingShape t={t} pos={pos} />
            </g>
          ))
        )}
      </g>
      <ellipse cx="40" cy="35" rx="18" ry="10" fill="white" opacity="0.06" transform="rotate(-15 40 35)" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PersonalizaPage() {
  const [base, setBase] = useState<MainBase>("brownie");
  const [brownieVariant, setBrownieVariant] = useState("clasico");
  const [galletaVariant, setGalletaVariant] = useState("mocca");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [qty, setQty] = useState(1);
  const addItem = useCartStore(s => s.addItem);
  const router = useRouter();

  const activeVariants = base === "brownie" ? BROWNIE_VARIANTS : GALLETA_VARIANTS;
  const activeVariantId = base === "brownie" ? brownieVariant : galletaVariant;
  const activeVariant = activeVariants.find(v => v.id === activeVariantId) ?? activeVariants[0];
  const sym = storeConfig.currencySymbol;

  function switchBase(b: MainBase) {
    if (b === base) return;
    setBase(b);
  }
  function setVariant(id: string) {
    if (base === "brownie") setBrownieVariant(id);
    else setGalletaVariant(id);
  }
  function toggleTopping(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const selectedToppings = TOPPINGS.filter(t => selected.has(t.id));
  const unitPrice = activeVariant.price + selectedToppings.reduce((s, t) => s + t.price, 0);
  const totalPrice = unitPrice * qty;
  const baseName = base === "brownie" ? "Brownie" : "Galleta";
  const itemName = `${baseName} ${activeVariant.name}${selectedToppings.length > 0 ? ` con ${selectedToppings.map(t => t.name).join(", ")}` : ""}`;
  const itemEmoji = base === "brownie" ? "🍫" : "🍪";

  function handleAddToCart() {
    const id = `custom-${base}-${Date.now()}`;
    for (let i = 0; i < qty; i++)
      addItem({ id: i === 0 ? id : `${id}-${i}`, name: itemName, price: unitPrice, emoji: itemEmoji });
    router.push("/cart");
  }

  const cardBase: React.CSSProperties = {
    borderWidth: "1.5px", borderStyle: "solid", borderRadius: "var(--r-md)",
    background: "var(--paper-card)", cursor: "pointer", transition: "all 0.15s",
  };

  return (
    <>
      {/* Header */}
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

      {/* Builder */}
      <div
        className="mx-auto px-[var(--gutter)] grid items-start gap-[clamp(28px,4vw,56px)] bl-grid-2col"
        style={{ maxWidth: "var(--maxw)", gridTemplateColumns: "1.05fr .95fr", paddingBlock: "clamp(48px, 6vw, 80px)" }}
      >
        {/* ── Preview (sticky on desktop, moves to top on mobile) ── */}
        <div className="bl-pers-preview lg:sticky lg:top-24">
          <div
            className="rounded-[24px] p-[30px]"
            style={{ background: "var(--paper-card)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-md)" }}
          >
            {/* Cross-fade dessert visual */}
            <div style={{ position: "relative", width: "100%", maxWidth: 300, margin: "0 auto", aspectRatio: "1/1" }}>
              <div style={{
                position: "absolute", inset: 0,
                opacity: base === "brownie" ? 1 : 0,
                transform: base === "brownie" ? "scale(1)" : "scale(0.88)",
                transition: "opacity 0.45s cubic-bezier(.4,0,.2,1), transform 0.45s cubic-bezier(.4,0,.2,1)",
                pointerEvents: base === "brownie" ? "auto" : "none",
              }}>
                <BrownieSVG selected={selected} />
              </div>
              <div style={{
                position: "absolute", inset: 0,
                opacity: base === "galleta" ? 1 : 0,
                transform: base === "galleta" ? "scale(1)" : "scale(0.88)",
                transition: "opacity 0.45s cubic-bezier(.4,0,.2,1), transform 0.45s cubic-bezier(.4,0,.2,1)",
                pointerEvents: base === "galleta" ? "auto" : "none",
              }}>
                <GalletaSVG selected={selected} />
              </div>
            </div>

            {/* Lleva */}
            <div className="text-center mt-2">
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: "var(--ink-soft)" }}>Lleva</p>
              <p className="mt-1 text-[15px]" style={{ color: "var(--ink)", minHeight: 22 }}>
                {selected.size === 0
                  ? `${baseName} ${activeVariant.name} · solo base`
                  : selectedToppings.map(t => t.name).join(" · ")}
              </p>
            </div>

            <hr style={{ border: 0, borderTop: "1px solid var(--hairline)", margin: "22px 0" }} />

            {/* Quantity */}
            <div className="flex items-center justify-center gap-4">
              <span className="text-[11px] font-bold tracking-[0.16em] uppercase" style={{ color: "var(--ink-soft)" }}>Cantidad</span>
              <div className="inline-flex items-center overflow-hidden" style={{ border: "1.5px solid var(--hairline)", borderRadius: "var(--r-pill)" }}>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-[38px] h-[38px] grid place-items-center border-0 cursor-pointer transition-colors"
                  style={{ background: "transparent", color: "var(--ink)" }}
                  onMouseOver={e => ((e.currentTarget as HTMLButtonElement).style.background = "var(--cream)")}
                  onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
                >
                  <BLIcon name="minus" size={16} />
                </button>
                <span className="w-[26px] text-center font-bold text-[15px]" style={{ color: "var(--ink)" }}>{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(50, q + 1))}
                  className="w-[38px] h-[38px] grid place-items-center border-0 cursor-pointer transition-colors"
                  style={{ background: "transparent", color: "var(--ink)" }}
                  onMouseOver={e => ((e.currentTarget as HTMLButtonElement).style.background = "var(--cream)")}
                  onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
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
                style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif", fontSize: "clamp(36px, 5vw, 48px)", color: "var(--orange-ink)", lineHeight: 1.1 }}
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

        {/* ── Options ── */}
        <div>
          {/* Main base selector */}
          <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {(["brownie", "galleta"] as const).map(b => (
              <button
                key={b}
                onClick={() => switchBase(b)}
                style={{
                  ...cardBase,
                  padding: "16px 20px",
                  display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, textAlign: "left",
                  background: base === b ? "var(--choco-900)" : "var(--paper-card)",
                  borderColor: base === b ? "var(--choco-900)" : "var(--hairline)",
                }}
              >
                <strong style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif", fontSize: 19, color: base === b ? "var(--on-dark)" : "var(--ink)" }}>
                  {b === "brownie" ? "Brownie" : "Galleta"}
                </strong>
                <span style={{ fontSize: 13, color: base === b ? "var(--on-dark-soft)" : "var(--ink-soft)" }}>
                  {b === "brownie" ? "Base de chocolate · desde L.40" : "Base de mantequilla · desde L.30"}
                </span>
              </button>
            ))}
          </div>

          {/* Sub-base variants */}
          <div className="bl-pers-subbases grid gap-2.5 mb-6" style={{ gridTemplateColumns: `repeat(${activeVariants.length}, 1fr)` }}>
            {activeVariants.map(v => (
              <button
                key={v.id}
                onClick={() => setVariant(v.id)}
                style={{
                  ...cardBase,
                  padding: "12px 14px", textAlign: "left",
                  borderColor: activeVariantId === v.id ? "var(--orange)" : "var(--hairline)",
                  background: activeVariantId === v.id ? "rgba(217,113,30,.07)" : "var(--paper-card)",
                  boxShadow: activeVariantId === v.id ? "0 0 0 3px rgba(217,113,30,.12)" : "none",
                }}
              >
                <strong style={{ display: "block", fontSize: 14, color: "var(--ink)", fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif", lineHeight: 1.2 }}>
                  {v.name}
                </strong>
                <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{v.desc} · {sym}{v.price}</span>
              </button>
            ))}
          </div>

          {/* Toppings heading */}
          <h2 className="font-bold mb-1.5" style={{ fontSize: "clamp(22px, 2.6vw, 28px)", color: "var(--ink)" }}>
            Elige tus toppings
          </h2>
          <p className="mb-5 text-[15px]" style={{ color: "var(--ink-soft)" }}>
            Toca cada uno para agregarlo o quitarlo de tu postre.
          </p>

          {/* Toppings grid with illustrated icons */}
          <div className="bl-pers-toppings grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {TOPPINGS.map(topping => {
              const isOn = selected.has(topping.id);
              return (
                <button
                  key={topping.id}
                  onClick={() => toggleTopping(topping.id)}
                  className="relative flex items-center gap-3 text-left cursor-pointer transition-all"
                  style={{
                    ...cardBase,
                    padding: "12px 14px",
                    borderColor: isOn ? "var(--orange)" : "var(--hairline)",
                    boxShadow: isOn ? "0 0 0 3px rgba(217,113,30,.14)" : "none",
                    transform: isOn ? "translateY(-1px)" : "none",
                  }}
                >
                  {/* Illustrated icon */}
                  <div
                    key={`icon-${topping.id}-${isOn}`}
                    style={{
                      width: 36, height: 36, flexShrink: 0,
                      borderRadius: "var(--r-sm)",
                      background: topping.id === "coco" || topping.id === "sal" ? "var(--cream)" : "transparent",
                      padding: 2,
                      animation: isOn ? "toppingPop 0.35s cubic-bezier(.34,1.56,.64,1)" : "none",
                    }}
                  >
                    <ToppingIcon id={topping.id} on={isOn} dur={topping.dur} />
                  </div>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="block font-semibold text-[14px] leading-tight" style={{ color: "var(--ink)" }}>
                      {topping.name}
                    </span>
                    <span className="text-[13px] font-bold" style={{ color: "var(--orange-ink)" }}>
                      +{sym}{topping.price}
                    </span>
                  </span>
                  {isOn && (
                    <span
                      className="absolute top-2 right-2 w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold"
                      style={{ background: "var(--orange)", color: "#fff" }}
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

      {/* Back link */}
      <div className="text-center pb-20 lg:pb-16">
        <Link href="/menu" className="inline-flex items-center gap-2 font-bold text-[15px] no-underline transition-colors" style={{ color: "var(--orange-ink)" }}>
          <BLIcon name="arrow-right" size={16} className="rotate-180" />
          Ver menú completo
        </Link>
      </div>

      {/* Mobile sticky add button */}
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
        @keyframes popIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes toppingPop { 0% { transform: scale(0.7); } 65% { transform: scale(1.15); } 100% { transform: scale(1); } }
      `}</style>
    </>
  );
}
