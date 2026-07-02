"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import { useWishlistStore } from "@/lib/wishlistStore";
import { useRecentStore } from "@/lib/recentStore";
import { storeConfig } from "@/config/store";
import { useState, useEffect } from "react";
import BLIcon from "@/components/BLIcon";
import type { Producto } from "@/types/database";

export default function ProductCard({ product }: { product: Producto }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const isAtCategoryLimit = useCartStore((s) => s.isAtCategoryLimit);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isFav = useWishlistStore((s) => s.has(product.id));
  const addRecent = useRecentStore((s) => s.add);

  const [added,    setAdded]    = useState(false);
  const [notified, setNotified] = useState(false);
  const [qty,      setQty]      = useState(1);
  const [mounted,  setMounted]  = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  const allImages = [product.imagen_url, ...(product.imagenes ?? [])].filter(Boolean) as string[];

  const agotado = product.disponible && product.stock === 0;
  const cartQty = useCartStore(s => s.items.find(i => i.id === product.id)?.quantity ?? 0);
  const stockRestante = Math.max(0, product.stock - cartQty);
  const sinStock = product.stock > 0 && stockRestante === 0;
  const stockBajo = !agotado && product.stock > 0 && product.stock <= (product.stock_alerta ?? 5);

  useEffect(() => {
    setMounted(true);
    addRecent(product);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // Autoplay del carrusel de imágenes
  useEffect(() => {
    if (allImages.length <= 1) return;
    const t = setInterval(() => setImgIndex((i) => (i + 1) % allImages.length), 4500);
    return () => clearInterval(t);
  }, [allImages.length]);

  const limiteAlcanzado = product.categoria ? isAtCategoryLimit(product.categoria) : false;
  const bloqueado = limiteAlcanzado || sinStock;

  function handleAdd() {
    if (bloqueado) return;
    const toAdd = Math.min(qty, stockRestante);
    for (let i = 0; i < toAdd; i++) {
      addItem({ id: product.id, name: product.nombre, price: Number(product.precio), emoji: product.emoji ?? "🍪", categoria: product.categoria });
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
        cursor: "pointer",
      }}
      onClick={() => router.push(`/menu/${product.id}`)}
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
        className="relative overflow-hidden"
        style={{
          aspectRatio: "4/3",
          ...(agotado && { filter: "grayscale(0.65)", opacity: 0.82 }),
        }}
      >
        <Link
          href={`/menu/${product.id}`}
          className="absolute inset-0 z-0"
          aria-label={`Ver detalle de ${product.nombre}`}
          tabIndex={-1}
        />
        {allImages.length > 0 ? (
          <>
            {allImages.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt={product.nombre}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                style={{
                  opacity: i === imgIndex ? 1 : 0,
                  transform: i === imgIndex ? 'translateX(0)' : 'translateX(14px)',
                  transition: 'opacity .38s cubic-bezier(.25,.8,.25,1), transform .38s cubic-bezier(.25,.8,.25,1)',
                }}
              />
            ))}
          </>
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

        {/* Etiquetas badges */}
        {product.etiquetas && product.etiquetas.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1 pointer-events-none">
            {product.etiquetas.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "var(--choco-900)", color: "var(--amber)", letterSpacing: ".04em" }}
              >
                {tag}
              </span>
            ))}
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

        {/* Stock bajo badge */}
        {stockBajo && !agotado && (
          <span
            className="absolute top-3 left-3 text-[12px] font-bold px-3 py-1 rounded-full"
            style={{
              background: "rgba(217,113,30,.92)",
              color: "#fff",
              backdropFilter: "blur(4px)",
            }}
          >
            ¡Últimas {product.stock}!
          </span>
        )}

        {/* Image navigation dots */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-auto">
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setImgIndex(i); }}
                aria-label={`Foto ${i + 1}`}
                style={{
                  width: i === imgIndex ? 18 : 7,
                  height: 7, borderRadius: 4,
                  background: i === imgIndex ? '#fff' : 'rgba(255,255,255,.55)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'width .2s, background .2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,.3)',
                }}
              />
            ))}
          </div>
        )}

        {/* Arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setImgIndex((i) => (i - 1 + allImages.length) % allImages.length); }}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full grid place-items-center cursor-pointer border transition-colors"
              style={{ background: "var(--paper-card)", borderColor: "var(--hairline)", color: "var(--ink-soft)" }}
            >
              <BLIcon name="arrow-right" size={16} className="rotate-180" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setImgIndex((i) => (i + 1) % allImages.length); }}
              aria-label="Foto siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full grid place-items-center cursor-pointer border transition-colors"
              style={{ background: "var(--paper-card)", borderColor: "var(--hairline)", color: "var(--ink-soft)" }}
            >
              <BLIcon name="arrow-right" size={16} />
            </button>
          </>
        )}

        {/* Wishlist button */}
        {mounted && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
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
          <Link
            href={`/menu/${product.id}`}
            className="no-underline font-bold"
            style={{
              fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif",
              fontSize: 21,
              color: "var(--ink)",
            }}
          >
            {product.nombre}
          </Link>
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

        {/* Tiempo de preparación */}
        {product.tiempo_preparacion && (
          <p className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "var(--ink-soft)" }}>
            <BLIcon name="clock" size={13} style={{ flexShrink: 0 } as React.CSSProperties} />
            {product.tiempo_preparacion}
          </p>
        )}

        {/* Alergenos */}
        {product.alergenos && product.alergenos.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.alergenos.map(a => (
              <span
                key={a}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(158,59,70,.08)", color: "var(--berry)", border: "1px solid rgba(158,59,70,.15)" }}
              >
                {a}
              </span>
            ))}
          </div>
        )}

        {agotado && (
          <p className="text-[13px] font-medium" style={{ color: "var(--ink-soft)" }}>
            Vuelve mañana.
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2.5 mt-auto pt-1.5">
          {agotado ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const msg = `Hola! Me interesa *${product.nombre}* pero está agotado. ¿Pueden avisarme cuando vuelva a estar disponible? 🍪`;
                window.open(`https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
                setNotified(true);
                setTimeout(() => setNotified(false), 3000);
              }}
              className="w-full inline-flex items-center justify-center gap-2 font-bold text-[15px] py-[10px] rounded-full border-0 cursor-pointer transition-all"
              style={{
                background: notified ? "rgba(31,170,85,.1)" : "var(--cream)",
                color: notified ? "#1a7a40" : "var(--orange-ink)",
                border: `1.5px solid ${notified ? "rgba(31,170,85,.3)" : "var(--amber)"}`,
              }}
            >
              <BLIcon name={notified ? "mark" : "whatsapp"} size={16} />
              {notified ? "¡Mensaje enviado!" : "Avísame cuando vuelva"}
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
                  onClick={(e) => { e.stopPropagation(); setQty((q) => Math.max(1, q - 1)); }}
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
                  onClick={(e) => { e.stopPropagation(); setQty((q) => Math.min(q + 1, Math.max(1, stockRestante))); }}
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
                onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                disabled={bloqueado}
                className="flex-1 inline-flex items-center justify-center gap-2 font-bold text-[15px] py-[10px] rounded-full transition-all border-0 text-white"
                style={{
                  background: bloqueado ? "var(--ink-soft, #aaa)" : added ? "var(--wa)" : "var(--orange)",
                  boxShadow: added || bloqueado ? "none" : "0 6px 18px rgba(217,113,30,.32)",
                  cursor: bloqueado ? "not-allowed" : "pointer",
                }}
              >
                {sinStock ? "Sin disponibilidad" : limiteAlcanzado ? "Límite del pedido" : added ? "✓ Agregado" : "Agregar"}
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
