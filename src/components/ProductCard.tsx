"use client";

import { useCartStore } from "@/lib/cartStore";
import { useWishlistStore } from "@/lib/wishlistStore";
import { useRecentStore } from "@/lib/recentStore";
import { storeConfig } from "@/config/store";
import { useState, useEffect } from "react";
import BLIcon from "@/components/BLIcon";
import type { Producto } from "@/types/database";

export default function ProductCard({ product }: { product: Producto }) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isFav = useWishlistStore((s) => s.has(product.id));
  const addRecent = useRecentStore((s) => s.add);

  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [mounted, setMounted] = useState(false);

  const agotado = product.disponible && product.stock === 0;

  useEffect(() => {
    setMounted(true);
    addRecent(product);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  function handleAdd() {
    for (let i = 0; i < qty; i++) {
      addItem({ id: product.id, name: product.nombre, price: Number(product.precio), emoji: product.emoji ?? "🍪" });
    }
    setAdded(true);
    setQty(1);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <article
      className="flex flex-col overflow-hidden transition-all duration-200 relative"
      style={{
        background: "var(--paper-card)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--hairline)",
        boxShadow: "var(--shadow-sm)",
      }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
      }}
    >
      {/* Media */}
      <div
        className="relative"
        style={{
          aspectRatio: "4/3",
          ...(agotado && { filter: "grayscale(0.65)", opacity: 0.82 }),
        }}
      >
        {product.imagen_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imagen_url}
            alt={product.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full grid place-items-center text-5xl"
            style={{
              background:
                "repeating-linear-gradient(135deg, rgba(116,58,20,.07) 0 10px, rgba(116,58,20,0) 10px 20px), var(--cream)",
            }}
          >
            {product.emoji ?? "🍪"}
          </div>
        )}

        {/* Agotado overlay */}
        {agotado && (
          <>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "repeating-linear-gradient(135deg, rgba(180,160,140,.18) 0 10px, transparent 10px 20px)",
              }}
            />
            <span
              className="absolute top-3 left-3 text-[13px] font-semibold px-3 py-1 rounded-full"
              style={{
                background: "rgba(40,30,20,.82)",
                color: "#fff",
                backdropFilter: "blur(4px)",
              }}
            >
              Agotado hoy
            </span>
          </>
        )}

        {/* Wishlist button */}
        {mounted && (
          <button
            onClick={() => toggleWishlist(product.id)}
            aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
            className="absolute top-3 right-3 w-[38px] h-[38px] rounded-full grid place-items-center cursor-pointer transition-colors border"
            style={{
              background: "var(--paper-card)",
              borderColor: isFav ? "var(--berry)" : "var(--hairline)",
              color: isFav ? "var(--berry)" : "var(--ink-soft)",
            }}
          >
            <BLIcon name="heart" size={16} />
          </button>
        )}
      </div>

      {/* Body */}
      <div
        className="flex flex-col gap-2.5 flex-1"
        style={{ padding: "18px 20px 20px" }}
      >
        <div className="flex justify-between items-baseline gap-3">
          <h3
            className="font-bold"
            style={{
              fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif",
              fontSize: 21,
              color: "var(--ink)",
            }}
          >
            {product.nombre}
          </h3>
          <span
            className="font-bold text-[18px] whitespace-nowrap"
            style={{ color: "var(--orange-ink)" }}
          >
            {storeConfig.currencySymbol}{Number(product.precio).toFixed(2)}
          </span>
        </div>

        <p className="text-[14px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          {product.descripcion}
        </p>

        {agotado && (
          <p className="text-[13px] font-medium" style={{ color: "var(--ink-soft)" }}>
            Vuelve mañana.
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2.5 mt-auto pt-1.5">
          {agotado ? (
            <button
              disabled
              className="w-full inline-flex items-center justify-center gap-2 font-bold text-[15px] py-[10px] rounded-full cursor-not-allowed border"
              style={{
                background: "var(--paper-card)",
                color: "var(--ink-soft)",
                borderColor: "var(--hairline)",
                opacity: 0.75,
              }}
            >
              <BLIcon name="clock" size={16} />
              Avísame cuando vuelva
            </button>
          ) : product.disponible ? (
            <>
              {/* Stepper */}
              <div
                className="inline-flex items-center overflow-hidden"
                style={{
                  border: "1.5px solid var(--hairline)",
                  borderRadius: "var(--r-pill)",
                }}
              >
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-[38px] h-[38px] grid place-items-center cursor-pointer border-0 transition-colors"
                  style={{ background: "transparent", color: "var(--ink)" }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--cream)")}
                  onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
                  aria-label="Menos"
                >
                  <BLIcon name="minus" size={16} />
                </button>
                <span
                  className="text-center font-bold text-[15px]"
                  style={{ minWidth: 26, color: "var(--ink)" }}
                >
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-[38px] h-[38px] grid place-items-center cursor-pointer border-0 transition-colors"
                  style={{ background: "transparent", color: "var(--ink)" }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--cream)")}
                  onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
                  aria-label="Más"
                >
                  <BLIcon name="plus" size={16} />
                </button>
              </div>

              {/* Add button */}
              <button
                onClick={handleAdd}
                className="flex-1 inline-flex items-center justify-center gap-2 font-bold text-[15px] py-[10px] rounded-full transition-all cursor-pointer border-0 text-white"
                style={{
                  background: added ? "var(--wa)" : "var(--orange)",
                  boxShadow: added ? "none" : "0 6px 18px rgba(217,113,30,.32)",
                }}
              >
                {added ? "✓ Agregado" : "Agregar"}
              </button>
            </>
          ) : (
            <button
              disabled
              className="w-full inline-flex items-center justify-center gap-2 font-bold text-[15px] py-[10px] rounded-full cursor-not-allowed border-0"
              style={{
                background: "var(--cream-200)",
                color: "var(--ink-soft)",
                opacity: 0.7,
              }}
            >
              <BLIcon name="clock" size={16} />
              No disponible
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
