import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arma tu caja",
  description: "Elige el tamaño de tu caja, llénala con tus postres favoritos del menú o personalizados, y ahorra con el descuento por caja.",
  openGraph: {
    title: "Arma tu caja — Brownie Lab",
    description: "Cajas de postres a tu medida: combina del menú o personaliza cada uno, y ahorra.",
  },
};

export default function CajasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
