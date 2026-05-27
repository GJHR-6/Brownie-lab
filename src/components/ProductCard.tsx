"use client";

import { useCartStore } from "@/lib/cartStore";
import { useWishlistStore } from "@/lib/wishlistStore";
import { useRecentStore } from "@/lib/recentStore";
import { storeConfig } from "@/config/store";
import { useState, useEffect } from "react";
import { Heart, Share2, Check } from "lucide-react";
import type { Producto } from "@/types/database";

export default function ProductCard({ product }: { product: Producto }) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isFav = useWishlistStore((s) => s.has(product.id));
  const addRecent = useRecentStore((s) => s.add);

  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [shared, setShared] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    addRecent(product);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) {
      addItem({ id: product.id, name: product.nombre, price: Number(product.precio), emoji: product.emoji ?? "🍪" });
    }
    setAdded(true);
    setQty(1);
    setTimeout(() => setAdded(false), 1200);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/menu`;
    const text = `¡Mira esto en Brownie Lab! ${product.nombre} — L.${Number(product.precio).toFixed(2)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.nombre, text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch { /* user cancelled */ }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow relative group">
      {/* Wishlist button */}
      {mounted && (
        <button
          onClick={() => toggleWishlist(product.id)}
          aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/90 shadow-sm transition-colors"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isFav ? "fill-red-500 text-red-500" : "text-stone-300"}`}
          />
        </button>
      )}

      {/* Image */}
      <div className="bg-amber-50 h-36 sm:h-44 flex items-center justify-center overflow-hidden">
        {product.imagen_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imagen_url} alt={product.nombre} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl">{product.emoji ?? "🍪"}</span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Name + price */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-stone-800 text-base leading-tight">{product.nombre}</h3>
          <span className="text-amber-800 font-bold text-base whitespace-nowrap">
            {storeConfig.currencySymbol}{Number(product.precio).toFixed(2)}
          </span>
        </div>

        {/* Description */}
        <p className="text-stone-500 text-sm leading-relaxed flex-1 mb-3">{product.descripcion}</p>

        {/* Category + share */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 capitalize">
            {product.categoria}
          </span>
          <button
            onClick={handleShare}
            aria-label="Compartir"
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-amber-700 transition-colors"
          >
            {shared ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
            {shared ? "Copiado" : "Compartir"}
          </button>
        </div>

        {/* Qty + add to cart */}
        {product.disponible ? (
          <div className="flex gap-2 items-center">
            <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden flex-shrink-0">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-stone-500 hover:bg-stone-50 transition-colors font-bold"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-semibold text-stone-700">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-10 h-10 flex items-center justify-center text-stone-500 hover:bg-stone-50 transition-colors font-bold"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                added ? "bg-green-500 text-white" : "bg-amber-800 hover:bg-amber-700 text-white"
              }`}
            >
              {added ? "✓ Agregado" : `Agregar${qty > 1 ? ` (${qty})` : ""}`}
            </button>
          </div>
        ) : (
          <button disabled className="w-full py-2 rounded-xl text-sm font-semibold bg-stone-200 text-stone-400 cursor-not-allowed">
            No disponible
          </button>
        )}
      </div>
    </div>
  );
}
