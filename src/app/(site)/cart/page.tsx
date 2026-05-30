"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Loader2, Tag, X, CheckCircle, ChevronDown, ChevronUp,
  Package, MapPin, Clock, Wallet, Phone, User, FileText,
  Home, Store,
} from "lucide-react";
import BLIcon from "@/components/BLIcon";
import { useCartStore } from "@/lib/cartStore";
import { storeConfig } from "@/config/store";
import { validarPromocion, crearPedidoPublico, getConfiguracionBanco } from "@/actions/publico";
import { enviarConfirmacionWhatsApp } from "@/actions/whatsapp";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

type Step = 1 | 2 | 3 | "success";
type TipoEntrega = "pickup" | "domicilio";
type MetodoPago = "efectivo" | "transferencia" | "";

interface DatosForm {
  nombre: string;
  telefono: string;
  tipo_entrega: TipoEntrega;
  direccion: string;
  fecha_entrega: string;
  hora_entrega: string;
  notas: string;
  metodo_pago: MetodoPago;
}

const METODOS_PAGO = [
  { id: "efectivo",      label: "Efectivo",             icon: "💵", desc: "Paga al recibir tu pedido" },
  { id: "transferencia", label: "Transferencia bancaria", icon: "🏦", desc: "Te enviamos los datos al confirmar" },
] as const;

const HORAS = ["9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM"];

