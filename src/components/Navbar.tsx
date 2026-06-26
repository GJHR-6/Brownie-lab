"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useCartStore } from "@/lib/cartStore";
import { useWishlistStore } from "@/lib/wishlistStore";
import BLIcon from "@/components/BLIcon";

export default function Navbar() {
  const pathname = usePathname();
  const router         = useRouter();
  const itemCount      = useCartStore((s) => s.itemCount());
  const wishlistCount  = useWishlistStore((s) => s.count());
  const [mounted,      setMounted]     = useState(false);
  const [menuOpen,     setMenuOpen]    = useState(false);
  const [searchOpen,   setSearchOpen]  = useState(false);
  const [searchQuery,  setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSearchOpen(false);
      if ((e.key === "/" || (e.metaKey && e.key === "k")) && !searchOpen) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/menu?q=${encodeURIComponent(q)}`);
  }

  useEffect(() => setMounted(true), []);

  const links: { href: string; label: string; icon?: "sparkle" | "truck" }[] = [
    { href: "/", label: "Inicio" },
    { href: "/menu", label: "Menú" },
    { href: "/personaliza", label: "Personaliza", icon: "sparkle" },
    { href: "/contact", label: "Nosotros" },
    { href: "/seguimiento", label: "Seguir pedido", icon: "truck" },
  ];

  return (
    <header
      className="sticky top-0 z-40"
      style={{ background: "var(--choco-900)", color: "var(--on-dark)" }}
    >
      <div
        className="grid grid-cols-3 items-center mx-auto px-[var(--gutter)]"
        style={{ height: 72, maxWidth: "var(--maxw)" }}
      >
        {/* Hamburger — left */}
        <div className="justify-self-start">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex items-center gap-2 h-10 rounded-full px-3.5 border transition-colors cursor-pointer"
            aria-label="Menú"
            style={{
              color: "var(--on-dark-soft)",
              borderColor: "var(--hairline-dark)",
              background: "none",
            }}
          >
            <BLIcon name={menuOpen ? "close" : "nav-menu"} size={20} />
            <span className="font-semibold text-[14.5px]">Menú</span>
          </button>
        </div>

        {/* Brand — center */}
        <Link
          href="/"
          className="justify-self-center inline-flex items-center gap-2.5 no-underline"
          style={{ color: "var(--amber)" }}
        >
          <BLIcon name="mark" size={32} />
          <span
            className="font-extrabold text-[23px] tracking-tight"
            style={{
              fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif",
              color: "var(--on-dark)",
              letterSpacing: "-0.01em",
            }}
          >
            Brownie Lab
          </span>
        </Link>

        {/* Actions — right */}
        <div className="justify-self-end flex items-center gap-2.5">
          {/* Búsqueda global */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar productos"
            title="Buscar (/ o ⌘K)"
            className="hidden sm:grid w-10 h-10 rounded-full place-items-center border transition-colors"
            style={{ color: "var(--on-dark-soft)", borderColor: "var(--hairline-dark)", background: "none", cursor: "pointer" }}
          >
            <BLIcon name="search" size={19} />
          </button>

          {/* Favoritos */}
          <Link
            href="/favoritos"
            aria-label="Mis favoritos"
            title="Mis favoritos"
            className="relative hidden sm:grid w-10 h-10 rounded-full place-items-center border transition-colors no-underline"
            style={{ color: "var(--on-dark-soft)", borderColor: "var(--hairline-dark)", background: "none" }}
          >
            <BLIcon name="heart" size={19} />
            {mounted && wishlistCount > 0 && (
              <span
                className="absolute -top-[3px] -right-[3px] text-[10px] font-bold w-[17px] h-[17px] rounded-full grid place-items-center text-white"
                style={{ background: "var(--berry)" }}
              >
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Pide ahora */}
          <Link
            href="/cart"
            aria-label="Pide ahora"
            title="Pide ahora"
            className="relative inline-flex items-center gap-2 rounded-full h-10 px-3.5 sm:px-5 font-bold text-[14px] transition-transform no-underline"
            style={{ background: "var(--orange)", color: "#fff" }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "none")}
          >
            <BLIcon name="cart" size={18} className="hidden sm:block" />
            <span>¡Pide ahora!</span>
            {mounted && itemCount > 0 && (
              <span
                className="absolute -top-[3px] -right-[3px] text-[10px] font-bold w-[17px] h-[17px] rounded-full grid place-items-center text-white"
                style={{ background: "var(--berry)" }}
              >
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <div
          className="px-[var(--gutter)] pb-4 flex flex-col gap-1"
          style={{ background: "var(--choco-800)" }}
        >
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center gap-1.5 py-2.5 text-[15px] font-medium no-underline transition-colors"
                style={{ color: active ? "var(--amber)" : "var(--on-dark-soft)" }}
              >
                {l.label}
                {l.icon && <BLIcon name={l.icon} size={14} style={{ color: "var(--amber)" } as React.CSSProperties} />}
              </Link>
            );
          })}
          <div style={{ borderTop: "1px solid var(--hairline-dark)", margin: "6px 0 2px" }} />
          <Link
            href="/favoritos"
            onClick={() => setMenuOpen(false)}
            className="inline-flex items-center gap-1.5 py-2.5 text-[15px] font-medium no-underline transition-colors"
            style={{ color: pathname.startsWith("/favoritos") ? "var(--amber)" : "var(--on-dark-soft)" }}
          >
            <BLIcon name="heart" size={14} />
            Mis favoritos
            {mounted && wishlistCount > 0 && (
              <span
                className="text-[10px] font-bold w-[16px] h-[16px] rounded-full grid place-items-center text-white"
                style={{ background: "var(--berry)" }}
              >
                {wishlistCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => { setMenuOpen(false); setSearchOpen(true); }}
            className="inline-flex items-center gap-1.5 py-2.5 text-[15px] font-medium transition-colors border-0 bg-transparent cursor-pointer"
            style={{ color: "var(--on-dark-soft)" }}
          >
            <BLIcon name="search" size={14} />
            Buscar
          </button>
        </div>
      )}
      {/* Search overlay */}
      {searchOpen && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ background: "rgba(28,18,10,.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setSearchOpen(false)}
          />
          <div
            className="fixed z-50 w-full"
            style={{ top: 0, left: 0, right: 0 }}
          >
            <form
              onSubmit={handleSearchSubmit}
              className="mx-auto flex items-center gap-3 px-4 py-3"
              style={{
                maxWidth: 640,
                background: "var(--choco-900)",
                boxShadow: "0 8px 32px rgba(0,0,0,.4)",
                borderRadius: "0 0 24px 24px",
              }}
            >
              <BLIcon name="search" size={20} style={{ color: "var(--amber)", flexShrink: 0 } as React.CSSProperties} />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar brownies, galletas…"
                className="flex-1 bg-transparent border-none outline-none text-[16px] font-medium"
                style={{ color: "var(--on-dark)", caretColor: "var(--amber)" }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="grid place-items-center border-none bg-transparent cursor-pointer"
                  style={{ color: "var(--on-dark-soft)" }}
                  aria-label="Limpiar búsqueda"
                >
                  <BLIcon name="close" size={18} />
                </button>
              )}
              <kbd
                className="hidden sm:inline text-[11px] font-bold px-2 py-1 rounded"
                style={{ background: "rgba(255,255,255,.1)", color: "var(--on-dark-soft)" }}
              >
                ESC
              </kbd>
            </form>
          </div>
        </>
      )}
    </header>
  );
}
