"use client";

import { Store, Home, Gift, Users } from "lucide-react";

const PATHS = [
  { key: "pickup",     label: "Recoger en tienda",  desc: "Elige una sede y pasa a recogerlo",   Icon: Store },
  { key: "domicilio",  label: "Envío a domicilio",  desc: "Lo llevamos hasta tu puerta",          Icon: Home },
  { key: "giftcard",   label: "Tarjeta de regalo",  desc: "Regala un antojo a alguien especial",  Icon: Gift },
  { key: "catering",   label: "Catering / eventos", desc: "Cotiza para tu próximo evento",        Icon: Users },
];

export default function StageStart({
  onPickup, onDomicilio, onGiftCard, onCatering,
}: {
  onPickup: () => void;
  onDomicilio: () => void;
  onGiftCard: () => void;
  onCatering: () => void;
}) {
  const handlers: Record<string, () => void> = {
    pickup: onPickup, domicilio: onDomicilio, giftcard: onGiftCard, catering: onCatering,
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <h1
        className="text-center font-bold mb-2"
        style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif", fontSize: 34, color: "var(--ink)" }}
      >
        Empieza tu pedido
      </h1>
      <p className="text-center mb-9" style={{ color: "var(--ink-soft)", fontSize: 15.5 }}>
        ¿Cómo quieres tu antojo?
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PATHS.map(p => (
          <button
            key={p.key}
            onClick={handlers[p.key]}
            className="flex items-center gap-4 text-left cursor-pointer transition-all border-0"
            style={{
              background: "var(--paper-card)",
              border: "1.5px solid var(--hairline)",
              borderRadius: "var(--r-lg)",
              padding: "20px 22px",
              boxShadow: "var(--shadow-sm)",
            }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)"; }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)"; }}
          >
            <div
              className="grid place-items-center shrink-0"
              style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--cream)", color: "var(--orange-ink)" }}
            >
              <p.Icon size={22} />
            </div>
            <div>
              <p className="font-bold" style={{ color: "var(--ink)", fontSize: 16 }}>{p.label}</p>
              <p style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>{p.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
