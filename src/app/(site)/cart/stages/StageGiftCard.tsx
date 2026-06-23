"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, Gift, CheckCircle } from "lucide-react";
import { crearGiftCard } from "@/actions/giftCards";
import { storeConfig } from "@/config/store";

const MONTOS = [200, 500, 1000];

export default function StageGiftCard({ onBack }: { onBack: () => void }) {
  const [monto, setMonto] = useState(500);
  const [montoCustom, setMontoCustom] = useState("");
  const [compradorTelefono, setCompradorTelefono] = useState("");
  const [destinatarioNombre, setDestinatarioNombre] = useState("");
  const [destinatarioTelefono, setDestinatarioTelefono] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codigo, setCodigo] = useState<string | null>(null);

  const montoFinal = montoCustom ? parseFloat(montoCustom) : monto;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const result = await crearGiftCard({
      monto: montoFinal,
      comprador_telefono: compradorTelefono,
      destinatario_nombre: destinatarioNombre || undefined,
      destinatario_telefono: destinatarioTelefono || undefined,
      mensaje: mensaje || undefined,
    });
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    setCodigo(result.data.codigo);
  }

  if (codigo) {
    const msg = `Hola! Acabo de comprar una tarjeta de regalo *${codigo}* por L.${montoFinal.toFixed(2)}. Quisiera confirmar el pago.`;
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center">
        <CheckCircle size={52} style={{ color: "var(--green, #157a4d)", margin: "0 auto 18px" }} />
        <h2 className="font-bold mb-2" style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif", fontSize: 24, color: "var(--ink)" }}>
          ¡Tarjeta creada!
        </h2>
        <p className="mb-1" style={{ color: "var(--ink-soft)", fontSize: 14.5 }}>Tu código es</p>
        <p className="font-mono font-bold mb-6" style={{ fontSize: 22, color: "var(--orange-ink)", letterSpacing: ".05em" }}>{codigo}</p>
        <p className="mb-6" style={{ color: "var(--ink-soft)", fontSize: 14 }}>
          Confírmanos el pago por WhatsApp para activar la tarjeta.
        </p>
        <a href={`https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 font-bold cursor-pointer border-0 text-white w-full"
          style={{ background: "var(--wa, #1faa55)", borderRadius: "var(--r-pill)", padding: "13px", fontSize: 15.5 }}>
          Confirmar pago por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 py-12">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 mb-6 border-0 bg-transparent cursor-pointer" style={{ color: "var(--ink-soft)", fontSize: 14 }}>
        <ArrowLeft size={15} /> Volver
      </button>
      <Gift size={30} style={{ color: "var(--orange-ink)", marginBottom: 10 }} />
      <h2 className="font-bold mb-1.5" style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif", fontSize: 26, color: "var(--ink)" }}>
        Tarjeta de regalo
      </h2>
      <p className="mb-7" style={{ color: "var(--ink-soft)", fontSize: 14.5 }}>
        Regala un antojo a alguien especial.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block font-semibold mb-2" style={{ color: "var(--ink)", fontSize: 13.5 }}>Monto</label>
          <div className="flex gap-2 mb-2">
            {MONTOS.map(m => (
              <button key={m} type="button" onClick={() => { setMonto(m); setMontoCustom(""); }}
                className="flex-1 font-semibold cursor-pointer"
                style={{ padding: "10px", borderRadius: "var(--r-md)", border: `1.5px solid ${!montoCustom && monto === m ? "var(--orange)" : "var(--hairline)"}`, background: !montoCustom && monto === m ? "var(--cream)" : "var(--paper-card)", color: "var(--ink)", fontSize: 14 }}>
                L.{m}
              </button>
            ))}
          </div>
          <input type="number" min={50} max={50000} value={montoCustom} onChange={e => setMontoCustom(e.target.value)} placeholder="Otro monto"
            className="w-full outline-none" style={{ padding: "11px 14px", border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)", background: "var(--paper-card)", fontSize: 14.5 }} />
        </div>

        <Field label="Tu teléfono *">
          <input type="tel" required value={compradorTelefono} onChange={e => setCompradorTelefono(e.target.value)} placeholder="9999-9999" style={inputStyle} />
        </Field>
        <Field label="Nombre del destinatario">
          <input value={destinatarioNombre} onChange={e => setDestinatarioNombre(e.target.value)} placeholder="Opcional" style={inputStyle} />
        </Field>
        <Field label="Teléfono del destinatario">
          <input type="tel" value={destinatarioTelefono} onChange={e => setDestinatarioTelefono(e.target.value)} placeholder="Opcional" style={inputStyle} />
        </Field>
        <Field label="Mensaje">
          <textarea value={mensaje} onChange={e => setMensaje(e.target.value)} rows={3} placeholder="Escribe un mensaje (opcional)" style={{ ...inputStyle, resize: "vertical" }} />
        </Field>

        {error && <p style={{ color: "var(--berry)", fontSize: 13.5 }}>{error}</p>}

        <button type="submit" disabled={loading || !montoFinal || montoFinal < 50}
          className="inline-flex items-center justify-center gap-2 font-bold cursor-pointer border-0 text-white"
          style={{ background: "var(--orange)", borderRadius: "var(--r-pill)", padding: "13px", fontSize: 15.5, opacity: loading ? 0.7 : 1, boxShadow: "0 6px 18px rgba(217,113,30,.3)" }}>
          {loading && <Loader2 size={17} className="animate-spin" />}
          Comprar tarjeta — L.{montoFinal ? montoFinal.toFixed(2) : "0.00"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-semibold mb-1.5" style={{ color: "var(--ink)", fontSize: 13.5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)",
  background: "var(--paper-card)", fontSize: 14.5, color: "var(--ink)", outline: "none",
};
