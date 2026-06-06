"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useWishlistStore } from "@/lib/wishlistStore";
import ProductCard from "@/components/ProductCard";
import BLIcon from "@/components/BLIcon";
import type { Producto } from "@/types/database";

export default function FavoritosClient({ productos }: { productos: Producto[] }) {
  const ids        = useWishlistStore((s) => s.ids);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const favoritos = useMemo(
    () => productos.filter((p) => ids.includes(p.id)),
    [productos, ids],
  );

  if (!mounted) return null;

  return (
    <div
      className="mx-auto px-[var(--gutter)]"
      style={{ maxWidth: "var(--maxw)", paddingBlock: "clamp(48px,6vw,80px)" }}
    >
      <div className="mb-10">
        <h1
          className="font-extrabold"
          style={{
            fontFamily: "var(--font-playfair,'Playfair Display',Georgia,serif)",
            fontSize: "clamp(34px,5vw,52px)",
            color: "var(--ink)",
          }}
        >
          Mis favoritos
        </h1>
        {favoritos.length > 0 && (
          <p className="mt-2 text-[16px]" style={{ color: "var(--ink-soft)" }}>
            {favoritos.length} {favoritos.length === 1 ? "producto guardado" : "productos guardados"}
          </p>
        )}
      </div>

      {favoritos.length === 0 ? (
        <div className="text-center" style={{ paddingBlock: "clamp(40px,6vw,80px)" }}>
          <span
            className="w-24 h-24 rounded-full mx-auto mb-7 grid place-items-center"
            style={{ background: "var(--cream)", color: "var(--berry)" }}
          >
            <BLIcon name="heart" size={46} />
          </span>
          <h2 className="mb-3" style={{ fontSize: "clamp(24px,3vw,34px)", color: "var(--ink)" }}>
            Todavía no guardaste ninguno
          </h2>
          <p className="mb-8" style={{ color: "var(--ink-soft)", fontSize: 17 }}>
            Tocá el corazón en cualquier producto del menú para guardarlo aquí.
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
      ) : (
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
        >
          {favoritos.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
