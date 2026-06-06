import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menú",
  description: "Explora nuestra selección de brownies y galletas artesanales. Pedidos con 24 horas de anticipación en Honduras.",
  openGraph: {
    title: "Menú — Brownie Lab",
    description: "Brownies densos, galletas crujientes y especiales de temporada. Hechos a mano con ingredientes reales.",
  },
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
