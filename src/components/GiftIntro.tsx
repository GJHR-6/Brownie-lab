"use client";

import { useEffect, useState } from "react";
import { storeConfig } from "@/config/store";

const STORAGE_KEY = "brownielab_intro_seen";

export default function GiftIntro() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"idle" | "open" | "reveal" | "exit">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(true);

    const t1 = setTimeout(() => setPhase("open"), 600);
    const t2 = setTimeout(() => setPhase("reveal"), 1600);
    const t3 = setTimeout(() => setPhase("exit"), 3000);
    const t4 = setTimeout(() => setVisible(false), 3800);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes gift-bounce-in {
          0%   { transform: scale(0.3) rotate(-8deg); opacity: 0; }
          60%  { transform: scale(1.08) rotate(2deg); opacity: 1; }
          80%  { transform: scale(0.96) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes lid-open {
          0%   { transform: perspective(400px) rotateX(0deg) translateY(0); }
          100% { transform: perspective(400px) rotateX(-140deg) translateY(-10px); }
        }
        @keyframes logo-reveal {
          0%   { opacity: 0; transform: translateY(16px) scale(0.85); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ribbon-glow {
          0%, 100% { box-shadow: 0 0 0px #fbbf24; }
          50%       { box-shadow: 0 0 18px 4px #fbbf2488; }
        }
        @keyframes overlay-exit {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        .gift-bounce { animation: gift-bounce-in 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .lid-open    { animation: lid-open 0.9s cubic-bezier(0.4,0,0.2,1) forwards; transform-origin: bottom center; }
        .logo-reveal { animation: logo-reveal 0.6s ease-out forwards; }
        .ribbon-glow { animation: ribbon-glow 1.4s ease-in-out infinite; }
        .overlay-exit { animation: overlay-exit 0.8s ease-in forwards; }
      `}</style>

      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-amber-950 ${
          phase === "exit" ? "overlay-exit" : ""
        }`}
      >
        {/* Scattered dots background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {["top-8 left-12","top-20 right-16","bottom-24 left-20","bottom-10 right-10","top-1/3 left-8","top-2/3 right-12"].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-2 h-2 rounded-full bg-amber-700 opacity-40`} />
          ))}
        </div>

        {/* Gift box */}
        <div className="gift-bounce flex flex-col items-center" style={{ width: 220 }}>

          {/* Lid */}
          <div
            className="relative w-full"
            style={{ height: 72, transformStyle: "preserve-3d" }}
          >
            <div
              className={`absolute inset-0 bg-amber-700 rounded-t-lg flex items-center justify-center ${
                phase === "open" || phase === "reveal" || phase === "exit" ? "lid-open" : ""
              }`}
              style={{ transformOrigin: "bottom center" }}
            >
              {/* Lid ribbon vertical */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 bg-amber-400 opacity-80" />
              {/* Bow */}
              <div className="relative z-10 flex gap-1 items-center">
                <div className={`w-10 h-10 rounded-full border-4 border-amber-400 bg-amber-500 opacity-90 ${phase !== "idle" ? "ribbon-glow" : ""}`} />
                <div className={`w-10 h-10 rounded-full border-4 border-amber-400 bg-amber-500 opacity-90 ${phase !== "idle" ? "ribbon-glow" : ""}`} />
              </div>
            </div>
          </div>

          {/* Box body */}
          <div className="relative w-full bg-amber-800 rounded-b-lg flex flex-col items-center justify-center overflow-hidden" style={{ height: 130 }}>
            {/* Ribbon horizontal */}
            <div className="absolute inset-x-0 top-0 h-5 bg-amber-400 opacity-70" />
            {/* Ribbon vertical */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 bg-amber-400 opacity-70" />

            {/* Logo inside box */}
            {(phase === "reveal" || phase === "exit") && (
              <div className="logo-reveal relative z-10 flex flex-col items-center gap-1 pt-4">
                <span className="text-5xl drop-shadow-lg">🍪</span>
                <span className="font-bold text-amber-50 text-lg tracking-wide text-center leading-tight drop-shadow">
                  {storeConfig.name}
                </span>
                <span className="text-amber-300 text-xs tracking-widest uppercase mt-0.5">
                  {storeConfig.tagline ?? "Hecho con amor"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
