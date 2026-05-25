"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, Tag, X, CheckCircle, ChevronDown, ChevronUp,
  Package, MapPin, Clock, Wallet, Phone, User, FileText,
  Home, Store,
} from "lucide-react";
import { useCartStore } from "@/lib/cartStore";
import { storeConfig } from "@/config/store";
import { validarPromocion, crearPedidoPublico } from "@/actions/publico";

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
type MetodoPago = "efectivo" | "transferencia" | "tigo_money" | "";

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
  { id: "tigo_money",   label: "Tigo Money",            icon: "📱", desc: "Pago móvil Tigo" },
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
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof DatosForm, string>>>({});
  const [datos, setDatos] = useState<DatosForm>({
    nombre: "", telefono: "", tipo_entrega: "pickup",
    direccion: "", fecha_entrega: "", hora_entrega: "", notas: "", metodo_pago: "",
  });

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const subtotal = total();
  const descuento = promo ? Math.round(subtotal * (promo.descuento_porcentaje / 100) * 100) / 100 : 0;
  const totalFinal = subtotal - descuento;
  const sym = storeConfig.currencySymbol;

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

      const result = await crearPedidoPublico(clienteDatos, pedidoItems, totalFinal, promo);
      const id = result.success ? result.data?.id : undefined;
      if (id) setOrderId(id);

      const lines: string[] = [`¡Hola ${storeConfig.name}! 🍪`, ""];
      if (id) lines.push(`📋 Pedido #${id.slice(0, 8).toUpperCase()}`, "");
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
      const metodoPagoLabel = METODOS_PAGO.find(m => m.id === datos.metodo_pago)?.label ?? datos.metodo_pago;
      lines.push("", `💳 MÉTODO DE PAGO: ${metodoPagoLabel}`);
      if (datos.notas) lines.push("", `📝 NOTAS: ${datos.notas}`);
      lines.push("", "¡Gracias! Esperamos confirmar pronto. 🙏");

      window.open(`https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
      clearCart();
      setStep("success");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-amber-800 mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
          ¡Pedido enviado!
        </h1>
        {orderId && <p className="text-stone-400 text-sm font-mono mb-2">#{orderId.slice(0, 8).toUpperCase()}</p>}
        <p className="text-stone-500 mb-8">Tu pedido fue enviado por WhatsApp. Te confirmaremos en breve.</p>
        <div className="flex flex-col items-center gap-3">
          <Link href="/menu" className="bg-amber-800 text-white font-semibold px-8 py-3 rounded-full hover:bg-amber-700 transition-colors">
            Seguir comprando
          </Link>
          {orderId && (
            <Link href="/seguimiento" className="text-amber-700 hover:underline text-sm">
              Rastrear mi pedido →
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-7xl mb-6">🛒</div>
        <h1 className="text-3xl font-bold text-amber-800 mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
          Tu carrito está vacío
        </h1>
        <p className="text-stone-500 mb-8">Agrega algunas galletas para continuar.</p>
        <Link href="/menu" className="inline-block bg-amber-800 text-white font-semibold px-8 py-3 rounded-full hover:bg-amber-700 transition-colors">
          Ver Menú
        </Link>
      </div>
    );
  }

  // ── Step indicator ───────────────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center mb-10">
      {STEPS.map((s, idx) => {
        const current = typeof step === "number" && step === s.n;
        const done = typeof step === "number" && step > s.n;
        return (
          <div key={s.n} className="flex items-center">
            <button
              onClick={() => done && setStep(s.n as 1 | 2 | 3)}
              disabled={!done}
              className={`flex items-center gap-2 text-sm font-semibold transition-colors ${current ? "text-amber-800" : done ? "text-amber-600 hover:underline cursor-pointer" : "text-stone-300 cursor-default"}`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${current ? "bg-amber-800 text-white" : done ? "bg-amber-200 text-amber-800" : "bg-stone-100 text-stone-400"}`}>
                {done ? "✓" : s.n}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {idx < STEPS.length - 1 && (
              <div className={`w-8 sm:w-14 h-px mx-2 ${done ? "bg-amber-300" : "bg-stone-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Order summary sidebar ────────────────────────────────────────────────────
  const OrderSummary = () => (
    <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
      <h3 className="font-bold text-stone-800 mb-4 text-xs uppercase tracking-widest">Resumen del pedido</h3>
      <div className="flex flex-col gap-2.5 mb-4">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <span className="text-base leading-none">{item.emoji}</span>
            <span className="flex-1 text-stone-600 truncate">{item.quantity}× {item.name}</span>
            <span className="font-medium text-stone-800 shrink-0">{sym}{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      {promo && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-3">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Código <span className="font-mono font-bold">{promo.codigo}</span> ({promo.descuento_porcentaje}% dto.)</span>
        </div>
      )}
      <div className="border-t border-amber-200 pt-3 space-y-1.5">
        <div className="flex justify-between text-sm text-stone-500">
          <span>Subtotal ({itemCount()} art.)</span>
          <span>{sym}{subtotal.toFixed(2)}</span>
        </div>
        {promo && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Descuento</span>
            <span>−{sym}{descuento.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-stone-800 text-base pt-1.5 border-t border-amber-200 mt-1">
          <span>Total</span>
          <span className="text-amber-800">{sym}{totalFinal.toFixed(2)} <span className="text-xs font-normal text-stone-400">{storeConfig.currency}</span></span>
        </div>
      </div>
      {step !== 1 && (
        <button onClick={() => setStep(1)} className="mt-4 w-full text-center text-xs text-amber-700 hover:underline">
          ← Editar carrito
        </button>
      )}
    </div>
  );

  const inputCls = (err?: string) =>
    `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${err ? "border-red-300 bg-red-50" : "border-stone-200"}`;

  const cardTitle = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-amber-700">{icon}</span>
      <h3 className="font-semibold text-stone-800">{title}</h3>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <StepIndicator />

      {/* Mobile collapsible summary */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setSummaryOpen(o => !o)}
          className="w-full flex items-center justify-between bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3"
        >
          <span className="text-sm font-semibold text-amber-800">Ver resumen del pedido</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-800">{sym}{totalFinal.toFixed(2)}</span>
            {summaryOpen ? <ChevronUp className="w-4 h-4 text-amber-700" /> : <ChevronDown className="w-4 h-4 text-amber-700" />}
          </div>
        </button>
        {summaryOpen && <div className="mt-2"><OrderSummary /></div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* ── Left: step content ── */}
        <div className="lg:col-span-3 flex flex-col gap-5">

          {/* ── STEP 1: CARRITO ── */}
          {step === 1 && <>
            <h1 className="text-3xl font-bold text-amber-800" style={{ fontFamily: "var(--font-playfair)" }}>Tu Carrito</h1>

            <div className="flex flex-col gap-3">
              {items.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex items-center gap-4">
                  <span className="text-4xl leading-none">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800 truncate">{item.name}</p>
                    <p className="text-amber-800 font-bold">
                      {sym}{(item.price * item.quantity).toFixed(2)}
                      <span className="text-stone-400 font-normal text-sm ml-1">({sym}{item.price.toFixed(2)} c/u)</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold flex items-center justify-center transition-colors">−</button>
                    <span className="w-6 text-center font-semibold text-stone-700">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, +1)} className="w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold flex items-center justify-center transition-colors">+</button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-stone-300 hover:text-red-400 transition-colors ml-1" aria-label="Eliminar">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Promo code */}
            <div>
              {promo ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-700">Código <span className="font-mono">{promo.codigo}</span> aplicado</p>
                    <p className="text-xs text-green-600">{promo.descuento_porcentaje}% de descuento</p>
                  </div>
                  <button onClick={() => setPromo(null)} className="text-green-400 hover:text-green-600"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text" value={promoInput}
                        onChange={e => { setPromoInput(e.target.value); setPromoError(""); }}
                        onKeyDown={e => e.key === "Enter" && handleApplyPromo()}
                        placeholder="Código de descuento"
                        className="w-full pl-10 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase"
                      />
                    </div>
                    <button onClick={handleApplyPromo} disabled={promoLoading || !promoInput.trim()}
                      className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2">
                      {promoLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Aplicar
                    </button>
                  </div>
                  {promoError && <p className="text-red-500 text-xs mt-1.5">{promoError}</p>}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={() => setStep(2)}
                className="w-full bg-amber-800 hover:bg-amber-700 text-white font-semibold py-4 rounded-full text-lg transition-colors">
                Continuar con mi pedido →
              </button>
              <Link href="/menu" className="text-center text-amber-700 hover:underline text-sm py-2">← Seguir comprando</Link>
            </div>
          </>}

          {/* ── STEP 2: DATOS Y PAGO ── */}
          {step === 2 && <>
            <h2 className="text-2xl font-bold text-amber-800" style={{ fontFamily: "var(--font-playfair)" }}>Datos y método de pago</h2>

            {/* Contacto */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              {cardTitle(<User className="w-4 h-4" />, "Datos de contacto")}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nombre completo *" error={formErrors.nombre}>
                  <input type="text" value={datos.nombre}
                    onChange={e => setDatos(d => ({ ...d, nombre: e.target.value }))}
                    placeholder="María García"
                    className={inputCls(formErrors.nombre)}
                  />
                </Field>
                <Field label="Teléfono *" error={formErrors.telefono}>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input type="tel" value={datos.telefono}
                      onChange={e => setDatos(d => ({ ...d, telefono: e.target.value }))}
                      placeholder="9999-9999"
                      className={`${inputCls(formErrors.telefono)} pl-10`}
                    />
                  </div>
                </Field>
              </div>
            </div>

            {/* Tipo de entrega */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              {cardTitle(<Package className="w-4 h-4" />, "Tipo de entrega")}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {([
                  { id: "pickup",   icon: <Store className="w-5 h-5" />, label: "Recoger en tienda", desc: "Sin costo adicional" },
                  { id: "domicilio", icon: <Home className="w-5 h-5" />, label: "A domicilio",       desc: "Coordinar zona y costo" },
                ] as const).map(opt => (
                  <button key={opt.id} onClick={() => setDatos(d => ({ ...d, tipo_entrega: opt.id }))}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      datos.tipo_entrega === opt.id ? "border-amber-700 bg-amber-50 text-amber-800" : "border-stone-200 text-stone-600 hover:border-stone-300"
                    }`}>
                    {opt.icon}
                    <span>{opt.label}</span>
                    <span className="text-xs font-normal text-stone-400">{opt.desc}</span>
                  </button>
                ))}
              </div>

              {datos.tipo_entrega === "domicilio" && (
                <div className="mb-4">
                  <Field label="Dirección de entrega *" error={formErrors.direccion}>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                      <textarea value={datos.direccion}
                        onChange={e => setDatos(d => ({ ...d, direccion: e.target.value }))}
                        placeholder="Col. Palmira, Calle Principal #123, frente al parque..."
                        rows={2}
                        className={`${inputCls(formErrors.direccion)} pl-10 resize-none`}
                      />
                    </div>
                  </Field>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha preferida">
                  <input type="date" value={datos.fecha_entrega}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setDatos(d => ({ ...d, fecha_entrega: e.target.value }))}
                    className={inputCls()}
                  />
                </Field>
                <Field label="Hora preferida">
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                    <select value={datos.hora_entrega}
                      onChange={e => setDatos(d => ({ ...d, hora_entrega: e.target.value }))}
                      className={`${inputCls()} pl-10 appearance-none bg-white`}>
                      <option value="">Cualquier hora</option>
                      {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </Field>
              </div>
            </div>

            {/* Método de pago */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              {cardTitle(<Wallet className="w-4 h-4" />, "Método de pago")}
              {formErrors.metodo_pago && <p className="text-red-500 text-xs mb-3">{formErrors.metodo_pago}</p>}
              <div className="flex flex-col gap-2">
                {METODOS_PAGO.map(m => (
                  <button key={m.id} onClick={() => setDatos(d => ({ ...d, metodo_pago: m.id }))}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      datos.metodo_pago === m.id ? "border-amber-700 bg-amber-50" : "border-stone-200 hover:border-stone-300"
                    }`}>
                    <span className="text-2xl leading-none">{m.icon}</span>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${datos.metodo_pago === m.id ? "text-amber-800" : "text-stone-800"}`}>{m.label}</p>
                      <p className="text-xs text-stone-400">{m.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${datos.metodo_pago === m.id ? "border-amber-700" : "border-stone-300"}`}>
                      {datos.metodo_pago === m.id && <div className="w-2.5 h-2.5 rounded-full bg-amber-700" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              {cardTitle(<FileText className="w-4 h-4" />, "Notas adicionales")}
              <textarea value={datos.notas}
                onChange={e => setDatos(d => ({ ...d, notas: e.target.value }))}
                placeholder="Alergias, preferencias especiales, instrucciones de entrega..."
                rows={3}
                className={`${inputCls()} resize-none`}
              />
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={() => validateDatos() && setStep(3)}
                className="w-full bg-amber-800 hover:bg-amber-700 text-white font-semibold py-4 rounded-full text-lg transition-colors">
                Revisar pedido →
              </button>
              <button onClick={() => setStep(1)} className="text-center text-amber-700 hover:underline text-sm py-2">← Volver al carrito</button>
            </div>
          </>}

          {/* ── STEP 3: CONFIRMACIÓN ── */}
          {step === 3 && <>
            <h2 className="text-2xl font-bold text-amber-800" style={{ fontFamily: "var(--font-playfair)" }}>Confirmar pedido</h2>

            {/* Datos cliente */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-stone-800 text-sm">Datos de contacto</h3>
                <button onClick={() => setStep(2)} className="text-xs text-amber-700 hover:underline">Editar</button>
              </div>
              <p className="font-medium text-stone-800">{datos.nombre}</p>
              <p className="text-sm text-stone-500">{datos.telefono}</p>
            </div>

            {/* Entrega */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-stone-800 text-sm">Entrega</h3>
                <button onClick={() => setStep(2)} className="text-xs text-amber-700 hover:underline">Editar</button>
              </div>
              <p className="font-medium text-stone-800">
                {datos.tipo_entrega === "pickup" ? "🏪 Recoger en tienda" : "🏠 A domicilio"}
              </p>
              {datos.tipo_entrega === "domicilio" && datos.direccion && (
                <p className="text-sm text-stone-500 mt-1">{datos.direccion}</p>
              )}
              {datos.fecha_entrega && (
                <p className="text-sm text-stone-500 mt-1">
                  {new Date(datos.fecha_entrega + "T12:00:00").toLocaleDateString("es-HN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  {datos.hora_entrega && ` — ${datos.hora_entrega}`}
                </p>
              )}
            </div>

            {/* Pago */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-stone-800 text-sm">Método de pago</h3>
                <button onClick={() => setStep(2)} className="text-xs text-amber-700 hover:underline">Editar</button>
              </div>
              {(() => {
                const m = METODOS_PAGO.find(m => m.id === datos.metodo_pago);
                return m ? (
                  <p className="font-medium text-stone-800">
                    <span className="mr-2">{m.icon}</span>{m.label}
                    <span className="text-stone-400 font-normal text-sm ml-2">— {m.desc}</span>
                  </p>
                ) : null;
              })()}
            </div>

            {/* Notas */}
            {datos.notas && (
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-stone-800 text-sm">Notas</h3>
                  <button onClick={() => setStep(2)} className="text-xs text-amber-700 hover:underline">Editar</button>
                </div>
                <p className="text-sm text-stone-600">{datos.notas}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button onClick={handleConfirm} disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-semibold py-4 rounded-full text-lg transition-colors flex items-center justify-center gap-2">
                {submitting
                  ? <><Loader2 className="w-5 h-5 animate-spin" />Procesando...</>
                  : <>💬 Confirmar y enviar por WhatsApp</>
                }
              </button>
              <button onClick={() => setStep(2)} className="text-center text-amber-700 hover:underline text-sm py-2">← Editar datos</button>
            </div>
          </>}
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
