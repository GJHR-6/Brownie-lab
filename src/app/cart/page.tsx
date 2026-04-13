"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import { storeConfig } from "@/config/store";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, total, itemCount } =
    useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const buildWhatsAppMessage = () => {
    const lines = items.map(
      (i) =>
        `• ${i.quantity}x ${i.name} (${storeConfig.currencySymbol}${i.price} c/u) = ${storeConfig.currencySymbol}${i.price * i.quantity}`
    );
    const message = [
      `¡Hola ${storeConfig.name}! Me gustaría hacer el siguiente pedido:`,
      "",
      ...lines,
      "",
      `*Total: ${storeConfig.currencySymbol}${total()} ${storeConfig.currency}*`,
      "",
      "Por favor confirmen disponibilidad y método de pago. ¡Gracias! 🍪",
    ].join("\n");

    return `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(message)}`;
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-7xl mb-6">🛒</div>
        <h1
          className="text-3xl font-bold text-amber-800 mb-3"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Tu carrito está vacío
        </h1>
        <p className="text-stone-500 mb-8">
          Agrega algunas galletas para continuar.
        </p>
        <Link
          href="/menu"
          className="inline-block bg-amber-800 text-white font-semibold px-8 py-3 rounded-full hover:bg-amber-700 transition-colors"
        >
          Ver Menú
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1
        className="text-4xl font-bold text-amber-800 mb-10"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Tu Carrito
      </h1>

      {/* Items */}
      <div className="flex flex-col gap-4 mb-8">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 flex items-center gap-4"
          >
            <span className="text-4xl">{item.emoji}</span>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-stone-800 truncate">{item.name}</p>
              <p className="text-amber-800 font-bold">
                {storeConfig.currencySymbol}
                {item.price * item.quantity}
                <span className="text-stone-400 font-normal text-sm ml-1">
                  ({storeConfig.currencySymbol}{item.price} c/u)
                </span>
              </p>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, -1)}
                className="w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold flex items-center justify-center transition-colors"
              >
                −
              </button>
              <span className="w-6 text-center font-semibold text-stone-700">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, +1)}
                className="w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>

            <button
              onClick={() => removeItem(item.id)}
              className="text-stone-300 hover:text-red-400 transition-colors ml-2"
              aria-label="Eliminar"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div className="bg-amber-50 rounded-2xl p-6 mb-6">
        <div className="flex justify-between text-stone-600 mb-2">
          <span>Productos ({itemCount()} artículos)</span>
          <span>{storeConfig.currencySymbol}{total()} {storeConfig.currency}</span>
        </div>
        <div className="border-t border-amber-200 mt-3 pt-3 flex justify-between font-bold text-stone-800 text-lg">
          <span>Total</span>
          <span className="text-amber-800">
            {storeConfig.currencySymbol}{total()} {storeConfig.currency}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <a
          href={buildWhatsAppMessage()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-green-500 hover:bg-green-400 text-white font-semibold py-4 rounded-full text-center text-lg transition-colors"
        >
          💬 Enviar pedido por WhatsApp
        </a>
        <button
          onClick={clearCart}
          className="w-full border border-stone-300 text-stone-500 hover:text-red-500 hover:border-red-300 font-medium py-3 rounded-full text-center transition-colors text-sm"
        >
          Vaciar carrito
        </button>
        <Link
          href="/menu"
          className="w-full text-center text-amber-800 hover:underline text-sm py-2"
        >
          ← Seguir comprando
        </Link>
      </div>
    </div>
  );
}