const STEPS = [
  { n: 1, label: "Carrito" },
  { n: 2, label: "Datos y pago" },
  { n: 3, label: "Confirmar" },
];

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, total, itemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ codigo: string; descuento_porcentaje: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const idempotencyKey = useRef(crypto.randomUUID());
  const [ssFile, setSsFile] = useState<File | null>(null);
  const [banco, setBanco] = useState({ banco: '', titular: '', numero: '' });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof DatosForm, string>>>({});
  const [datos, setDatos] = useState<DatosForm>({
    nombre: "", telefono: "", tipo_entrega: "pickup",
    direccion: "", fecha_entrega: "", hora_entrega: "", notas: "", metodo_pago: "",
  });
  const [savedUser, setSavedUser] = useState<Partial<DatosForm> | null>(null);

  useEffect(() => {
    setMounted(true);
    getConfiguracionBanco().then(setBanco);
    // Load saved user data from previous order
    try {
      const lastPhone = localStorage.getItem("brownielab_last_phone");
      if (lastPhone) {
        const raw = localStorage.getItem(`brownielab_user_${lastPhone}`);
        if (raw) setSavedUser(JSON.parse(raw));
      }
    } catch { /* ignore */ }
  }, []);
  if (!mounted) return null;

  const subtotal = total();
  const descuento = promo ? Math.round(subtotal * (promo.descuento_porcentaje / 100) * 100) / 100 : 0;
  const totalFinal = subtotal - descuento;
  const sym = storeConfig.currencySymbol;

  function fillFromSaved() {
    if (!savedUser) return;
    setDatos(d => ({
      ...d,
      nombre:        savedUser.nombre        ?? d.nombre,
      telefono:      savedUser.telefono      ?? d.telefono,
      tipo_entrega:  savedUser.tipo_entrega  ?? d.tipo_entrega,
      direccion:     savedUser.direccion     ?? d.direccion,
      metodo_pago:   savedUser.metodo_pago   ?? d.metodo_pago,
    }));
    setSavedUser(null);
  }

  async function handleApplyPromo() {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    const result = await validarPromocion(promoInput.trim());
    if (result.success) { setPromo(result.data); setPromoInput(""); }
    else setPromoError(result.error);
    setPromoLoading(false);
  }

  function validateDatos(): boolean {
    const e: Partial<Record<keyof DatosForm, string>> = {};
    if (!datos.nombre.trim() || datos.nombre.trim().length < 2) e.nombre = "Nombre requerido (mín. 2 caracteres)";
    if (!/^\d{8,}$/.test(datos.telefono.replace(/\D/g, ""))) e.telefono = "Teléfono válido requerido (mín. 8 dígitos)";
    if (datos.tipo_entrega === "domicilio" && !datos.direccion.trim()) e.direccion = "Dirección requerida para entrega a domicilio";
    if (!datos.metodo_pago) e.metodo_pago = "Selecciona un método de pago";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleConfirm() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const pedidoItems = items.map(i => ({
        producto_id: i.id, nombre: i.name, precio: i.price,
        cantidad: i.quantity, subtotal: i.price * i.quantity,
      }));
      const clienteDatos = {
        nombre: datos.nombre.trim(), telefono: datos.telefono.trim(),
        notas: datos.notas.trim() || undefined, metodo_pago: datos.metodo_pago,
        tipo_entrega: datos.tipo_entrega, direccion: datos.direccion.trim() || undefined,
        fecha_entrega: datos.fecha_entrega || undefined, hora_entrega: datos.hora_entrega || undefined,
      };

      const result = await crearPedidoPublico(clienteDatos, pedidoItems, totalFinal, promo, idempotencyKey.current);
      const id = result.success ? result.data?.id : undefined;
      if (id) {
        setOrderId(id);
        // Fire & forget — no bloquea el checkout si falla
        enviarConfirmacionWhatsApp({
          telefono: datos.telefono,
          nombre: datos.nombre,
          orderId: id,
          seguimientoUrl: `${window.location.origin}/seguimiento`,
        });
      }

      const seguimientoUrl = `${window.location.origin}/seguimiento`;
      const pedidoTag = id ? `#${id.slice(0, 8).toUpperCase()}` : "";

      const buildBase = () => {
        const lines: string[] = [`¡Hola ${storeConfig.name}! 🍪`, ""];
        if (pedidoTag) lines.push(`📋 Pedido ${pedidoTag}`, "");
        lines.push("📦 PRODUCTOS:");
        items.forEach(i => lines.push(`• ${i.quantity}x ${i.name} = ${sym}${(i.price * i.quantity).toFixed(2)}`));
        lines.push("", "💰 RESUMEN:");
        lines.push(`Subtotal: ${sym}${subtotal.toFixed(2)}`);
        if (promo) lines.push(`Descuento ${promo.codigo} (${promo.descuento_porcentaje}%): -${sym}${descuento.toFixed(2)}`);
        lines.push(`*Total: ${sym}${totalFinal.toFixed(2)} ${storeConfig.currency}*`);
        lines.push("", "👤 DATOS DEL CLIENTE:");
        lines.push(`Nombre: ${datos.nombre}`, `Teléfono: ${datos.telefono}`);
        lines.push("", `🚚 ENTREGA: ${datos.tipo_entrega === "pickup" ? "Recoger en tienda" : "A domicilio"}`);
        if (datos.tipo_entrega === "domicilio" && datos.direccion) lines.push(`Dirección: ${datos.direccion}`);
        if (datos.fecha_entrega) {
          const fecha = new Date(datos.fecha_entrega + "T12:00:00").toLocaleDateString("es-HN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
          lines.push(`Fecha: ${fecha}`);
        }
        if (datos.hora_entrega) lines.push(`Hora preferida: ${datos.hora_entrega}`);
        if (datos.notas) lines.push("", `📝 NOTAS: ${datos.notas}`);
        return lines;
      };

      let waLines: string[];

      if (datos.metodo_pago === "efectivo") {
        waLines = buildBase();
        waLines.push("", "💵 MÉTODO DE PAGO: Efectivo al recibir");
        waLines.push("", "✅ Tu pedido ha sido recibido. Te contactaremos pronto para confirmarlo.");
        waLines.push(`🔍 Rastrea tu pedido en: ${seguimientoUrl}`);
      } else if (datos.metodo_pago === "transferencia" && ssFile) {
        waLines = buildBase();
        waLines.push("", "🏦 MÉTODO DE PAGO: Transferencia bancaria");
        waLines.push("✅ Adjunto el comprobante de pago.");
        waLines.push("", "¡Gracias! Por favor confirma la recepción.");
        waLines.push(`🔍 Rastrea tu pedido en: ${seguimientoUrl}`);
      } else {
        // transferencia sin SS
        waLines = buildBase();
        waLines.push("", "🏦 MÉTODO DE PAGO: Transferencia bancaria");
        waLines.push("", "Por favor realiza la transferencia a:");
        waLines.push(`🏛 Banco: ${banco.banco}`);
        waLines.push(`👤 Titular: ${banco.titular}`);
        waLines.push(`💳 Cuenta: ${banco.numero}`);
        waLines.push("", "Una vez realizado el pago, envía tu comprobante por este chat.");
        waLines.push(`🔍 Rastrea tu pedido en: ${seguimientoUrl}`);
      }

      window.open(`https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(waLines.join("\n"))}`, "_blank");

      // Persist user data keyed by phone for next visit
      try {
        const toSave: Partial<DatosForm> = {
          nombre:       datos.nombre,
          telefono:     datos.telefono,
          tipo_entrega: datos.tipo_entrega,
          direccion:    datos.direccion,
          metodo_pago:  datos.metodo_pago,
        };
        localStorage.setItem("brownielab_last_phone", datos.telefono);
        localStorage.setItem(`brownielab_user_${datos.telefono}`, JSON.stringify(toSave));
      } catch { /* ignore quota errors */ }

      clearCart();
      setStep("success");
    } catch {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div
        className="max-w-lg mx-auto px-[var(--gutter)] text-center"
        style={{ paddingBlock: "clamp(40px, 7vw, 90px)" }}
      >
        <span
          className="w-24 h-24 rounded-full mx-auto mb-6 grid place-items-center relative"
          style={{ background: "rgba(31,170,85,.12)", color: "var(--wa)" }}
        >
          <span className="text-5xl">✓</span>
          <span
            className="absolute inset-[-10px] rounded-full border-2 border-dashed"
            style={{ borderColor: "rgba(31,170,85,.3)" }}
          />
        </span>
        <h1
          className="font-extrabold mb-2.5"
          style={{ fontSize: "clamp(34px, 5vw, 52px)", color: "var(--ink)" }}
        >
          ¡Pedido enviado!
        </h1>
        {orderId && (
          <span
            className="inline-block font-mono text-[14px] px-4 py-1.5 rounded-full mb-4"
            style={{ background: "var(--cream)", color: "var(--ink-soft)", letterSpacing: ".08em" }}
          >
            #{orderId.slice(0, 8).toUpperCase()}
          </span>
        )}
        <p className="mb-8" style={{ color: "var(--ink-soft)", fontSize: 17 }}>
          Tu pedido fue enviado por WhatsApp. Te confirmaremos en breve — recuerda que preparamos con 24h de anticipación.
        </p>
        <div className="flex flex-col items-center gap-3.5">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 font-bold text-[15px] px-6 py-3.5 rounded-full text-white no-underline"
            style={{ background: "var(--orange)", boxShadow: "0 6px 18px rgba(217,113,30,.32)" }}
          >
            Seguir comprando
            <BLIcon name="arrow-right" size={16} />
          </Link>
          {orderId && (
            <Link
              href="/seguimiento"
              className="inline-flex items-center gap-2 font-bold text-[16px] no-underline"
              style={{ color: "var(--orange-ink)" }}
            >
              Rastrear mi pedido
              <BLIcon name="arrow-right" size={16} />
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div
        className="text-center"
        style={{ paddingBlock: "clamp(60px, 9vw, 120px)", paddingInline: "var(--gutter)" }}
      >
        <span
          className="w-24 h-24 rounded-full mx-auto mb-7 grid place-items-center"
          style={{ background: "var(--cream)", color: "var(--orange-ink)" }}
        >
          <BLIcon name="cart" size={46} />
        </span>
        <h1 className="mb-3" style={{ fontSize: "clamp(30px, 4vw, 44px)", color: "var(--ink)" }}>
          Tu carrito está vacío
        </h1>
        <p className="mb-7" style={{ color: "var(--ink-soft)", fontSize: 17 }}>
          Agrega algunas galletas o brownies para continuar.
        </p>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 font-bold text-[15px] px-6 py-3.5 rounded-full text-white no-underline"
          style={{ background: "var(--orange)", boxShadow: "0 6px 18px rgba(217,113,30,.32)" }}
        >
          Ver el menú
          <BLIcon name="arrow-right" size={16} />
        </Link>
      </div>
    );
  }

  // ── Step indicator ───────────────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center mb-10 flex-wrap gap-2">
      {STEPS.map((s, idx) => {
        const current = typeof step === "number" && step === s.n;
        const done = typeof step === "number" && step > s.n;
        return (
          <div key={s.n} className="flex items-center">
            <button
              onClick={() => done && setStep(s.n as 1 | 2 | 3)}
              disabled={!done}
              className="flex items-center gap-2.5 font-semibold text-[15px] transition-colors"
              style={{
                color: current ? "var(--orange-ink)" : done ? "var(--ink)" : "var(--ink-soft)",
                cursor: done ? "pointer" : "default",
              }}
            >
              <span
                className="w-[30px] h-[30px] rounded-full grid place-items-center text-[14px] font-bold flex-none"
                style={{
                  background: current
                    ? "var(--orange)"
                    : done
                    ? "var(--amber)"
                    : "var(--cream-200)",
                  color: current ? "#fff" : done ? "var(--choco-900)" : "var(--ink-soft)",
                }}
              >
                {done ? "✓" : s.n}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {idx < STEPS.length - 1 && (
              <div
                className="mx-2"
                style={{
                  width: "clamp(24px, 6vw, 80px)",
                  height: 2,
                  background: done ? "var(--amber)" : "var(--hairline)",
                  borderRadius: 2,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Order summary sidebar ────────────────────────────────────────────────────
  const OrderSummary = () => (
    <div
      className="rounded-[24px] p-6"
      style={{
        background: "var(--paper-card)",
        border: "1px solid var(--hairline)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <h3
        className="font-bold text-[13px] tracking-[0.14em] uppercase mb-4"
        style={{ color: "var(--ink-soft)" }}
      >
        Resumen del pedido
      </h3>
      <div className="flex flex-col gap-2.5 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-[15px]">
            <span
              className="w-5 h-5 rounded-md flex-none text-xs text-center leading-5 font-bold"
              style={{ background: "var(--cream)", color: "var(--ink-soft)" }}
            >
              {item.quantity}
            </span>
            <span className="flex-1 truncate" style={{ color: "var(--ink)" }}>
              {item.name}
            </span>
            <span className="font-semibold shrink-0" style={{ color: "var(--ink)" }}>
              {sym}{(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      {promo && (
        <div
          className="flex items-center gap-2 text-[12px] font-semibold rounded-[10px] px-3 py-2 mb-3"
          style={{ background: "rgba(31,170,85,.1)", color: "#1a7a40" }}
        >
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Código <span className="font-mono font-bold">{promo.codigo}</span> ({promo.descuento_porcentaje}% dto.)</span>
        </div>
      )}
      <hr style={{ border: 0, borderTop: "1px solid var(--hairline)", margin: "14px 0" }} />
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[15px]" style={{ color: "var(--ink-soft)" }}>
          <span>Subtotal ({itemCount()} art.)</span>
          <span>{sym}{subtotal.toFixed(2)}</span>
        </div>
        {promo && (
          <div className="flex justify-between text-[15px]" style={{ color: "#1a7a40" }}>
            <span>Descuento</span>
            <span>−{sym}{descuento.toFixed(2)}</span>
          </div>
        )}
      </div>
      <hr style={{ border: 0, borderTop: "1px solid var(--hairline)", margin: "14px 0" }} />
      <div className="flex justify-between items-baseline">
        <span
          className="font-bold text-[21px]"
          style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif" }}
        >
          Total
        </span>
        <span
          className="font-extrabold text-[26px]"
          style={{
            fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif",
            color: "var(--orange-ink)",
          }}
        >
          {sym}{totalFinal.toFixed(2)}{" "}
          <small className="text-[12px] font-semibold" style={{ color: "var(--ink-soft)" }}>
            {storeConfig.currency}
          </small>
        </span>
      </div>
      {step !== 1 && (
        <button
          onClick={() => setStep(1)}
          className="block text-center mt-4 w-full text-[14px] font-semibold cursor-pointer border-0 bg-transparent underline"
          style={{ color: "var(--orange-ink)" }}
        >
          ← Editar carrito
        </button>
      )}
    </div>
  );

  const inputCls = (err?: string) =>
    `w-full focus:outline-none` + (err ? " border-[var(--berry)] bg-[rgba(158,59,70,.04)]" : "");

  const inputStyle: React.CSSProperties = {
    border: "1.5px solid var(--hairline)",
    borderRadius: "var(--r-md)",
    padding: "13px 15px",
    fontFamily: "inherit",
    fontSize: 15,
    color: "var(--ink)",
    background: "var(--paper)",
    width: "100%",
  };

  const cardTitle = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-2.5 mb-5">
      <span
        className="w-9 h-9 rounded-[10px] grid place-items-center flex-none"
        style={{ background: "var(--cream)", color: "var(--orange-ink)" }}
      >
        {icon}
      </span>
      <h2 style={{ fontSize: 22, color: "var(--ink)" }}>{title}</h2>
    </div>
  );

  return (
    <div
      className="mx-auto px-[var(--gutter)]"
      style={{ maxWidth: "var(--maxw)", paddingBlock: "clamp(36px, 5vw, 64px) clamp(56px, 7vw, 96px)" }}
    >
      <StepIndicator />

      {/* Mobile collapsible summary */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setSummaryOpen((o) => !o)}
          className="w-full flex items-center justify-between rounded-[16px] px-4 py-3 border cursor-pointer"
          style={{
            background: "var(--cream)",
            border: "1.5px solid var(--amber)",
          }}
        >
          <span className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
            Ver resumen del pedido
          </span>
          <div className="flex items-center gap-2">
            <span className="font-bold" style={{ color: "var(--orange-ink)" }}>
              {sym}{totalFinal.toFixed(2)}
            </span>
            {summaryOpen ? (
              <ChevronUp className="w-4 h-4" style={{ color: "var(--orange-ink)" } as React.CSSProperties} />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: "var(--orange-ink)" } as React.CSSProperties} />
            )}
          </div>
        </button>
        {summaryOpen && <div className="mt-2"><OrderSummary /></div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* ── Left: step content ── */}
        <div className="lg:col-span-3 flex flex-col gap-5">

          {/* ── STEP 1: CARRITO ── */}
          {step === 1 && (
            <>
              <h1 className="font-bold" style={{ fontSize: "clamp(30px, 4vw, 44px)", color: "var(--ink)" }}>
                Tu carrito
              </h1>

              <div className="flex flex-col gap-3.5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-[16px] p-4"
                    style={{
                      background: "var(--paper-card)",
                      border: "1px solid var(--hairline)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div
                      className="w-[70px] h-[70px] rounded-[12px] flex items-center justify-center text-4xl flex-none"
                      style={{ background: "var(--cream)" }}
                    >
                      {item.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-bold text-[18px] leading-tight"
                        style={{
                          fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif",
                          color: "var(--ink)",
                        }}
                      >
                        {item.name}
                      </p>
                      <p className="font-bold text-[16px] mt-0.5" style={{ color: "var(--orange-ink)" }}>
                        {sym}{(item.price * item.quantity).toFixed(2)}
                        <small className="ml-1.5 font-medium text-[13px]" style={{ color: "var(--ink-soft)" }}>
                          ({sym}{item.price.toFixed(2)} c/u)
                        </small>
                      </p>
                    </div>
                    <div
                      className="inline-flex items-center overflow-hidden flex-none"
                      style={{ border: "1.5px solid var(--hairline)", borderRadius: "var(--r-pill)" }}
                    >
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-[38px] h-[38px] grid place-items-center border-0 cursor-pointer transition-colors"
                        style={{ background: "transparent", color: "var(--ink)" }}
                      >
                        <BLIcon name="minus" size={16} />
                      </button>
                      <span className="w-[26px] text-center font-bold text-[15px]" style={{ color: "var(--ink)" }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, +1)}
                        className="w-[38px] h-[38px] grid place-items-center border-0 cursor-pointer transition-colors"
                        style={{ background: "transparent", color: "var(--ink)" }}
                      >
                        <BLIcon name="plus" size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-[34px] h-[34px] rounded-full grid place-items-center border-0 cursor-pointer transition-colors"
                      style={{ background: "none", color: "var(--ink-soft)" }}
                      aria-label="Quitar"
                    >
                      <BLIcon name="close" size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Promo code */}
              <div>
                {promo ? (
                  <div
                    className="flex items-center gap-3 rounded-[16px] px-4 py-3"
                    style={{ background: "rgba(31,170,85,.08)", border: "1px solid rgba(31,170,85,.2)" }}
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#1a7a40" } as React.CSSProperties} />
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold" style={{ color: "#1a7a40" }}>
                        Código <span className="font-mono">{promo.codigo}</span> aplicado
                      </p>
                      <p className="text-[12px]" style={{ color: "#1a7a40" }}>
                        {promo.descuento_porcentaje}% de descuento
                      </p>
                    </div>
                    <button
                      onClick={() => setPromo(null)}
                      className="grid place-items-center border-0 bg-transparent cursor-pointer"
                      style={{ color: "#1a7a40" }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2.5">
                      <div className="flex-1 relative flex items-center">
                        <BLIcon
                          name="sparkle"
                          size={18}
                          className="absolute left-4 pointer-events-none"
                          style={{ color: "var(--ink-soft)" } as React.CSSProperties}
                        />
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }}
                          onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                          placeholder="Código de descuento"
                          className="w-full border focus:outline-none uppercase"
                          style={{
                            ...inputStyle,
                            paddingLeft: 44,
                            letterSpacing: ".04em",
                          }}
                          onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "var(--orange)")}
                          onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = "var(--hairline)")}
                        />
                      </div>
                      <button
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoInput.trim()}
                        className="inline-flex items-center gap-2 font-bold text-[15px] px-5 rounded-[16px] text-white border-0 cursor-pointer disabled:opacity-50 transition-colors"
                        style={{ background: "var(--paper-card)", color: "var(--ink)", boxShadow: "var(--shadow-sm)" }}
                      >
                        {promoLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Aplicar
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-[12px] mt-1.5" style={{ color: "var(--berry)" }}>
                        {promoError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="w-full inline-flex items-center justify-center gap-2 font-bold text-[15px] py-4 rounded-full text-white border-0 cursor-pointer transition-colors"
                  style={{ background: "var(--orange)", boxShadow: "0 6px 18px rgba(217,113,30,.32)" }}
                >
                  Continuar con mi pedido
                  <BLIcon name="arrow-right" size={16} />
                </button>
                <Link
                  href="/menu"
                  className="block text-center py-2 text-[15px] font-semibold no-underline"
                  style={{ color: "var(--orange-ink)" }}
                >
                  ← Seguir comprando
                </Link>
              </div>
            </>
          )}

          {/* ── STEP 2: DATOS Y PAGO ── */}
          {step === 2 && (
            <>
              <h1 className="font-bold" style={{ fontSize: "clamp(30px, 4vw, 44px)", color: "var(--ink)" }}>
                Datos y método de pago
              </h1>

              {/* Banner datos guardados */}
              {savedUser?.nombre && (
                <div
                  className="flex items-center justify-between gap-3 flex-wrap rounded-[16px] p-4"
                  style={{ background: "var(--cream)", border: "1.5px solid var(--amber)" }}
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold" style={{ color: "var(--ink)" }}>
                      👋 ¿Eres {savedUser.nombre}?
                    </p>
                    <p className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
                      Tenemos tus datos del pedido anterior guardados.
                    </p>
                  </div>
                  <button
                    onClick={fillFromSaved}
                    className="text-[13px] font-bold px-4 py-2 rounded-full text-white border-0 cursor-pointer whitespace-nowrap"
                    style={{ background: "var(--orange)" }}
                  >
                    Usar mis datos
                  </button>
                </div>
              )}

              {/* Contacto */}
              <div
                className="rounded-[24px] p-[clamp(22px,2.6vw,30px)]"
                style={{
                  background: "var(--paper-card)",
                  border: "1px solid var(--hairline)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {cardTitle(<User className="w-4 h-4" />, "Datos de contacto")}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nombre completo *" error={formErrors.nombre}>
                    <input
                      type="text"
                      value={datos.nombre}
                      onChange={(e) => setDatos((d) => ({ ...d, nombre: e.target.value }))}
                      placeholder="María García"
                      autoComplete="name"
                      className={inputCls(formErrors.nombre)}
                      style={inputStyle}
                      onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "var(--orange)")}
                      onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = formErrors.nombre ? "var(--berry)" : "var(--hairline)")}
                    />
                  </Field>
                  <Field label="Teléfono *" error={formErrors.telefono}>
                    <div className="relative">
                      <BLIcon
                        name="whatsapp"
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "var(--ink-soft)" } as React.CSSProperties}
                      />
                      <input
                        type="tel"
                        value={datos.telefono}
                        onChange={(e) => setDatos((d) => ({ ...d, telefono: e.target.value }))}
                        placeholder="9999-9999"
                        autoComplete="tel"
                        className={inputCls(formErrors.telefono)}
                        style={{ ...inputStyle, paddingLeft: 42 }}
                        onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "var(--orange)")}
                        onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = formErrors.telefono ? "var(--berry)" : "var(--hairline)")}
                      />
                    </div>
                  </Field>
                </div>
              </div>

              {/* Tipo de entrega */}
              <div
                className="rounded-[24px] p-[clamp(22px,2.6vw,30px)]"
                style={{
                  background: "var(--paper-card)",
                  border: "1px solid var(--hairline)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {cardTitle(<Package className="w-4 h-4" />, "Tipo de entrega")}
                <div className="grid grid-cols-2 gap-3.5 mb-4">
                  {(
                    [
                      { id: "pickup",    icon: <BLIcon name="pin" size={26} />,   label: "Recoger en tienda", desc: "Sin costo adicional" },
                      { id: "domicilio", icon: <BLIcon name="truck" size={26} />, label: "A domicilio",       desc: "Coordinar zona y costo" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setDatos((d) => ({ ...d, tipo_entrega: opt.id }))}
                      className="flex flex-col items-center gap-2 rounded-[16px] border cursor-pointer transition-all text-center"
                      style={{
                        padding: 20,
                        borderWidth: "1.5px",
                        background: datos.tipo_entrega === opt.id ? "rgba(217,113,30,.07)" : "var(--paper-card)",
                        borderColor: datos.tipo_entrega === opt.id ? "var(--orange)" : "var(--hairline)",
                        boxShadow: datos.tipo_entrega === opt.id ? "0 0 0 3px rgba(217,113,30,.12)" : "none",
                        color: datos.tipo_entrega === opt.id ? "var(--orange)" : "var(--ink-soft)",
                      }}
                    >
                      {opt.icon}
                      <strong
                        style={{
                          fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif",
                          fontSize: 18,
                          display: "block",
                          color: "var(--ink)",
                        }}
                      >
                        {opt.label}
                      </strong>
                      <span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>

                {datos.tipo_entrega === "domicilio" && (
                  <div className="mb-4">
                    <Field label="Dirección de entrega *" error={formErrors.direccion}>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 pointer-events-none" style={{ color: "var(--ink-soft)" } as React.CSSProperties} />
                        <textarea
                          value={datos.direccion}
                          onChange={(e) => setDatos((d) => ({ ...d, direccion: e.target.value }))}
                          placeholder="Col. Palmira, Calle Principal #123, frente al parque..."
                          rows={2}
                          autoComplete="street-address"
                          className="resize-none"
                          style={{ ...inputStyle, paddingLeft: 42 }}
                        />
                      </div>
                    </Field>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Fecha preferida">
                    <input
                      type="date"
                      value={datos.fecha_entrega}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setDatos((d) => ({ ...d, fecha_entrega: e.target.value }))}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Hora preferida">
                    <div className="relative">
                      <BLIcon
                        name="clock"
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "var(--ink-soft)" } as React.CSSProperties}
                      />
                      <select
                        value={datos.hora_entrega}
                        onChange={(e) => setDatos((d) => ({ ...d, hora_entrega: e.target.value }))}
                        className="appearance-none"
                        style={{ ...inputStyle, paddingLeft: 42 }}
                      >
                        <option value="">Cualquier hora</option>
                        {HORAS.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </Field>
                </div>
              </div>

              {/* Método de pago */}
              <div
                className="rounded-[24px] p-[clamp(22px,2.6vw,30px)]"
                style={{
                  background: "var(--paper-card)",
                  border: "1px solid var(--hairline)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {cardTitle(<Wallet className="w-4 h-4" />, "Método de pago")}
                {formErrors.metodo_pago && (
                  <p className="text-[12px] mb-3" style={{ color: "var(--berry)" }}>
                    {formErrors.metodo_pago}
                  </p>
                )}
                <div className="flex flex-col gap-3">
                  {METODOS_PAGO.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setDatos((d) => ({ ...d, metodo_pago: m.id }))}
                      className="flex items-center gap-3.5 rounded-[16px] border cursor-pointer transition-all text-left"
                      style={{
                        padding: "16px 18px",
                        borderWidth: "1.5px",
                        background: datos.metodo_pago === m.id ? "rgba(217,113,30,.07)" : "var(--paper-card)",
                        borderColor: datos.metodo_pago === m.id ? "var(--orange)" : "var(--hairline)",
                      }}
                    >
                      <span
                        className="w-10 h-10 rounded-[10px] grid place-items-center flex-none"
                        style={{ background: "var(--cream)", color: "var(--orange-ink)" }}
                      >
                        <span className="text-xl">{m.icon}</span>
                      </span>
                      <div className="flex-1">
                        <strong
                          className="block text-[17px]"
                          style={{
                            fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif",
                            color: "var(--ink)",
                          }}
                        >
                          {m.label}
                        </strong>
                        <span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>{m.desc}</span>
                      </div>
                      <div
                        className="w-5 h-5 rounded-full grid place-items-center flex-none"
                        style={{
                          border: `2px solid ${datos.metodo_pago === m.id ? "var(--orange)" : "var(--hairline)"}`,
                        }}
                      >
                        {datos.metodo_pago === m.id && (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--orange)" }} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {datos.metodo_pago === "transferencia" && (
                  <div
                    className="mt-3 rounded-[16px] p-4"
                    style={{
                      background: "rgba(42,111,219,.07)",
                      border: "1px solid rgba(42,111,219,.2)",
                    }}
                  >
                    <p
                      className="text-[12px] font-bold uppercase tracking-[0.12em] mb-3"
                      style={{ color: "#2a6fdb" }}
                    >
                      Datos para transferencia
                    </p>
                    <div className="text-[14px] flex flex-col gap-1.5">
                      <p>
                        <span style={{ color: "var(--ink-soft)" }}>Banco:</span>
                        <strong className="ml-1.5" style={{ color: "var(--ink)" }}>{banco.banco}</strong>
                      </p>
                      <p>
                        <span style={{ color: "var(--ink-soft)" }}>Titular:</span>
                        <strong className="ml-1.5" style={{ color: "var(--ink)" }}>{banco.titular}</strong>
                      </p>
                      <p>
                        <span style={{ color: "var(--ink-soft)" }}>No. de cuenta:</span>
                        <strong className="ml-1.5 font-mono" style={{ color: "var(--ink)" }}>{banco.numero}</strong>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notas */}
              <div
                className="rounded-[24px] p-[clamp(22px,2.6vw,30px)]"
                style={{
                  background: "var(--paper-card)",
                  border: "1px solid var(--hairline)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {cardTitle(<FileText className="w-4 h-4" />, "Notas adicionales")}
                <textarea
                  value={datos.notas}
                  onChange={(e) => setDatos((d) => ({ ...d, notas: e.target.value }))}
                  placeholder="Alergias, preferencias especiales, instrucciones de entrega…"
                  rows={3}
                  className="resize-none"
                  style={{ ...inputStyle, minHeight: 96 }}
                />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => validateDatos() && setStep(3)}
                  className="w-full inline-flex items-center justify-center gap-2 font-bold text-[15px] py-4 rounded-full text-white border-0 cursor-pointer"
                  style={{ background: "var(--orange)", boxShadow: "0 6px 18px rgba(217,113,30,.32)" }}
                >
                  Revisar pedido
                  <BLIcon name="arrow-right" size={16} />
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="block text-center py-2 text-[15px] font-semibold border-0 bg-transparent cursor-pointer"
                  style={{ color: "var(--orange-ink)" }}
                >
                  ← Volver al carrito
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: CONFIRMACIÓN ── */}
          {step === 3 && (
            <>
              <h1 className="font-bold" style={{ fontSize: "clamp(30px, 4vw, 44px)", color: "var(--ink)" }}>
                Confirmar pedido
              </h1>

              {/* Datos cliente */}
              <ReviewCard title="Datos de contacto" onEdit={() => setStep(2)}>
                <p className="font-semibold text-[15px]" style={{ color: "var(--ink)" }}>{datos.nombre}</p>
                <p className="text-[14px] mt-0.5" style={{ color: "var(--ink-soft)" }}>{datos.telefono}</p>
              </ReviewCard>

              {/* Entrega */}
              <ReviewCard title="Entrega" onEdit={() => setStep(2)}>
                <p
                  className="flex items-center gap-2 font-semibold text-[15px]"
                  style={{ color: "var(--ink)" }}
                >
                  <BLIcon
                    name={datos.tipo_entrega === "pickup" ? "pin" : "truck"}
                    size={18}
                    style={{ color: "var(--orange-ink)" } as React.CSSProperties}
                  />
                  {datos.tipo_entrega === "pickup" ? "Recoger en tienda" : "A domicilio"}
                </p>
                {datos.tipo_entrega === "domicilio" && datos.direccion && (
                  <p className="text-[14px] mt-1" style={{ color: "var(--ink-soft)" }}>{datos.direccion}</p>
                )}
                {datos.fecha_entrega && (
                  <p className="text-[14px] mt-1" style={{ color: "var(--ink-soft)" }}>
                    {new Date(datos.fecha_entrega + "T12:00:00").toLocaleDateString("es-HN", {
                      weekday: "long", year: "numeric", month: "long", day: "numeric",
                    })}
                    {datos.hora_entrega && ` — ${datos.hora_entrega}`}
                  </p>
                )}
              </ReviewCard>

              {/* Pago */}
              <ReviewCard title="Método de pago" onEdit={() => setStep(2)}>
                {(() => {
                  const m = METODOS_PAGO.find((m) => m.id === datos.metodo_pago);
                  return m ? (
                    <p className="font-semibold text-[15px]" style={{ color: "var(--ink)" }}>
                      <span className="mr-2">{m.icon}</span>
                      {m.label}
                      <span className="ml-2 font-normal text-[13px]" style={{ color: "var(--ink-soft)" }}>
                        — {m.desc}
                      </span>
                    </p>
                  ) : null;
                })()}
              </ReviewCard>

              {/* Notas */}
              {datos.notas && (
                <ReviewCard title="Notas" onEdit={() => setStep(2)}>
                  <p className="text-[14px]" style={{ color: "var(--ink-soft)" }}>{datos.notas}</p>
                </ReviewCard>
              )}

              {/* Comprobante — solo transferencia */}
              {datos.metodo_pago === "transferencia" && (
                <div
                  className="rounded-[24px] p-[clamp(22px,2.6vw,30px)]"
                  style={{
                    background: "var(--paper-card)",
                    border: "1px solid var(--hairline)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <h3 className="font-semibold text-[17px] mb-1" style={{ color: "var(--ink)" }}>
                    Comprobante de transferencia
                  </h3>
                  <p className="text-[14px] mb-4" style={{ color: "var(--ink-soft)", lineHeight: 1.5 }}>
                    Si ya realizaste el pago, adjunta el screenshot para agilizar la confirmación.
                    Si no, igual puedes continuar y enviarlo en el chat de WhatsApp.
                  </p>

                  <div
                    className="rounded-[16px] p-4 mb-4"
                    style={{ background: "rgba(42,111,219,.07)", border: "1px solid rgba(42,111,219,.2)" }}
                  >
                    <p className="text-[12px] font-bold uppercase tracking-[0.12em] mb-2.5" style={{ color: "#2a6fdb" }}>
                      Transferir a
                    </p>
                    <div className="text-[14px] flex flex-col gap-1.5">
                      <p><span style={{ color: "var(--ink-soft)" }}>Banco:</span> <strong className="ml-1.5">{banco.banco}</strong></p>
                      <p><span style={{ color: "var(--ink-soft)" }}>Titular:</span> <strong className="ml-1.5">{banco.titular}</strong></p>
                      <p><span style={{ color: "var(--ink-soft)" }}>Cuenta:</span> <strong className="ml-1.5 font-mono">{banco.numero}</strong></p>
                      <p><span style={{ color: "var(--ink-soft)" }}>Monto:</span> <strong className="ml-1.5">{sym}{totalFinal.toFixed(2)}</strong></p>
                    </div>
                  </div>

                  <label
                    className="flex flex-col items-center gap-2 p-6 rounded-[16px] border-2 border-dashed cursor-pointer transition-colors"
                    style={{
                      borderColor: ssFile ? "var(--wa)" : "var(--hairline)",
                      background: ssFile ? "rgba(31,170,85,.06)" : "transparent",
                    }}
                  >
                    <BLIcon
                      name="share"
                      size={30}
                      style={{ color: ssFile ? "var(--wa)" : "var(--ink-soft)" } as React.CSSProperties}
                    />
                    <strong className="text-[15px]" style={{ color: ssFile ? "#1a7a40" : "var(--ink)" }}>
                      {ssFile ? ssFile.name : "Adjuntar comprobante (opcional)"}
                    </strong>
                    <span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
                      PNG o JPG · toca para subir
                    </span>
                    {ssFile && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setSsFile(null); }}
                        className="text-[12px] underline border-0 bg-transparent cursor-pointer"
                        style={{ color: "var(--berry)" }}
                      >
                        Quitar
                      </button>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => setSsFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <p className="text-[13px] text-center mt-3.5" style={{ color: "var(--ink-soft)" }}>
                    {ssFile
                      ? "El comprobante se adjuntará al mensaje de WhatsApp."
                      : "Sin comprobante, te enviaremos los datos de pago por WhatsApp para que los confirmes ahí."}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 font-bold text-[15px] py-4 rounded-full text-white border-0 cursor-pointer disabled:opacity-60 transition-colors"
                  style={{ background: "var(--choco-900)" }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <BLIcon name="whatsapp" size={20} style={{ color: "#58d684" } as React.CSSProperties} />
                      Confirmar y enviar por WhatsApp
                    </>
                  )}
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="block text-center py-2 text-[15px] font-semibold border-0 bg-transparent cursor-pointer"
                  style={{ color: "var(--orange-ink)" }}
                >
                  ← Editar datos
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Right: sticky order summary (desktop only) ── */}
        <div className="hidden lg:block lg:col-span-2">
          <div className="sticky top-24">
            <OrderSummary />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[16px] p-[22px_24px]"
      style={{
        background: "var(--paper-card)",
        border: "1px solid var(--hairline)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[17px]" style={{ color: "var(--ink)", fontFamily: "inherit" }}>
          {title}
        </h3>
        <button
          onClick={onEdit}
          className="text-[14px] font-semibold border-0 bg-transparent cursor-pointer"
          style={{ color: "var(--orange-ink)" }}
        >
          Editar
        </button>
      </div>
      {children}
    </div>
  );
}
