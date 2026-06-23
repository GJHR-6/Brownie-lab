"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Loader2, CheckCircle, ArrowLeft, MapPin, Clock, Wallet, LocateFixed, Tag,
} from "lucide-react";
import BLIcon from "@/components/BLIcon";
import { useCartStore } from "@/lib/cartStore";
import { storeConfig } from "@/config/store";
import {
  validarPromocion, crearPedidoPublico, getConfiguracionBanco, getConfiguracionEnvio,
  getConfiguracionPedidos, getEnvioModo, subirComprobante, notificarPedidoCreado,
} from "@/actions/publico";
import { getDeliveryZonesPublicas } from "@/actions/deliveryZones";
import { enviarConfirmacionWhatsApp } from "@/actions/whatsapp";
import { calcularEnvio, type ConfigEnvio } from "@/lib/envio";
import { fechaMinimaEntrega, CONFIG_PEDIDOS_DEFAULT, type ConfigPedidos } from "@/lib/horarios";
import type { FlowSelection } from "../PedidoFlow";
import type { DeliveryZone } from "@/types/database";

const METODOS_PAGO = [
  { id: "efectivo",      label: "Efectivo",               icon: "💵", desc: "Paga al recibir tu pedido" },
  { id: "transferencia", label: "Transferencia bancaria", icon: "🏦", desc: "Te enviamos los datos al confirmar" },
] as const;

type MetodoPago = "efectivo" | "transferencia" | "";

