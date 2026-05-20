import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tu Carrito" };

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
