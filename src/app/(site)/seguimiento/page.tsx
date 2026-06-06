"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { buscarPedidosPorTelefono, type PedidoTracking } from "@/actions/publico";
import BLIcon from "@/components/BLIcon";
import { storeConfig } from "@/config/store";

const ACTIVOS: string[] = ['pendiente', 'preparacion', 'listo'];

const ESTADO_LABEL: Record<string, string> = {
  pendiente:   "Pendiente",
  preparacion: "En preparación",
  listo:       "¡Listo para entregar!",
  completado:  "Completado",
};

const ESTADO_STYLE: Record<string, { bg: string; color: string }> = {
  pendiente:   { bg: "rgba(232,162,58,.18)", color: "var(--orange-ink)" },
  preparacion: { bg: "rgba(42,111,219,.12)", color: "#2a6fdb" },
  listo:       { bg: "rgba(31,170,85,.14)", color: "#1a7a40" },
  completado:  { bg: "rgba(42,26,14,.06)", color: "var(--ink-soft)" },
};

const TIMELINE_STEPS = [
  { key: "pendiente",   label: "Pedido recibido",     desc: "Tu pedido llegó. Estamos revisándolo." },
  { key: "preparacion", label: "En preparación",       desc: "Manos a la masa. Tu pedido está siendo preparado." },
  { key: "listo",       label: "Listo para entregar",  desc: "Todo fresco y listo. Coordinaremos la entrega." },
  { key: "completado",  label: "Completado",           desc: "¡Pedido entregado con éxito! Gracias." },
];

const ORDEN: Record<string, number> = {
  pendiente: 0, preparacion: 1, listo: 2, completado: 3,
};

