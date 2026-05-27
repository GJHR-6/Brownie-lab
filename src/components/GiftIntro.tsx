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

export default function GiftIntro() {
  const [visible, setVisible]   = useState(false);
  const [opening, setOpening]   = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem(STORAGE_KEY)) return;
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(true);
  }, []);

  function handleOpen() {
    if (opening) return;
    setOpening(true);
    setTimeout(() => setVisible(false), 1000);
  }

  if (!mounted || !visible) return null;

  return (
    <>
      <style>{`
        @keyframes slide-up   { to { transform: translateY(-100%); } }
        @keyframes slide-down { to { transform: translateY(100%);  } }
        @keyframes bow-pop    { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.12)} }
        @keyframes hint-float { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-6px)} }
        @keyframes bow-exit   { to { transform:translate(-50%,-50%) scale(0); opacity:0; } }

        .panel-top    { position:fixed; top:0; left:0; right:0; height:50vh; z-index:9999; cursor:pointer; }
        .panel-bottom { position:fixed; bottom:0; left:0; right:0; height:50vh; z-index:9999; cursor:pointer; }
        .panel-top.open    { animation: slide-up   0.75s cubic-bezier(0.4,0,0.2,1) forwards; }
        .panel-bottom.open { animation: slide-down 0.75s cubic-bezier(0.4,0,0.2,1) forwards; }
        .bow-center { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:10000; cursor:pointer; pointer-events:none; }
        .bow-center.open { animation: bow-exit 0.3s ease-in forwards; }
        .bow-idle   { animation: bow-pop 2.4s ease-in-out infinite; }
        .hint-label { position:fixed; bottom:calc(50vh + 28px); left:50%; transform:translateX(-50%); z-index:10001; animation: hint-float 2s ease-in-out infinite; white-space:nowrap; }
        .hint-label.open { opacity:0; transition:opacity 0.2s; }
      `}</style>

      {/* ── Top panel ── */}
      <div
        className={`panel-top ${opening ? "open" : ""}`}
        style={PAPER_STYLE}
        onClick={handleOpen}
      >
        {/* vertical ribbon */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-amber-400 opacity-90" />
        {/* horizontal ribbon (bottom edge) */}
        <div className="absolute bottom-0 inset-x-0 h-8 bg-amber-400 opacity-90" />
        {/* shine lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px)",
        }} />
      </div>

      {/* ── Bottom panel ── */}
      <div
        className={`panel-bottom ${opening ? "open" : ""}`}
        style={PAPER_STYLE}
        onClick={handleOpen}
      >
        {/* vertical ribbon */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-amber-400 opacity-90" />
        {/* horizontal ribbon (top edge) */}
        <div className="absolute top-0 inset-x-0 h-8 bg-amber-400 opacity-90" />
        {/* shine lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px)",
        }} />
      </div>

      {/* ── Bow (center intersection) ── */}
      <div className={`bow-center ${opening ? "open" : "bow-idle"}`} onClick={handleOpen} style={{pointerEvents: "auto"}}>
        <svg width="110" height="90" viewBox="0 0 110 90" fill="none">
          {/* left loop */}
          <ellipse cx="30" cy="34" rx="26" ry="16" fill="#f59e0b" stroke="#fbbf24" strokeWidth="2" transform="rotate(-30 30 34)" />
          <ellipse cx="30" cy="34" rx="14" ry="8" fill="#d97706" transform="rotate(-30 30 34)" />
          {/* right loop */}
          <ellipse cx="80" cy="34" rx="26" ry="16" fill="#f59e0b" stroke="#fbbf24" strokeWidth="2" transform="rotate(30 80 34)" />
          <ellipse cx="80" cy="34" rx="14" ry="8" fill="#d97706" transform="rotate(30 80 34)" />
          {/* tail left */}
          <path d="M46 52 Q30 70 20 80" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round"/>
          {/* tail right */}
          <path d="M64 52 Q80 70 90 80" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round"/>
          {/* center knot */}
          <circle cx="55" cy="44" r="12" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2"/>
          <circle cx="55" cy="44" r="6" fill="#d97706"/>
        </svg>
      </div>

      {/* ── Hint label ── */}
      <div className={`hint-label ${opening ? "open" : ""}`} onClick={handleOpen} style={{pointerEvents:"auto"}}>
        <span className="inline-flex items-center gap-2 bg-amber-950/80 text-amber-200 text-sm font-medium px-4 py-2 rounded-full backdrop-blur-sm border border-amber-700/50 select-none">
          <span>🎁</span>
          <span>Toca para abrir tu regalo</span>
        </span>
      </div>

      {/* ── Store name teaser (very subtle, behind bow) ── */}
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9998] pointer-events-none select-none text-center ${opening ? "" : "opacity-0"}`}>
        <p className="text-amber-50 font-bold text-2xl">{storeConfig.name}</p>
      </div>
    </>
  );
}
