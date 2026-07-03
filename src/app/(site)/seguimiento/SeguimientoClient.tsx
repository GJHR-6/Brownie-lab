"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { buscarPedidosPorTelefono, buscarPedidoPorCodigo, type PedidoTracking, type PedidoTrackingItem } from "@/actions/publico";
import BLIcon from "@/components/BLIcon";

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

type Modo = "telefono" | "codigo";

export default function SeguimientoClient({ whatsapp }: { whatsapp: string }) {
  // Deep-link: ?telefono= o ?codigo= precargan la búsqueda
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get("telefono");
  const codeParam  = searchParams.get("codigo");
  const autoParam  = phoneParam ?? codeParam;
  const autoModo: Modo = phoneParam ? "telefono" : "codigo";

  const [modo,        setModo]       = useState<Modo>(autoParam ? autoModo : "telefono");
  const [input,       setInput]      = useState(autoParam ?? "");
  const [pedidos,     setPedidos]    = useState<PedidoTracking[]>([]);
  const [loading,     setLoading]    = useState(false);
  const [searched,    setSearched]   = useState(false);
  const [error,       setError]      = useState("");
  const [openId,      setOpenId]     = useState<string | null>(null);
  const [soloActivos, setSoloActivos] = useState(false);

  async function runSearch(m: Modo, val: string) {
    setLoading(true);
    setError("");
    setPedidos([]);
    setSearched(false);
    if (m === "telefono") {
      const result = await buscarPedidosPorTelefono(val);
      if (result.success) {
        setPedidos(result.data);
        setSearched(true);
        if (result.data.length > 0) setOpenId(result.data[0].id);
      } else {
        setError(result.error);
        setSearched(true);
      }
    } else {
      const result = await buscarPedidoPorCodigo(val);
      if (result.success && result.data) {
        setPedidos([result.data]);
        setSearched(true);
        setOpenId(result.data.id);
      } else {
        setError(!result.success ? result.error : "No encontramos ese pedido.");
        setSearched(true);
      }
    }
    setLoading(false);
  }

  // Auto-buscar al montar si vino un parámetro en la URL
  useEffect(() => {
    if (autoParam) runSearch(autoModo, autoParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    runSearch(modo, input.trim());
  }

  function switchModo(m: Modo) {
    setModo(m);
    setInput("");
    setPedidos([]);
    setSearched(false);
    setError("");
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

          {/* Modo toggle */}
          <div className="inline-flex mb-4" style={{ background: "var(--cream-200)", borderRadius: "var(--r-pill)", padding: 3 }}>
            {(["telefono", "codigo"] as Modo[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchModo(m)}
                style={{
                  fontSize: 13, fontWeight: 600, padding: "6px 16px",
                  borderRadius: "var(--r-pill)", border: "none", cursor: "pointer",
                  background: modo === m ? "var(--paper-card)" : "none",
                  color: modo === m ? "var(--ink)" : "var(--ink-soft)",
                  boxShadow: modo === m ? "var(--shadow-sm)" : "none",
                  transition: ".15s",
                }}
              >
                {m === "telefono" ? "Por teléfono" : "Por código #"}
              </button>
            ))}
          </div>

          <p className="mb-4 text-[14px]" style={{ color: "var(--ink-soft)" }}>
            {modo === "telefono"
              ? "Ingresa el número que usaste al hacer tu pedido."
              : "Ingresa el código del pedido (ej: #A1B2C3D4) que recibiste al confirmar."}
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
                type={modo === "telefono" ? "tel" : "text"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={modo === "telefono" ? "Ej: 9999-0000" : "Ej: A1B2C3D4"}
                className="w-full border focus:outline-none"
                style={{
                  borderRadius: "var(--r-md)",
                  padding: "14px 16px 14px 44px",
                  fontFamily: modo === "codigo" ? "ui-monospace, monospace" : "inherit",
                  fontSize: 15,
                  color: "var(--ink)",
                  background: "var(--paper)",
                  borderColor: "var(--hairline)",
                  letterSpacing: modo === "codigo" ? ".08em" : undefined,
                  textTransform: modo === "codigo" ? "uppercase" : undefined,
                }}
                onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "var(--orange)")}
                onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = "var(--hairline)")}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
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

                        {/* Ítems del pedido */}
                        {p.items && p.items.length > 0 && (
                          <div className="mb-6">
                            <p className="text-[11px] font-bold tracking-[.1em] uppercase mb-3" style={{ color: "var(--ink-soft)" }}>
                              Productos
                            </p>
                            <div
                              className="rounded-[14px] overflow-hidden"
                              style={{ border: "1px solid var(--hairline)" }}
                            >
                              {(p.items as PedidoTrackingItem[]).map((item, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between gap-3"
                                  style={{
                                    padding: "10px 14px",
                                    fontSize: 14,
                                    borderBottom: i < p.items!.length - 1 ? "1px solid var(--hairline)" : "none",
                                    background: "var(--paper-card)",
                                  }}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                      className="w-6 h-6 rounded-md grid place-items-center text-[12px] font-bold flex-none"
                                      style={{ background: "var(--cream)", color: "var(--orange-ink)" }}
                                    >
                                      {item.cantidad}
                                    </span>
                                    <span className="truncate" style={{ color: "var(--ink)" }}>{item.nombre}</span>
                                  </div>
                                  <span className="font-bold shrink-0" style={{ color: "var(--orange-ink)" }}>
                                    L.{Number(item.subtotal).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

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
                            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola! Tengo una pregunta sobre mi pedido #${p.id.slice(0,8).toUpperCase()} 🍪`)}`}
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
