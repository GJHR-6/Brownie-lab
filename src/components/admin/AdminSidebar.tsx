"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Settings,
  Cookie,
  Star,
  Megaphone,
  Tag,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin",               label: "Dashboard",     icon: LayoutDashboard, exact: true  },
  { href: "/admin/inventario",    label: "Inventario",    icon: Package,         exact: false },
  { href: "/admin/especiales",    label: "Especiales",    icon: Star,            exact: false },
  { href: "/admin/pedidos",       label: "Pedidos",       icon: ClipboardList,   exact: false },
  { href: "/admin/banners",       label: "Banners",       icon: Megaphone,       exact: false },
  { href: "/admin/promociones",   label: "Promociones",   icon: Tag,             exact: false },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings,        exact: false },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 bg-stone-900 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <Cookie className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-sm text-white truncate">Brownie Lab</p>
            <p className="text-xs text-stone-500">Panel Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-amber-500/15 text-amber-400"
                  : "text-stone-400 hover:text-white hover:bg-stone-800"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer del sidebar */}
      <div className="px-5 py-4 border-t border-stone-800">
        <p className="text-xs text-stone-600">v1.0 — Brownie Lab</p>
      </div>
    </aside>
  );
}
