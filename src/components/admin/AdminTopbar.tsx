"use client";

import { LogOut, Menu } from "lucide-react";
import { logout } from "@/actions/auth";

interface AdminTopbarProps {
  userEmail: string;
  onMenuToggle: () => void;
}

export default function AdminTopbar({ userEmail, onMenuToggle }: AdminTopbarProps) {
  return (
    <header className="h-14 bg-white border-b border-stone-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 -ml-1 text-stone-500 hover:text-stone-800 transition-colors rounded-lg hover:bg-stone-100"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        <span className="text-sm text-stone-400 hidden sm:block truncate max-w-[180px]">
          {userEmail}
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </form>
      </div>
    </header>
  );
}
