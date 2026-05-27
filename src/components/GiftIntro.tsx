"use client";

import { useEffect, useState } from "react";
import { storeConfig } from "@/config/store";

const STORAGE_KEY = "brownielab_intro_seen";

const PAPER_STYLE: React.CSSProperties = {
  backgroundColor: "#7c2d12",
  backgroundImage: `
    radial-gradient(circle, #b45309 1.5px, transparent 1.5px),
    radial-gradient(circle, #92400e 1px, transparent 1px)
  `,
  backgroundSize: "28px 28px, 14px 14px",
  backgroundPosition: "0 0, 7px 7px",
};

const STYLES = `
  @keyframes slide-up    { to { transform: translateY(-100%); } }
  @keyframes slide-down  { to { transform: translateY(100%);  } }
  @keyframes bow-pop     { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.12)} }
  @keyframes hint-float  { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-6px)} }
  @keyframes bow-exit    { to { transform:translate(-50%,-50%) scale(0); opacity:0; } }
  @keyframes welcome-in  { 0%{opacity:0;transform:translate(-50%,-50%) scale(0.85)} 60%{transform:translate(-50%,-50%) scale(1.04)} 100%{opacity:1;transform:translate(-50%,-50%) scale(1)} }
  @keyframes welcome-out { 0%{opacity:1} 100%{opacity:0;transform:translate(-50%,-50%) translateY(-12px)} }

  .gift-panel-top    { position:fixed; top:0; left:0; right:0; height:50vh; z-index:9999; cursor:pointer; }
  .gift-panel-bottom { position:fixed; bottom:0; left:0; right:0; height:50vh; z-index:9999; cursor:pointer; }
  .gift-panel-top.open    { animation: slide-up   0.75s cubic-bezier(0.4,0,0.2,1) forwards; }
  .gift-panel-bottom.open { animation: slide-down 0.75s cubic-bezier(0.4,0,0.2,1) forwards; }

  .gift-bow { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:10000; cursor:pointer; }
  .gift-bow.open { animation: bow-exit 0.3s ease-in forwards; }
  .gift-bow.idle { animation: bow-pop 2.4s ease-in-out infinite; }

  .gift-hint { position:fixed; bottom:calc(50vh + 28px); left:50%; transform:translateX(-50%); z-index:10001; animation: hint-float 2s ease-in-out infinite; white-space:nowrap; }
  .gift-hint.open { opacity:0; transition:opacity 0.2s; }

  .welcome-badge { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:10002; text-align:center; pointer-events:none; }
  .welcome-badge.in  { animation: welcome-in  0.55s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .welcome-badge.out { animation: welcome-out 0.55s ease-in forwards; }
`;

// ── Welcome badge shown after gift opens ────────────────────────────────────
function WelcomeBadge({ show, tagline }: { show: boolean; tagline: string }) {
  const [phase, setPhase] = useState<"in" | "out" | "hidden">("hidden");

  useEffect(() => {
    if (!show) { setPhase("hidden"); return; }
    setPhase("in");
    const t = setTimeout(() => setPhase("out"), 1600);
    return () => clearTimeout(t);
  }, [show]);

  if (phase === "hidden") return null;

  return (
    <div className={`welcome-badge ${phase}`}>
      <div className="flex flex-col items-center gap-3 bg-amber-950/90 backdrop-blur-md border border-amber-700/60 rounded-2xl px-10 py-7 shadow-2xl">
        <span className="text-5xl">🎁</span>
        <p className="text-amber-50 font-bold text-2xl tracking-wide">¡Bienvenido!</p>
        <p className="text-amber-300 font-semibold text-lg">Brownie Lab</p>
        <p className="text-amber-400/80 text-sm">{tagline}</p>
      </div>
    </div>
  );
}

// ── Main gift intro ─────────────────────────────────────────────────────────
export default function GiftIntro() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [opening, setOpening] = useState(false);
  const [welcome, setWelcome] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem(STORAGE_KEY)) return;
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(true);
  }, []);

  function handleOpen() {
    if (opening) return;
    setOpening(true);
    setTimeout(() => { setVisible(false); setWelcome(true); }, 750);
    setTimeout(() => setWelcome(false), 2800);
  }

  if (!mounted) return null;

  return (
    <>
      <style>{STYLES}</style>

      <WelcomeBadge show={welcome} tagline={storeConfig.tagline ?? "Hecho con amor"} />

      {visible && (
        <>
          {/* ── Top panel ── */}
          <div
            className={`gift-panel-top ${opening ? "open" : ""}`}
            style={PAPER_STYLE}
            onClick={handleOpen}
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-amber-400 opacity-90" />
            <div className="absolute bottom-0 inset-x-0 h-8 bg-amber-400 opacity-90" />
            <div className="absolute inset-0" style={{
              backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px)",
            }} />
          </div>

          {/* ── Bottom panel ── */}
          <div
            className={`gift-panel-bottom ${opening ? "open" : ""}`}
            style={PAPER_STYLE}
            onClick={handleOpen}
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-amber-400 opacity-90" />
            <div className="absolute top-0 inset-x-0 h-8 bg-amber-400 opacity-90" />
            <div className="absolute inset-0" style={{
              backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px)",
            }} />
          </div>

          {/* ── Bow ── */}
          <div
            className={`gift-bow ${opening ? "open" : "idle"}`}
            onClick={handleOpen}
          >
            <svg width="110" height="90" viewBox="0 0 110 90" fill="none">
              <ellipse cx="30" cy="34" rx="26" ry="16" fill="#f59e0b" stroke="#fbbf24" strokeWidth="2" transform="rotate(-30 30 34)" />
              <ellipse cx="30" cy="34" rx="14" ry="8" fill="#d97706" transform="rotate(-30 30 34)" />
              <ellipse cx="80" cy="34" rx="26" ry="16" fill="#f59e0b" stroke="#fbbf24" strokeWidth="2" transform="rotate(30 80 34)" />
              <ellipse cx="80" cy="34" rx="14" ry="8" fill="#d97706" transform="rotate(30 80 34)" />
              <path d="M46 52 Q30 70 20 80" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round"/>
              <path d="M64 52 Q80 70 90 80" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round"/>
              <circle cx="55" cy="44" r="12" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2"/>
              <circle cx="55" cy="44" r="6" fill="#d97706"/>
            </svg>
          </div>

          {/* ── Hint ── */}
          <div
            className={`gift-hint ${opening ? "open" : ""}`}
            onClick={handleOpen}
            style={{ pointerEvents: "auto" }}
          >
            <span className="inline-flex items-center gap-2 bg-amber-950/80 text-amber-200 text-sm font-medium px-4 py-2 rounded-full backdrop-blur-sm border border-amber-700/50 select-none">
              <span>🎁</span>
              <span>Toca para abrir tu regalo</span>
            </span>
          </div>
        </>
      )}
    </>
  );
}
