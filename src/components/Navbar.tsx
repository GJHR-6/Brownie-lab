"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cartStore";
import BLIcon from "@/components/BLIcon";

export default function Navbar() {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.itemCount());
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const links = [
    { href: "/", label: "Inicio" },
    { href: "/menu", label: "Menú" },
    { href: "/personaliza", label: "Personaliza", icon: true },
    { href: "/contact", label: "Nosotros" },
  ];

  return (
    <header
      className="sticky top-0 z-40"
      style={{ background: "var(--choco-900)", color: "var(--on-dark)" }}
    >
      <div
        className="flex items-center justify-between mx-auto px-[var(--gutter)]"
        style={{ height: 72, maxWidth: "var(--maxw)" }}
      >
        {/* Brand */}
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 no-underline"
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

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex items-center gap-1.5 text-[15px] font-medium transition-colors no-underline"
                style={{ color: active ? "var(--amber)" : "var(--on-dark-soft)" }}
                onMouseOver={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color =
                    active ? "var(--amber)" : "var(--on-dark)")
                }
                onMouseOut={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color =
                    active ? "var(--amber)" : "var(--on-dark-soft)")
                }
              >
                {l.label}
                {l.icon && (
                  <BLIcon name="sparkle" size={15} style={{ color: "var(--amber)" } as React.CSSProperties} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {/* Cart */}
          <Link
            href="/cart"
            aria-label="Carrito"
            className="relative w-10 h-10 rounded-full grid place-items-center border transition-colors no-underline"
            style={{
              color: "var(--on-dark-soft)",
              borderColor: "var(--hairline-dark)",
              background: "none",
            }}
          >
            <BLIcon name="cart" size={20} />
            {mounted && itemCount > 0 && (
              <span
                className="absolute -top-[3px] -right-[3px] text-[10px] font-bold w-[17px] h-[17px] rounded-full grid place-items-center text-white"
                style={{ background: "var(--orange)" }}
              >
                {itemCount}
              </span>
            )}
          </Link>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 rounded-full grid place-items-center border transition-colors"
            aria-label="Menú"
            style={{
              color: "var(--on-dark-soft)",
              borderColor: "var(--hairline-dark)",
              background: "none",
            }}
          >
            <BLIcon name={menuOpen ? "close" : "nav-menu"} size={20} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="md:hidden px-[var(--gutter)] pb-4 flex flex-col gap-1"
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
                {l.icon && <BLIcon name="sparkle" size={14} style={{ color: "var(--amber)" } as React.CSSProperties} />}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
