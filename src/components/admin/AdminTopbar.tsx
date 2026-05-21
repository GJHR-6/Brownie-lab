import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";

interface AdminTopbarProps {
  userEmail: string;
}

export default function AdminTopbar({ userEmail }: AdminTopbarProps) {
  return (
    <header className="h-14 bg-white border-b border-stone-200 flex items-center justify-between px-6 flex-shrink-0">
      <div />
      <div className="flex items-center gap-5">
        <span className="text-sm text-stone-400 hidden sm:block">{userEmail}</span>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </header>
  );
}
