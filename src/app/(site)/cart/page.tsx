"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Tag, X, CheckCircle } from "lucide-react";
import { useCartStore } from "@/lib/cartStore";
import { storeConfig } from "@/config/store";
import { validarPromocion } from "@/actions/publico";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, total, itemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ codigo: string; descuento_porcentaje: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const subtotal = total();
  const descuento = promo ? Math.round(subtotal * (promo.descuento_porcentaje / 100) * 100) / 100 : 0;
  const totalFinal = subtotal - descuento;

  async function handleApplyPromo() {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    const result = await validarPromocion(promoInput.trim());
    if (result.success) {
      setPromo(result.data);
      setPromoInput("");
    } else {
      setPromoError(result.error);
    }
    setPromoLoading(false);
  }

  const buildWhatsAppMessage = () => {
    const lines = items.map(
      (i) => `• ${i.quantity}x ${i.name} = ${storeConfig.currencySymbol}${(i.price * i.quantity).toFixed(2)}`
    );
    const parts: string[] = [
      `¡Hola ${storeConfig.name}! Me gustaría hacer el siguiente pedido:`,
      "",
      ...lines,
      "",
      `Subtotal: ${storeConfig.currencySymbol}${subtotal.toFixed(2)}`,
    ];
    if (promo) {
      parts.push(`Descuento ${promo.codigo} (${promo.descuento_porcentaje}%): -${storeConfig.currencySymbol}${descuento.toFixed(2)}`);
      parts.push(`*Total: ${storeConfig.currencySymbol}${totalFinal.toFixed(2)} ${storeConfig.currency}*`);
    } else {
      parts.push(`*Total: ${storeConfig.currencySymbol}${subtotal.toFixed(2)} ${storeConfig.currency}*`);
    }
    parts.push("", "Por favor confirmen disponibilidad y método de pago. ¡Gracias! 🍪");
    return `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(parts.join("\n"))}`;
  };

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-amber-800 mb-10" style={{ fontFamily: "var(--font-playfair)" }}>
        Tu Carrito
      </h1>

      {/* Items */}
      <div className="flex flex-col gap-4 mb-8">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 flex items-center gap-4">
            <span className="text-4xl">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-stone-800 truncate">{item.name}</p>
              <p className="text-amber-800 font-bold">
                {storeConfig.currencySymbol}{(item.price * item.quantity).toFixed(2)}
                <span className="text-stone-400 font-normal text-sm ml-1">
                  ({storeConfig.currencySymbol}{item.price.toFixed(2)} c/u)
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold flex items-center justify-center transition-colors">−</button>
              <span className="w-6 text-center font-semibold text-stone-700">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, +1)} className="w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold flex items-center justify-center transition-colors">+</button>
            </div>
            <button onClick={() => removeItem(item.id)} className="text-stone-300 hover:text-red-400 transition-colors ml-2" aria-label="Eliminar">✕</button>
          </div>
        ))}
      </div>

      {/* Código de descuento */}
      <div className="mb-6">
        {promo ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-700">Código <span className="font-mono">{promo.codigo}</span> aplicado</p>
              <p className="text-xs text-green-600">{promo.descuento_porcentaje}% de descuento</p>
            </div>
            <button onClick={() => setPromo(null)} className="text-green-400 hover:text-green-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleApplyPromo(); }}
                  placeholder="Código de descuento"
                  className="w-full pl-10 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase"
                />
              </div>
              <button
                onClick={handleApplyPromo}
                disabled={promoLoading || !promoInput.trim()}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                {promoLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Aplicar
              </button>
            </div>
            {promoError && <p className="text-red-500 text-xs mt-1.5">{promoError}</p>}
          </div>
        )}
      </div>

      {/* Resumen */}
      <div className="bg-amber-50 rounded-2xl p-6 mb-6">
        <div className="flex justify-between text-stone-600 mb-2">
          <span>Productos ({itemCount()} artículos)</span>
          <span>{storeConfig.currencySymbol}{subtotal.toFixed(2)}</span>
        </div>
        {promo && (
          <div className="flex justify-between text-green-600 mb-2 text-sm">
            <span>Descuento ({promo.descuento_porcentaje}%)</span>
            <span>-{storeConfig.currencySymbol}{descuento.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-amber-200 mt-3 pt-3 flex justify-between font-bold text-stone-800 text-lg">
          <span>Total</span>
          <span className="text-amber-800">{storeConfig.currencySymbol}{totalFinal.toFixed(2)} {storeConfig.currency}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <a href={buildWhatsAppMessage()} target="_blank" rel="noopener noreferrer"
          className="w-full bg-green-500 hover:bg-green-400 text-white font-semibold py-4 rounded-full text-center text-lg transition-colors">
          💬 Enviar pedido por WhatsApp
        </a>
        <button onClick={clearCart}
          className="w-full border border-stone-300 text-stone-500 hover:text-red-500 hover:border-red-300 font-medium py-3 rounded-full text-center transition-colors text-sm">
          Vaciar carrito
        </button>
        <Link href="/menu" className="w-full text-center text-amber-800 hover:underline text-sm py-2">
          ← Seguir comprando
        </Link>
      </div>
    </div>
  );
}
