"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cartStore";
import { storeConfig } from "@/config/store";

export default function Navbar() {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.itemCount());
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const links = [
    { href: "/", label: "Inicio" },
    { href: "/menu", label: "Menú" },
    { href: "/contact", label: "Contacto" },
  ];

  return (
    <nav className="bg-amber-800 text-amber-50 shadow-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-wide">
          <span>🍪</span>
          <span>{storeConfig.name}</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors hover:text-amber-300 ${
                pathname === l.href ? "text-amber-300 border-b border-amber-300" : ""
              }`}
            >
              {l.label}
            </Link>
          ))}

          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex items-center gap-1 bg-amber-600 hover:bg-amber-500 transition-colors px-3 py-1.5 rounded-full text-sm font-medium"
          >
            <span>🛒</span>
            <span>Carrito</span>
            {mounted && itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <Link href="/cart" className="relative p-1">
            <span className="text-xl">🛒</span>
            {mounted && itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 text-amber-50"
            aria-label="Menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-amber-900 px-4 pb-4 flex flex-col gap-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`text-sm font-medium py-1 hover:text-amber-300 transition-colors ${
                pathname === l.href ? "text-amber-300" : ""
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
