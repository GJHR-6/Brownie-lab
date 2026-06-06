import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arma tu postre",
  description: "Personaliza tu brownie o galleta con los toppings que quieras. Ve cómo queda en tiempo real y agrégalo al carrito.",
  openGraph: {
    title: "Arma tu postre — Brownie Lab",
    description: "Elige la base, agrega toppings y mira tu postre cobrar forma. Personalización interactiva en Brownie Lab.",
  },
};

export default function PersonalizaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