export default function SeguimientoPage() {
  const [telefono,    setTelefono]   = useState("");
  const [pedidos,     setPedidos]    = useState<PedidoTracking[]>([]);
  const [loading,     setLoading]    = useState(false);
  const [searched,    setSearched]   = useState(false);
  const [error,       setError]      = useState("");
  const [openId,      setOpenId]     = useState<string | null>(null);
  const [soloActivos, setSoloActivos] = useState(false);

  useEffect(() => {
    const phone = new URLSearchParams(window.location.search).get("telefono");
    if (!phone) return;
    setTelefono(phone);
    setLoading(true);
    buscarPedidosPorTelefono(phone).then((result) => {
      if (result.success) {
        setPedidos(result.data);
        setSearched(true);
        if (result.data.length > 0) setOpenId(result.data[0].id);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!telefono.trim()) return;
    setLoading(true);
    setError("");
    const result = await buscarPedidosPorTelefono(telefono);
    if (result.success) {
      setPedidos(result.data);
      setSearched(true);
      if (result.data.length > 0) setOpenId(result.data[0].id);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  const pedidosFiltrados = soloActivos ? pedidos.filter(p => ACTIVOS.includes(p.estado)) : pedidos;
  const activosCount = pedidos.filter(p => ACTIVOS.includes(p.estado)).length;

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
            <BLIcon name="truck" size={15} />
            Estado de tu pedido
          </span>
          <h1
            className="font-extrabold mt-4 mb-3"
            style={{ fontSize: "clamp(36px, 5vw, 60px)", color: "var(--on-dark)" }}
          >
            Seguimiento
          </h1>
          <p style={{ color: "var(--on-dark-soft)", fontSize: "clamp(16px, 1.4vw, 19px)", maxWidth: "46ch", marginInline: "auto" }}>
            Ingresa tu teléfono para ver el estado de tus pedidos.
          </p>
        </div>
      </section>

      <div
        className="mx-auto px-[var(--gutter)]"
        style={{ maxWidth: "var(--maxw)", paddingBlock: "clamp(40px, 5vw, 64px) clamp(56px, 7vw, 96px)" }}
      >
        {/* Search card — overlapping the header */}
        <div
          className="mx-auto rounded-[24px] p-6 -mt-8 relative z-10 mb-10"
          style={{
            maxWidth: 620,
            background: "var(--paper-card)",
            border: "1px solid var(--hairline)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <h2 className="mb-1.5" style={{ fontSize: 22 }}>Buscar pedido</h2>
          <p className="mb-4 text-[14px]" style={{ color: "var(--ink-soft)" }}>
            Ingresa el número que usaste al hacer tu pedido.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2.5">
            <div className="flex-1 relative flex items-center">
              <BLIcon
                name="search"
                size={18}
                className="absolute left-4 pointer-events-none"
                style={{ color: "var(--ink-soft)" } as React.CSSProperties}
              />
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 9999-0000"
                className="w-full border focus:outline-none"
                style={{
                  borderRadius: "var(--r-md)",
                  padding: "14px 16px 14px 44px",
                  fontFamily: "inherit",
                  fontSize: 15,
                  color: "var(--ink)",
                  background: "var(--paper)",
                  borderColor: "var(--hairline)",
                }}
                onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "var(--orange)")}
                onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = "var(--hairline)")}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !telefono.trim()}
              className="inline-flex items-center gap-2 font-bold text-[15px] px-6 rounded-[16px] text-white border-0 cursor-pointer disabled:opacity-50 transition-colors"
              style={{ background: "var(--orange)" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BLIcon name="search" size={18} />}
              Buscar
            </button>
          </form>
        </div>

        {error && (
          <div
            className="mx-auto mb-6 rounded-[16px] px-4 py-3 text-sm"
            style={{ maxWidth: 720, background: "rgba(158,59,70,.1)", color: "var(--berry)", border: "1px solid rgba(158,59,70,.25)" }}
          >
            {error}
          </div>
        )}

        {searched && pedidos.length === 0 && !error && (
          <div
            className="mx-auto text-center py-12"
            style={{ maxWidth: 620, color: "var(--ink-soft)" }}
          >
            <BLIcon name="search" size={40} className="mx-auto mb-4" style={{ color: "var(--hairline)" } as React.CSSProperties} />
            <p className="font-semibold text-[16px]" style={{ color: "var(--ink)" }}>
              No encontramos pedidos
            </p>
            <p className="text-[14px] mt-1">
              Verifica que el número sea exactamente el que usaste al hacer el pedido.
            </p>
          </div>
        )}

        {pedidos.length > 0 && (
          <div className="mx-auto" style={{ maxWidth: 720 }}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <p className="text-[14px] font-semibold" style={{ color: "var(--ink-soft)" }}>
                {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? "pedido" : "pedidos"}
                {soloActivos ? " activos" : ""} para {pedidos[0].nombre_cliente}
              </p>
              {pedidos.length > 1 && (
                <div className="inline-flex" style={{ background: "var(--cream-200)", borderRadius: "var(--r-pill)", padding: 3 }}>
                  {[
                    { label: "Todos", value: false },
                    { label: `Activos${activosCount > 0 ? ` (${activosCount})` : ""}`, value: true },
                  ].map(opt => (
                    <button
                      key={String(opt.value)}
                      onClick={() => setSoloActivos(opt.value)}
                      style={{
                        fontSize: 13, fontWeight: 600, padding: "7px 16px",
                        borderRadius: "var(--r-pill)", border: "none", cursor: "pointer",
                        background: soloActivos === opt.value ? "var(--paper-card)" : "none",
                        color: soloActivos === opt.value ? "var(--ink)" : "var(--ink-soft)",
                        boxShadow: soloActivos === opt.value ? "var(--shadow-sm)" : "none",
                        transition: ".15s",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-4">
              {pedidosFiltrados.map((p) => {
                const isOpen = openId === p.id;
                const estadoStyle = ESTADO_STYLE[p.estado] ?? ESTADO_STYLE.pendiente;
                const currentIdx = ORDEN[p.estado] ?? 0;

                return (
                  <div
                    key={p.id}
                    className="overflow-hidden rounded-[24px]"
                    style={{
                      background: "var(--paper-card)",
                      border: "1px solid var(--hairline)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {/* Row */}
                    <button
                      onClick={() => setOpenId(isOpen ? null : p.id)}
                      className="w-full flex items-center gap-4 cursor-pointer border-0 text-left"
                      style={{ padding: "20px 24px", background: "transparent" }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-mono" style={{ color: "var(--ink-soft)" }}>
                          #{p.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[14px] mt-0.5" style={{ color: "var(--ink-soft)" }}>
                          {new Date(p.created_at).toLocaleDateString("es-HN", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className="font-extrabold text-[22px]"
                          style={{
                            fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif",
                            color: "var(--orange-ink)",
                          }}
                        >
                          L.{Number(p.total).toFixed(2)}
                        </span>
                        <span
                          className="inline-flex items-center gap-1.5 text-[13px] font-bold px-3 py-1.5 rounded-full"
                          style={{ background: estadoStyle.bg, color: estadoStyle.color }}
                        >
                          {ESTADO_LABEL[p.estado]}
                        </span>
                      </div>
                      <div
                        className="w-[44px] h-[44px] rounded-full grid place-items-center transition-transform flex-none"
                        style={{
                          border: "1px solid var(--hairline)",
                          color: "var(--ink-soft)",
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      >
                        <BLIcon name="arrow-right" size={16} className="rotate-90" />
                      </div>
                    </button>

                    {/* Detail / timeline */}
                    {isOpen && (
                      <div style={{ borderTop: "1px solid var(--hairline)", padding: "24px" }}>
                        <div className="flex flex-col">
                          {TIMELINE_STEPS.map((step, idx) => {
                            const done = ORDEN[step.key] < currentIdx;
                            const current = ORDEN[step.key] === currentIdx;
                            const pending = ORDEN[step.key] > currentIdx;

                            return (
                              <div key={step.key} className="flex gap-4 relative">
                                {/* Marker */}
                                <div className="flex flex-col items-center flex-none" style={{ width: 38 }}>
                                  <div
                                    className="w-[38px] h-[38px] rounded-full grid place-items-center flex-none"
                                    style={{
                                      background: done
                                        ? "var(--amber)"
                                        : current
                                        ? "var(--orange)"
                                        : "var(--cream-200)",
                                      color: done
                                        ? "var(--choco-900)"
                                        : current
                                        ? "#fff"
                                        : "var(--ink-soft)",
                                      border: current
                                        ? "2px solid rgba(217,113,30,.25)"
                                        : "2px solid transparent",
                                      boxShadow: current
                                        ? "0 0 0 5px rgba(217,113,30,.14)"
                                        : "none",
                                    }}
                                  >
                                    {done ? (
                                      "✓"
                                    ) : (
                                      <BLIcon
                                        name={
                                          step.key === "completado"
                                            ? "heart"
                                            : step.key === "listo"
                                            ? "star"
                                            : step.key === "preparacion"
                                            ? "sparkle"
                                            : "clock"
                                        }
                                        size={19}
                                      />
                                    )}
                                  </div>
                                  {idx < TIMELINE_STEPS.length - 1 && (
                                    <div
                                      className="w-0.5 flex-1"
                                      style={{
                                        background: done ? "var(--amber)" : "var(--hairline)",
                                        minHeight: 28,
                                        margin: "4px 0",
                                      }}
                                    />
                                  )}
                                </div>

                                {/* Body */}
                                <div className="pb-7 pt-1.5">
                                  <strong
                                    className="block text-[19px]"
                                    style={{
                                      fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif",
                                      color: pending
                                        ? "var(--ink-soft)"
                                        : current
                                        ? "var(--orange-ink)"
                                        : "var(--ink)",
                                    }}
                                  >
                                    {step.label}
                                  </strong>
                                  {(done || current) && (
                                    <p className="text-[14px] mt-1" style={{ color: "var(--ink-soft)" }}>
                                      {step.desc}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div
                          className="flex justify-between items-center flex-wrap gap-3 pt-4 mt-2"
                          style={{ borderTop: "1px solid var(--hairline)" }}
                        >
                          <p className="text-[14px]" style={{ color: "var(--ink-soft)" }}>
                            ¿Preguntas? Escríbenos por WhatsApp.
                          </p>
                          <a
                            href={`https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(`Hola! Tengo una pregunta sobre mi pedido #${p.id.slice(0,8).toUpperCase()} 🍪`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 font-bold text-[14px] px-4 py-2 rounded-full text-white no-underline"
                            style={{ background: "var(--choco-900)" }}
                          >
                            <BLIcon name="whatsapp" size={16} style={{ color: "#58d684" } as React.CSSProperties} />
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
