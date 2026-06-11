"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin",                 label: "Dashboard",     icon: "ic-dashboard", exact: true  },
  { href: "/admin/inventario",      label: "Inventario",    icon: "ic-box",        exact: false },
  { href: "/admin/ingredientes",    label: "Ingredientes",  icon: "ic-flask",      exact: false },
  { href: "/admin/personaliza",     label: "Personaliza",   icon: "ic-sliders",    exact: false },
  { href: "/admin/categorias",      label: "Categorías",    icon: "ic-tag",        exact: false },
  { href: "/admin/galeria",         label: "Galería",       icon: "ic-image",      exact: false },
  { href: "/admin/especiales",      label: "Especiales",    icon: "ic-sparkle",    exact: false },
  { href: "/admin/pedidos",         label: "Pedidos",       icon: "ic-bag",        exact: false },
  { href: "/admin/clientes",        label: "Clientes",      icon: "ic-users",      exact: false },
  { href: "/admin/reportes",        label: "Reportes",      icon: "ic-report",     exact: false },
  { href: "/admin/fidelizacion",    label: "Fidelización",  icon: "ic-loyalty",    exact: false },
  { href: "/admin/banners",         label: "Banners",       icon: "ic-banner",     exact: false },
  { href: "/admin/promociones",     label: "Promociones",   icon: "ic-percent",    exact: false },
  { href: "/admin/testimonios",     label: "Testimonios",   icon: "ic-chat",       exact: false },
  { href: "/admin/notificaciones",  label: "Notificaciones", icon: "ic-bell",      exact: false },
  { href: "/admin/actividad",       label: "Actividad",     icon: "ic-activity",   exact: false },
  { href: "/admin/configuracion",   label: "Configuración", icon: "ic-gear",       exact: false },
] as const;