export default function StageReview({
  selection, onBack, onDone,
}: {
  selection: FlowSelection;
  onBack: () => void;
  onDone: () => void;
}) {
  const { items, clearCart, total, itemCount } = useCartStore();
  const sym = storeConfig.currencySymbol;

  const [nombre, setNombre] = useState("");
  const [telefonoManual, setTelefonoManual] = useState("");
  const [direccion, setDireccion] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState(selection.fechaEntrega ?? "");
  const [horaEntrega, setHoraEntrega] = useState(selection.horaEntrega ?? "");
  const [notas, setNotas] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("");
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ codigo: string; descuento_porcentaje: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const [envioCfg, setEnvioCfg] = useState<ConfigEnvio | null>(null);
  const [envioModo, setEnvioModo] = useState<"distancia" | "zonas">("distancia");
  const [zonas, setZonas] = useState<DeliveryZone[] | null>(null);
  const [envioCoords, setEnvioCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [envioLoading, setEnvioLoading] = useState(false);
  const [envioError, setEnvioError] = useState("");

  const [cfgPedidos, setCfgPedidos] = useState<ConfigPedidos>(CONFIG_PEDIDOS_DEFAULT);
  const [banco, setBanco] = useState({ banco: "", titular: "", numero: "" });

  const [ssFile, setSsFile] = useState<File | null>(null);
  const [ssError, setSsError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const idempotencyKey = useRef(crypto.randomUUID());
  const [formErrors, setFormErrors] = useState<{ nombre?: string; direccion?: string; metodo_pago?: string }>({});

  useEffect(() => {
    getConfiguracionBanco().then(setBanco);
    getConfiguracionEnvio().then(setEnvioCfg).catch(() => {});
    getConfiguracionPedidos().then(setCfgPedidos).catch(() => {});
    getEnvioModo().then(setEnvioModo);
    if (selection.telefono) {
      const telefono = selection.telefono;
      Promise.resolve().then(() => {
        try {
          const raw = localStorage.getItem(`brownielab_user_${telefono}`);
          if (raw) {
            const saved = JSON.parse(raw);
            if (saved.nombre) setNombre(saved.nombre);
            if (saved.direccion) setDireccion(saved.direccion);
          }
        } catch { /* ignore */ }
      });
    }
  }, [selection.telefono]);

  useEffect(() => {
    if (selection.tipoEntrega === "domicilio" && envioModo === "zonas" && selection.zonaId && zonas === null) {
      getDeliveryZonesPublicas().then(setZonas).catch(() => setZonas([]));
    }
  }, [selection.tipoEntrega, envioModo, selection.zonaId, zonas]);

  if (items.length === 0 && !orderId) {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center">
        <p className="mb-6" style={{ color: "var(--ink-soft)" }}>Tu bolsa está vacía.</p>
        <button onClick={onBack} className="inline-flex items-center gap-2 font-bold cursor-pointer border-0 text-white"
          style={{ background: "var(--orange)", borderRadius: "var(--r-pill)", padding: "13px 22px", fontSize: 15.5 }}>
          Ver el menú
        </button>
      </div>
    );
  }

  const subtotal = total();
  const descuento = promo ? Math.round(subtotal * (promo.descuento_porcentaje / 100) * 100) / 100 : 0;
  const subtotalConDescuento = Math.max(0, subtotal - descuento);

  const zonaSeleccionada = zonas?.find(z => z.id === selection.zonaId) ?? null;
  const envioPorZona = selection.tipoEntrega === "domicilio" && envioModo === "zonas";
  const envioPorDistancia = selection.tipoEntrega === "domicilio" && envioModo === "distancia" && !!envioCfg && envioCfg.sedes.length > 0;
  const envioCalc = envioPorDistancia && envioCoords
    ? calcularEnvio(envioCfg!, envioCoords.lat, envioCoords.lng, subtotalConDescuento)
    : null;

  const costoEnvio = envioPorZona
    ? (zonaSeleccionada ? Number(zonaSeleccionada.tarifa) : 0)
    : (envioCalc && !envioCalc.fueraDeRango ? envioCalc.costo : 0);

  const totalFinal = Math.max(0, subtotalConDescuento + costoEnvio);

  function handleUsarUbicacion() {
    if (!("geolocation" in navigator)) {
      setEnvioError("Tu navegador no soporta ubicación. Actívala para calcular tu envío.");
      return;
    }
    setEnvioLoading(true);
    setEnvioError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEnvioCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setEnvioLoading(false);
      },
      () => {
        setEnvioLoading(false);
        setEnvioError("No pudimos obtener tu ubicación. Activa el permiso de ubicación e intenta de nuevo.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
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

  function validate(): boolean {
    const e: typeof formErrors = {};
    if (!nombre.trim() || nombre.trim().length < 2) e.nombre = "Nombre requerido (mín. 2 caracteres)";
    if (selection.tipoEntrega === "domicilio" && !direccion.trim()) e.direccion = "Dirección requerida para entrega a domicilio";
    if (!metodoPago) e.metodo_pago = "Selecciona un método de pago";

    if (fechaEntrega) {
      const minFecha = fechaMinimaEntrega(cfgPedidos.hora_corte);
      if (fechaEntrega < minFecha) { setOrderError(`Por la hora, la entrega más próxima es el ${minFecha}.`); setFormErrors(e); return false; }
    }
    if (envioPorDistancia && !envioCalc) { setEnvioError("Calcula tu envío con tu ubicación."); setFormErrors(e); return false; }
    if (envioCalc?.fueraDeRango) { setEnvioError(`Tu ubicación está fuera de nuestra zona de entrega (máx. ${envioCfg?.km_max} km).`); setFormErrors(e); return false; }
    if (metodoPago === "transferencia" && !ssFile) { setSsError("Debes adjuntar el comprobante de pago para continuar."); setFormErrors(e); return false; }

    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleConfirm() {
    if (submittingRef.current || !validate()) return;
    submittingRef.current = true;
    setSubmitting(true);
    setOrderError(null);

    try {
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const pedidoItems = items.map(i => ({
        producto_id: UUID_RE.test(i.id) ? i.id : null, nombre: i.name, precio: i.price,
        cantidad: i.quantity, subtotal: i.price * i.quantity,
      }));
      const clienteDatos = {
        nombre: nombre.trim(), telefono: (selection.telefono ?? telefonoManual).trim(),
        notas: notas.trim() || undefined, metodo_pago: metodoPago,
        tipo_entrega: selection.tipoEntrega ?? "pickup",
        direccion: selection.tipoEntrega === "domicilio" ? direccion.trim() || undefined : undefined,
        fecha_entrega: fechaEntrega || undefined, hora_entrega: horaEntrega || undefined,
        sede_pickup: selection.tipoEntrega === "pickup" ? (selection.sedePickup || undefined) : undefined,
        zona_id: envioPorZona ? (selection.zonaId || undefined) : undefined,
        gift_card_codigo: selection.giftCardCodigo || undefined,
      };

      const envioInput = selection.tipoEntrega === "domicilio"
        ? (envioPorZona ? (selection.zonaId ? { zonaId: selection.zonaId } : null) : envioCoords)
        : null;

      const result = await crearPedidoPublico(clienteDatos, pedidoItems, totalFinal, promo, idempotencyKey.current, envioInput);

      if (!result.success) {
        setOrderError(result.error ?? "Error al crear el pedido.");
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }

      const id = result.data?.id;
      if (id) {
        setOrderId(id);

        enviarConfirmacionWhatsApp({
          telefono: clienteDatos.telefono,
          nombre: clienteDatos.nombre,
          orderId: id,
          seguimientoUrl: `${window.location.origin}/seguimiento`,
        }).catch(() => {});

        if (ssFile) {
          const fd = new FormData();
          fd.append("comprobante", ssFile);
          const uploadResult = await subirComprobante(id, fd);
          if (!uploadResult.success) {
            setOrderError(`Pedido creado, pero no se pudo subir el comprobante: ${uploadResult.error ?? "Error desconocido"}. Envíalo por WhatsApp.`);
          }
        }

        notificarPedidoCreado(id).catch(() => {});
      }

      try {
        localStorage.setItem("brownielab_last_phone", clienteDatos.telefono);
        localStorage.setItem(`brownielab_user_${clienteDatos.telefono}`, JSON.stringify({
          nombre: clienteDatos.nombre, telefono: clienteDatos.telefono,
          tipo_entrega: clienteDatos.tipo_entrega, direccion: clienteDatos.direccion ?? "",
        }));
      } catch { /* ignore quota errors */ }

      clearCart();
    } catch {
      submittingRef.current = false;
      setSubmitting(false);
      setOrderError("Error inesperado. Intenta de nuevo.");
    }
  }

  if (orderId) {
    const trackUrl = selection.telefono ? `/seguimiento?telefono=${encodeURIComponent(selection.telefono)}` : "/seguimiento";
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center">
        <CheckCircle size={52} style={{ color: "var(--green, #157a4d)", margin: "0 auto 18px" }} />
        <h2 className="font-bold mb-2" style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif", fontSize: 24, color: "var(--ink)" }}>
          ¡Pedido enviado!
        </h2>
        <span className="inline-block font-mono text-[14px] px-4 py-1.5 rounded-full mb-4"
          style={{ background: "var(--cream)", color: "var(--ink-soft)", letterSpacing: ".08em" }}>
          #{orderId.slice(0, 8).toUpperCase()}
        </span>
        <p className="mb-8" style={{ color: "var(--ink-soft)", fontSize: 14.5 }}>
          Te contactaremos pronto. Preparamos con 24h de anticipación.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link href="/menu" onClick={onDone}
            className="inline-flex items-center gap-2 font-bold text-[15px] px-6 py-3.5 rounded-full text-white no-underline w-full justify-center"
            style={{ background: "var(--orange)", boxShadow: "0 6px 18px rgba(217,113,30,.32)" }}>
            Seguir comprando
          </Link>
          <Link href={trackUrl} className="inline-flex items-center gap-2 font-bold text-[15px] no-underline" style={{ color: "var(--orange-ink)" }}>
            Rastrear mi pedido
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 mb-6 border-0 bg-transparent cursor-pointer" style={{ color: "var(--ink-soft)", fontSize: 14 }}>
        <ArrowLeft size={15} /> Volver al menú
      </button>

      <h1 className="font-bold mb-6" style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif", fontSize: 28, color: "var(--ink)" }}>
        Confirmar pedido
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">
        {/* Columna izquierda */}
        <div>
          {/* Entrega */}
          <Card>
            {cardTitle(<MapPin className="w-4 h-4" />, selection.tipoEntrega === "pickup" ? "Recoger en tienda" : "Entrega a domicilio")}
            {selection.tipoEntrega === "pickup" && (
              <p className="text-[14.5px]" style={{ color: "var(--ink)" }}>Sede: <strong>{selection.sedePickup}</strong></p>
            )}
            {selection.tipoEntrega === "domicilio" && (
              <>
                <Field label="Dirección de entrega *" error={formErrors.direccion}>
                  <textarea value={direccion} onChange={e => setDireccion(e.target.value)} rows={2} maxLength={300}
                    placeholder="Col. Palmira, Calle Principal #123…" style={{ ...inputStyle, resize: "vertical" }} />
                </Field>
                {envioPorZona && zonaSeleccionada && (
                  <p className="mt-2 text-[14px]" style={{ color: "var(--ink-soft)" }}>
                    Zona: <strong style={{ color: "var(--ink)" }}>{zonaSeleccionada.nombre}</strong> — {sym}{Number(zonaSeleccionada.tarifa).toFixed(2)}
                  </p>
                )}
                {envioPorDistancia && (
                  <div className="mt-3 rounded-md p-3" style={{ background: "var(--cream)" }}>
                    <button type="button" onClick={handleUsarUbicacion} disabled={envioLoading}
                      className="inline-flex items-center gap-2 font-bold text-[13.5px] px-4 py-2.5 rounded-full cursor-pointer"
                      style={{ background: envioCoords ? "rgba(31,138,91,.12)" : "var(--orange)", color: envioCoords ? "var(--green)" : "#fff" }}>
                      {envioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                      {envioCoords ? "Ubicación detectada ✓" : "Calcular con mi ubicación"}
                    </button>
                    {envioError && <p className="text-[12.5px] mt-2" style={{ color: "var(--berry)" }}>{envioError}</p>}
                    {envioCalc && !envioCalc.fueraDeRango && (
                      <p className="text-[13.5px] mt-2" style={{ color: "var(--ink-soft)" }}>
                        Desde {envioCalc.sede.nombre} — {envioCalc.gratis ? "GRATIS" : `${sym}${envioCalc.costo.toFixed(2)}`}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Field label="Fecha preferida">
                <input type="date" value={fechaEntrega} min={fechaMinimaEntrega(cfgPedidos.hora_corte)}
                  onChange={e => setFechaEntrega(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Hora preferida">
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--ink-soft)" }} />
                  <select value={horaEntrega} onChange={e => setHoraEntrega(e.target.value)} style={{ ...inputStyle, paddingLeft: 36 }}>
                    <option value="">Cualquier hora</option>
                    {cfgPedidos.horas_entrega.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Nombre completo *" error={formErrors.nombre}>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="María García" style={inputStyle} />
              </Field>
              {selection.telefono ? (
                <p className="mt-2 text-[13px]" style={{ color: "var(--ink-soft)" }}>Teléfono: <strong style={{ color: "var(--ink)" }}>{selection.telefono}</strong></p>
              ) : (
                <div className="mt-3">
                  <Field label="Teléfono (opcional)">
                    <input value={telefonoManual} onChange={e => setTelefonoManual(e.target.value)} placeholder="9999-9999" type="tel" style={inputStyle} />
                  </Field>
                </div>
              )}
            </div>
          </Card>

          {/* Bolsa */}
          <Card>
            {cardTitle(<BLIcon name="cart" size={16} />, "Mi bolsa")}
            <div className="flex flex-col gap-2 mb-3">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-[14.5px]">
                  <span className="flex-1 truncate" style={{ color: "var(--ink)" }}>{item.quantity}× {item.name}</span>
                  <span className="font-semibold" style={{ color: "var(--ink)" }}>{sym}{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Field label="Notas adicionales">
              <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} maxLength={500}
                placeholder="Alergias, preferencias especiales, instrucciones de entrega…" style={{ ...inputStyle, resize: "vertical" }} />
            </Field>
          </Card>
        </div>

        {/* Columna derecha — resumen + pago */}
        <div className="lg:sticky" style={{ top: 90 }}>
          <Card>
            {cardTitle(null, "Detalle del pedido")}
            {promo ? (
              <div className="flex items-center justify-between rounded-md px-3 py-2 mb-3" style={{ background: "rgba(31,170,85,.08)" }}>
                <span className="text-[13px] font-semibold" style={{ color: "#1a7a40" }}>Código {promo.codigo} ({promo.descuento_porcentaje}%)</span>
                <button onClick={() => setPromo(null)} className="border-0 bg-transparent cursor-pointer text-[13px]" style={{ color: "#1a7a40" }}>Quitar</button>
              </div>
            ) : (
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1 flex items-center">
                  <Tag size={14} className="absolute left-3" style={{ color: "var(--ink-soft)" }} />
                  <input value={promoInput} onChange={e => setPromoInput(e.target.value)} placeholder="Código de descuento"
                    className="w-full outline-none uppercase" style={{ padding: "9px 12px 9px 30px", border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)", fontSize: 13.5 }} />
                </div>
                <button onClick={handleApplyPromo} disabled={promoLoading} className="cursor-pointer border-0 font-semibold"
                  style={{ padding: "9px 14px", borderRadius: "var(--r-md)", background: "var(--cream)", color: "var(--orange-ink)", fontSize: 13.5 }}>
                  {promoLoading ? <Loader2 size={14} className="animate-spin" /> : "Aplicar"}
                </button>
              </div>
            )}
            {promoError && <p style={{ color: "var(--berry)", fontSize: 12.5 }}>{promoError}</p>}
            {selection.giftCardCodigo && (
              <p className="text-[13px] mb-2" style={{ color: "#1a7a40" }}>Tarjeta de regalo {selection.giftCardCodigo} aplicada al confirmar.</p>
            )}
            <div className="flex justify-between text-[14px]" style={{ color: "var(--ink-soft)" }}>
              <span>Subtotal ({itemCount()} art.)</span><span>{sym}{subtotal.toFixed(2)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-[14px]" style={{ color: "#1a7a40" }}>
                <span>Descuento</span><span>-{sym}{descuento.toFixed(2)}</span>
              </div>
            )}
            {selection.tipoEntrega === "domicilio" && (
              <div className="flex justify-between text-[14px]" style={{ color: "var(--ink-soft)" }}>
                <span>Envío{zonaSeleccionada ? ` (${zonaSeleccionada.nombre})` : ""}</span>
                <span>{costoEnvio === 0 && (envioCalc?.gratis || envioPorZona) ? "GRATIS" : `${sym}${costoEnvio.toFixed(2)}`}</span>
              </div>
            )}
            <hr style={{ border: 0, borderTop: "1px solid var(--hairline)", margin: "10px 0" }} />
            <div className="flex justify-between font-bold mb-5" style={{ fontSize: 17, color: "var(--ink)" }}>
              <span>Total</span><span style={{ color: "var(--orange-ink)" }}>{sym}{totalFinal.toFixed(2)}</span>
            </div>

            {cardTitle(<Wallet className="w-4 h-4" />, "Método de pago")}
            {formErrors.metodo_pago && <p className="text-[12.5px] mb-2" style={{ color: "var(--berry)" }}>{formErrors.metodo_pago}</p>}
            <div className="flex flex-col gap-3">
              {METODOS_PAGO.map(m => (
                <button key={m.id} onClick={() => setMetodoPago(m.id)}
                  className="flex items-center gap-3 rounded-md border cursor-pointer text-left"
                  style={{ padding: "14px 16px", borderWidth: "1.5px", background: metodoPago === m.id ? "rgba(217,113,30,.07)" : "var(--paper-card)", borderColor: metodoPago === m.id ? "var(--orange)" : "var(--hairline)" }}>
                  <span className="text-xl">{m.icon}</span>
                  <div className="flex-1">
                    <strong className="block text-[15px]" style={{ color: "var(--ink)" }}>{m.label}</strong>
                    <span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>{m.desc}</span>
                  </div>
                </button>
              ))}
            </div>
            {metodoPago === "transferencia" && (
              <>
                <div className="mt-3 rounded-md p-4" style={{ background: "rgba(42,111,219,.07)" }}>
                  <p className="text-[12px] font-bold uppercase mb-2" style={{ color: "#2a6fdb" }}>Datos para transferencia</p>
                  <p className="text-[14px]">Banco: <strong>{banco.banco}</strong></p>
                  <p className="text-[14px]">Titular: <strong>{banco.titular}</strong></p>
                  <p className="text-[14px]">Cuenta: <strong className="font-mono">{banco.numero}</strong></p>
                </div>
                <div className="mt-3">
                  <p className="text-[14px] font-semibold mb-2" style={{ color: "var(--ink)" }}>
                    Comprobante de pago <span style={{ color: "var(--berry)" }}>*</span>
                  </p>
                  <label className="flex flex-col items-center gap-2 p-4 rounded-md border-2 border-dashed cursor-pointer"
                    style={{ borderColor: ssError ? "var(--berry)" : ssFile ? "var(--wa)" : "var(--hairline)" }}>
                    <strong className="text-[14px]">{ssFile ? ssFile.name : "Adjuntar comprobante"}</strong>
                    <span className="text-[12.5px]" style={{ color: "var(--ink-soft)" }}>PNG, JPG o WEBP · máx. 10 MB</span>
                    <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="sr-only"
                      onChange={e => {
                        const f = e.target.files?.[0] ?? null;
                        if (f && f.size > 10 * 1024 * 1024) { e.target.value = ""; setSsError("El comprobante no debe superar 10 MB."); return; }
                        setSsFile(f);
                        if (f) setSsError("");
                      }} />
                  </label>
                  {ssError && <p className="text-[12.5px] mt-1.5" style={{ color: "var(--berry)" }}>{ssError}</p>}
                </div>
              </>
            )}

            {orderError && (
              <div className="rounded-md px-4 py-3 text-[14px] font-medium mt-4" style={{ background: "rgba(158,59,70,.08)", color: "var(--berry)" }}>
                {orderError}
              </div>
            )}

            <button onClick={handleConfirm} disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 font-bold cursor-pointer border-0 text-white mt-5"
              style={{ background: "var(--choco-900)", borderRadius: "var(--r-pill)", padding: "15px", fontSize: 15.5, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
              Confirmar pedido — {sym}{totalFinal.toFixed(2)}
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 mb-5" style={{ background: "var(--paper-card)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-sm)" }}>
      {children}
    </div>
  );
}

function cardTitle(icon: React.ReactNode, title: string) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      {icon && (
        <span className="w-8 h-8 rounded-md grid place-items-center flex-none" style={{ background: "var(--cream)", color: "var(--orange-ink)" }}>{icon}</span>
      )}
      <h2 style={{ fontSize: 18, color: "var(--ink)" }}>{title}</h2>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-semibold mb-1.5" style={{ color: "var(--ink)", fontSize: 13.5 }}>{label}</label>
      {children}
      {error && <p className="text-[12.5px] mt-1" style={{ color: "var(--berry)" }}>{error}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)",
  background: "var(--paper)", fontSize: 14.5, color: "var(--ink)", outline: "none",
};
