"use client";

import { useRef, useState } from "react";
import { Loader2, ArrowLeft, Phone } from "lucide-react";
import { generarOtp, verificarOtp } from "@/actions/otp";
import { buscarCliente } from "@/actions/fidelizacion";

export default function StageSignIn({
  onVerified, onBack,
}: {
  onVerified: (telefono: string) => void;
  onBack: () => void;
}) {
  const [telefono, setTelefono] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [migas, setMigas] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const result = await generarOtp(telefono);
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    setSent(true);
    setDevCode(result.data?.devCode ?? null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const result = await verificarOtp(telefono, code);
    setLoading(false);
    if (!result.success) { setError(result.error); return; }

    const cliente = await buscarCliente(result.data.telefono);
    const tieneMigas = cliente.success;
    if (tieneMigas) setMigas(cliente.data.cliente.compras_actuales);

    setTimeout(() => onVerified(result.data.telefono), tieneMigas ? 900 : 0);
  }

  return (
    <div className="max-w-md mx-auto px-5 py-12">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 mb-6 border-0 bg-transparent cursor-pointer" style={{ color: "var(--ink-soft)", fontSize: 14 }}>
        <ArrowLeft size={15} /> Volver
      </button>

      <h2 className="font-bold mb-1.5" style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif", fontSize: 26, color: "var(--ink)" }}>
        Identifícate con tu WhatsApp
      </h2>
      <p className="mb-7" style={{ color: "var(--ink-soft)", fontSize: 14.5 }}>
        Te enviamos un código de 4 dígitos para confirmar tu número.
      </p>

      {!sent ? (
        <form onSubmit={handleSend} className="flex flex-col gap-4">
          <div className="relative flex items-center">
            <Phone size={17} className="absolute left-4" style={{ color: "var(--ink-soft)" }} />
            <input
              type="tel" required value={telefono} onChange={e => setTelefono(e.target.value)}
              placeholder="9999-9999" autoFocus
              className="w-full outline-none"
              style={{ padding: "13px 16px 13px 42px", border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)", background: "var(--paper-card)", fontSize: 15.5, color: "var(--ink)" }}
            />
          </div>
          {error && <p style={{ color: "var(--berry)", fontSize: 13.5 }}>{error}</p>}
          <button type="submit" disabled={loading}
            className="inline-flex items-center justify-center gap-2 font-bold cursor-pointer border-0 text-white"
            style={{ background: "var(--orange)", borderRadius: "var(--r-pill)", padding: "13px", fontSize: 15.5, opacity: loading ? 0.7 : 1, boxShadow: "0 6px 18px rgba(217,113,30,.3)" }}
          >
            {loading && <Loader2 size={17} className="animate-spin" />}
            Enviar código
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          {devCode && (
            <p style={{ background: "var(--cream)", border: "1px solid var(--amber)", borderRadius: "var(--r-md)", padding: "10px 14px", fontSize: 13.5, color: "var(--orange-ink)" }}>
              Modo prueba: tu código es <strong>{devCode}</strong>
            </p>
          )}
          <input
            ref={inputRef}
            type="text" inputMode="numeric" maxLength={4} required value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="0000"
            className="text-center outline-none"
            style={{ padding: "14px", border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)", background: "var(--paper-card)", fontSize: 26, fontWeight: 700, letterSpacing: ".4em", color: "var(--ink)" }}
          />
          {error && <p style={{ color: "var(--berry)", fontSize: 13.5 }}>{error}</p>}
          {migas !== null && (
            <p style={{ color: "var(--green, #157a4d)", fontSize: 13.5 }}>
              ¡Tienes {migas} migas acumuladas! 🍪
            </p>
          )}
          <button type="submit" disabled={loading || code.length !== 4}
            className="inline-flex items-center justify-center gap-2 font-bold cursor-pointer border-0 text-white"
            style={{ background: "var(--orange)", borderRadius: "var(--r-pill)", padding: "13px", fontSize: 15.5, opacity: loading || code.length !== 4 ? 0.7 : 1, boxShadow: "0 6px 18px rgba(217,113,30,.3)" }}
          >
            {loading && <Loader2 size={17} className="animate-spin" />}
            Verificar
          </button>
          <button type="button" onClick={() => { setSent(false); setCode(""); setDevCode(null); }}
            className="border-0 bg-transparent cursor-pointer" style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>
            Cambiar número o reenviar
          </button>
        </form>
      )}
    </div>
  );
}