/* Inline SVG icons matching the design sprite */
function NavIcon({ id }: { id: string }) {
  const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const F = { fill: "currentColor", stroke: "none" };
  switch (id) {
    case "ic-dashboard": return <svg viewBox="0 0 24 24" {...S} className="w-[19px] h-[19px] flex-none"><rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/></svg>;
    case "ic-box":       return <svg viewBox="0 0 24 24" {...S} className="w-[19px] h-[19px] flex-none"><path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5z"/><path d="M3 8.5 12 14l9-5.5M12 14v7"/></svg>;
    case "ic-flask":     return <svg viewBox="0 0 24 24" {...S} className="w-[19px] h-[19px] flex-none"><path d="M9 3h6M10 3.5v6L5.5 18a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.5v-6"/><path d="M7.7 15h8.6"/></svg>;
    case "ic-tag":       return <svg viewBox="0 0 24 24" {...S} className="w-[19px] h-[19px] flex-none"><path d="M3.5 12.8V5a1.5 1.5 0 0 1 1.5-1.5h7.8a1.5 1.5 0 0 1 1.06.44l6 6a1.5 1.5 0 0 1 0 2.12l-6.8 6.8a1.5 1.5 0 0 1-2.12 0l-6-6A1.5 1.5 0 0 1 3.5 12.8z"/><circle cx="8" cy="8" r="1.3" {...F}/></svg>;
    case "ic-image":     return <svg viewBox="0 0 24 24" {...S} className="w-[19px] h-[19px] flex-none"><rect x="3.5" y="4.5" width="17" height="15" rx="2.2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M4 17l4.5-4.5 3.5 3.5 3-3 5 5"/></svg>;
    case "ic-sparkle":   return <svg viewBox="0 0 24 24" {...S} className="w-[19px] h-[19px] flex-none"><path d="M12 3c.4 3.6 1.4 4.6 5 5-3.6.4-4.6 1.4-5 5-.4-3.6-1.4-4.6-5-5 3.6-.4 4.6-1.4 5-5z"/><path d="M19 13.5c.2 1.6.7 2.1 2.3 2.3-1.6.2-2.1.7-2.3 2.3-.2-1.6-.7-2.1-2.3-2.3 1.6-.2 2.1-.7 2.3-2.3z"/></svg>;
    case "ic-bag":       return <svg viewBox="0 0 24 24" {...S} className="w-[19px] h-[19px] flex-none"><path d="M5.5 8h13l-1 11.2a1.5 1.5 0 0 1-1.5 1.3H8a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8"/></svg>;
    case "ic-banner":    return <svg viewBox="0 0 24 24" {...S} className="w-[19px] h-[19px] flex-none"><rect x="3.5" y="6" width="17" height="12" rx="2.2"/><path d="M3.5 14l4-3.5 3 2.5 3.5-3 6.5 5"/></svg>;
    case "ic-percent":   return <svg viewBox="0 0 24 24" {...S} className="w-[19px] h-[19px] flex-none"><path d="M6 18 18 6"/><circle cx="7.5" cy="7.5" r="2.1"/><circle cx="16.5" cy="16.5" r="2.1"/></svg>;
    case "ic-chat":      return <svg viewBox="0 0 24 24" {...S} className="w-[19px] h-[19px] flex-none"><path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5V17H4a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 4 5.5z"/><path d="M7.5 10h9M7.5 13h6"/></svg>;
    case "ic-users":     return <svg viewBox="0 0 24 24" {...S} className="w-[19px] h-[19px] flex-none"><circle cx="9" cy="7.5" r="3.2"/><path d="M2.5 20.5c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><circle cx="17.5" cy="8" r="2.4"/><path d="M21.5 20.5c0-2.8-1.8-5.1-4.3-5.9"/></svg>;
    case "ic-activity":  return <svg viewBox="0 0 24 24" {...S} className="w-[19px] h-[19px] flex-none"><path d="M3 12h4l2.5-6 5 13 2.5-7H21"/></svg>;
    case "ic-report":    return <svg viewBox="0 0 24 24" {...S} className="w-[19px] h-[19px] flex-none"><path d="M4 20.5V3.5"/><path d="M4 20.5H21"/><path d="M8 16v-5M12.5 16V8M17 16v-3.5"/></svg>;
    case "ic-gear":      return <svg viewBox="0 0 24 24" {...S} className="w-[19px] h-[19px] flex-none"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3"/></svg>;
    case "ic-loyalty":   return <svg viewBox="0 0 24 24" {...S} className="w-[19px] h-[19px] flex-none"><circle cx="12" cy="8.5" r="3.5"/><path d="M12 13.5V16M9.5 20.5h5M5.5 20.5l1.8-4h9.4l1.8 4"/></svg>;
    case "ic-bell":      return <svg viewBox="0 0 24 24" {...S} className="w-[19px] h-[19px] flex-none"><path d="M5.5 10.5a6.5 6.5 0 0 1 13 0V15l1.5 1.5H4L5.5 15v-4.5z"/><path d="M10 16.5a2 2 0 0 0 4 0"/></svg>;
    case "ic-sliders":   return <svg viewBox="0 0 24 24" {...S} className="w-[19px] h-[19px] flex-none"><path d="M4 6h16M4 12h10M4 18h13"/><circle cx="16" cy="6" r="2.2" fill="currentColor" stroke="none"/><circle cx="11" cy="12" r="2.2" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="2.2" fill="currentColor" stroke="none"/></svg>;
    default: return null;
  }
}

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(28,18,10,.42)", backdropFilter: "blur(2px)" }}
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex-shrink-0 flex flex-col h-full
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ width: 264, background: "var(--choco-950)", color: "var(--on-dark-soft)" }}
      >
        {/* Brand */}
        <div
          className="flex items-center gap-3 px-[22px] py-[22px] flex-shrink-0"
          style={{ borderBottom: "1px solid var(--hairline-dark)" }}
        >
          <span
            className="flex-none grid place-items-center rounded-[12px]"
            style={{ width: 42, height: 42, background: "rgba(232,162,58,.14)", color: "var(--amber)" }}
          >
            <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.5 4h7"/>
              <path d="M13.5 4.4v6.3L7.1 23.3c-.7 1.3.2 3 1.7 3h14.4c1.5 0 2.4-1.7 1.7-3L18.5 10.7V4.4"/>
              <path d="M10.4 18.5h11.2"/>
              <circle cx="13" cy="22" r="1.05" fill="currentColor" stroke="none"/>
              <circle cx="17.4" cy="21.4" r="1.05" fill="currentColor" stroke="none"/>
              <circle cx="15.4" cy="24.2" r="1.05" fill="currentColor" stroke="none"/>
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div
              className="font-[800] text-[19px] leading-[1.1] tracking-[-0.01em] truncate"
              style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)", color: "var(--on-dark)" }}
            >
              Brownie Lab
            </div>
            <div
              className="text-[11px] font-[600] uppercase tracking-[0.14em] mt-0.5"
              style={{ color: "var(--amber)" }}
            >
              Panel Admin
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden flex-none p-1 rounded-lg transition-colors"
            style={{ color: "var(--on-dark-soft)" }}
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-[14px] py-[16px] flex flex-col gap-[3px]">
          {NAV_ITEMS.map(({ href, label, icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-[13px] px-[14px] py-[11px] rounded-[10px] text-[14.5px] font-[500] transition-all duration-150"
                style={isActive ? {
                  background: "var(--orange)",
                  color: "#fff",
                  boxShadow: "0 6px 16px rgba(217,113,30,.34)",
                } : {
                  color: "var(--on-dark-soft)",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(246,234,212,.06)";
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--on-dark)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "";
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--on-dark-soft)";
                  }
                }}
              >
                <NavIcon id={icon} />
                <span className="flex-1">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div
          className="px-[22px] py-[14px] text-[12px] flex-shrink-0"
          style={{ borderTop: "1px solid var(--hairline-dark)", color: "rgba(205,183,154,.6)" }}
        >
          v1.0 — Brownie Lab
        </div>
      </aside>
    </>
  );
}
