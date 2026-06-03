"use client";

import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";

const SECTION_LABELS: Record<string, string> = {
  "/admin":              "Dashboard",
  "/admin/inventario":   "Inventario",
  "/admin/ingredientes": "Ingredientes",
  "/admin/categorias":   "Categorías",
  "/admin/galeria":      "Galería",
  "/admin/especiales":   "Especiales",
  "/admin/pedidos":      "Pedidos",
  "/admin/banners":      "Banners",
  "/admin/promociones":  "Promociones",
  "/admin/testimonios":  "Testimonios",
  "/admin/actividad":    "Actividad",
  "/admin/configuracion":"Configuración",
};

function getSectionLabel(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";
  const match = Object.keys(SECTION_LABELS)
    .filter(k => k !== "/admin")
    .find(k => pathname.startsWith(k));
  return match ? SECTION_LABELS[match] : "Admin";
}

interface AdminTopbarProps {
  userEmail: string;
  onMenuToggle: () => void;
}

export default function AdminTopbar({ userEmail, onMenuToggle }: AdminTopbarProps) {
  const pathname = usePathname();
  const section = getSectionLabel(pathname);
  const initial = (userEmail[0] ?? "A").toUpperCase();

  return (
    <header
      className="h-[58px] flex items-center gap-[18px] px-6 md:px-10 flex-shrink-0 sticky top-0 z-20"
      style={{
        background: "rgba(251,246,236,.88)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      {/* Mobile burger */}
      <button
        onClick={onMenuToggle}
        className="md:hidden flex items-center gap-2 text-[14px] font-[600] rounded-[999px] px-3 py-[7px] transition-all duration-150"
        style={{
          color: "var(--ink-soft)",
          background: "var(--paper-card)",
          border: "1px solid var(--hairline)",
        }}
        aria-label="Abrir menú"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16"/>
        </svg>
      </button>

      {/* Breadcrumb */}
      <p className="hidden md:block text-[13px] font-[600]" style={{ color: "var(--ink-soft)" }}>
        Panel · <b style={{ color: "var(--ink)" }}>{section}</b>
      </p>
      <p className="md:hidden text-[13px] font-[600]" style={{ color: "var(--ink)" }}>{section}</p>

      <div className="ml-auto flex items-center gap-[10px]">
        {/* Avatar */}
        <span
          className="hidden sm:grid place-items-center rounded-full border text-[13px] font-[700] flex-none"
          style={{
            width: 32,
            height: 32,
            background: "var(--cream)",
            borderColor: "var(--hairline)",
            color: "var(--orange-ink)",
          }}
        >
          {initial}
        </span>

        {/* Email */}
        <span
          className="hidden sm:block text-[14px] truncate max-w-[180px]"
          style={{ color: "var(--ink-soft)" }}
        >
          {userEmail}
        </span>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 text-[14px] font-[600] rounded-[999px] px-4 py-[8px] transition-all duration-150"
            style={{
              color: "var(--ink-soft)",
              background: "var(--paper-card)",
              border: "1px solid var(--hairline)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--berry)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--berry)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-soft)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--hairline)";
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 4.5h3A1.5 1.5 0 0 1 19.5 6v12a1.5 1.5 0 0 1-1.5 1.5h-3"/>
              <path d="M10 12H3.5M6.5 8.5 3 12l3.5 3.5"/>
            </svg>
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </form>
      </div>
    </header>
  );
}
