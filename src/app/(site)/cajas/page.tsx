import type { Metadata } from "next";
import { getCajaBuilderData } from "@/lib/cajaBuilderData";
import CajasClient from "./CajasClient";

export const metadata: Metadata = {
  title: "Arma tu caja",
  description: "Elige el tamaño de tu caja y llénala con postres del menú o personalizados. Entre más grande la caja, más ahorras.",
  openGraph: {
    title: "Arma tu caja — Brownie Lab",
    description: "Cajas de postres a tu medida: combina del menú o personaliza cada uno, y ahorra.",
  },
};

export default async function CajasPage() {
  const data = await getCajaBuilderData();
  return <CajasClient data={data} />;
}
