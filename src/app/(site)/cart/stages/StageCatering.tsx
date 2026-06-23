"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Users, CheckCircle } from "lucide-react";
import { crearSolicitudCatering } from "@/actions/catering";
import { getConfiguracionEnvio } from "@/actions/publico";
import { storeConfig } from "@/config/store";

const RANGOS = ["10-20 personas", "20-50 personas", "50-100 personas", "100+ personas"];

export default function StageCatering({ onBack }: { onBack: () => void }) {
  const [sedes, setSedes] = useState<string[]>([]);
  const [tipoEvento, setTipoEvento] = useState("");
  const [rangoPersonas, setRangoPersonas] = useState(RANGOS[0]);
  const [fechaEvento, setFechaEvento] = useState("");
  const [sedeCercana, setSedeCercana] = useState("");
  const [detalles, setDetalles] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    getConfiguracionEnvio().then(cfg => setSedes(cfg.sedes.map(s => s.nombre)));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const result = await crearSolicitudCatering({
      tipo_evento: tipoEvento,
      rango_personas: rangoPersonas,
      fecha_evento: fechaEvento,
      sede_cercana: sedeCercana || undefined,
      detalles: detalles || undefined,
      cliente_nombre: clienteNombre,
      cliente_telefono: clienteTelefono,
    });
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    setDone(true);
  }

  if (done) {
    const msg = `Hola! Acabo de enviar una solicitud de catering: evento "${tipoEvento}", ${rangoPersonas}, fecha ${fechaEvento}. Quisiera más información.`;
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center">
        <CheckCircle size={52} style={{ color: "var(--green, #157a4d)", margin: "0 auto 18px" }} />
        <h2 className="font-bold mb-2" style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif", fontSize: 24, color: "var(--ink)" }}>
          ¡Solicitud enviada!
        </h2>
        <p className="mb-6" style={{ color: "var(--ink-soft)", fontSize: 14.5 }}>
          Te contactaremos pronto para cotizar tu evento.
        </p>
        <a href={`https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 font-bold cursor-pointer border-0 text-white w-full"
          style={{ background: "var(--wa, #1faa55)", borderRadius: "var(--r-pill)", padding: "13px", fontSize: 15.5 }}>
          Hablar por WhatsApp ahora
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 py-12">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 mb-6 border-0 bg-transparent cursor-pointer" style={{ color: "var(--ink-soft)", fontSize: 14 }}>
        <ArrowLeft size={15} /> Volver
      </button>
      <Users size={30} style={{ color: "var(--orange-ink)", marginBottom: 10 }} />
      <h2 className="font-bold mb-1.5" style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif", fontSize: 26, color: "var(--ink)" }}>
        Catering para tu evento
      </h2>
      <p className="mb-7" style={{ color: "var(--ink-soft)", fontSize: 14.5 }}>
        Cuéntanos los detalles y te cotizamos.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Tipo de evento *">
          <input required value={tipoEvento} onChange={e => setTipoEvento(e.target.value)} placeholder="Boda, cumpleaños, corporativo…" style={inputStyle} />
        </Field>
        <Field label="Rango de personas *">
          <select required value={rangoPersonas} onChange={e => setRangoPersonas(e.target.value)} style={inputStyle}>
            {RANGOS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Fecha del evento *">
          <input required type="date" value={fechaEvento} onChange={e => setFechaEvento(e.target.value)} style={inputStyle} />
        </Field>
        {sedes.length > 0 && (
          <Field label="Sede más cercana">
            <select value={sedeCercana} onChange={e => setSedeCercana(e.target.value)} style={inputStyle}>
              <option value="">Selecciona (opcional)</option>
              {sedes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        )}
        <Field label="Detalles">
          <textarea value={detalles} onChange={e => setDetalles(e.target.value)} rows={3} placeholder="Cuéntanos más sobre tu evento (opcional)" style={{ ...inputStyle, resize: "vertical" }} />
        </Field>
        <Field label="Tu nombre *">
          <input required value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Tu teléfono *">
          <input required type="tel" value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)} placeholder="9999-9999" style={inputStyle} />
        </Field>

        {error && <p style={{ color: "var(--berry)", fontSize: 13.5 }}>{error}</p>}

        <button type="submit" disabled={loading}
          className="inline-flex items-center justify-center gap-2 font-bold cursor-pointer border-0 text-white"
          style={{ background: "var(--orange)", borderRadius: "var(--r-pill)", padding: "13px", fontSize: 15.5, opacity: loading ? 0.7 : 1, boxShadow: "0 6px 18px rgba(217,113,30,.3)" }}>
          {loading && <Loader2 size={17} className="animate-spin" />}
          Enviar solicitud
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
