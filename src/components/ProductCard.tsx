"use client";

import { useCartStore } from "@/lib/cartStore";
import { storeConfig } from "@/config/store";
import { useState } from "react";
import type { Producto } from "@/types/database";

export default function ProductCard({ product }: { product: Producto }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.nombre,
      price: Number(product.precio),
      emoji: product.emoji ?? "🍪",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="bg-amber-50 h-44 flex items-center justify-center overflow-hidden">
        {product.imagen_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imagen_url}
            alt={product.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-6xl">{product.emoji ?? "🍪"}</span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-stone-800 text-base leading-tight">
            {product.nombre}
          </h3>
          <span className="text-amber-800 font-bold text-base whitespace-nowrap">
            {storeConfig.currencySymbol}{Number(product.precio).toFixed(2)}
          </span>
        </div>

        <p className="text-stone-500 text-sm leading-relaxed flex-1 mb-4">
          {product.descripcion}
        </p>

        <span className="inline-block text-xs bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 mb-3 self-start capitalize">
          {product.categoria}
        </span>

        {product.disponible ? (
          <button
            onClick={handleAdd}
            className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${
              added
                ? "bg-green-500 text-white"
                : "bg-amber-800 hover:bg-amber-700 text-white"
            }`}
          >
            {added ? "✓ Agregado" : "Agregar al carrito"}
          </button>
        ) : (
          <button
            disabled
            className="w-full py-2 rounded-xl text-sm font-semibold bg-stone-200 text-stone-400 cursor-not-allowed"
          >
            No disponible
          </button>
        )}
      </div>
    </div>
  );
}
