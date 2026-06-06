import type { Metadata } from "next";
import { getConfiguracion } from "@/lib/data";
import { storeConfig } from "@/config/store";
import SeguimientoClient from "./SeguimientoClient";

export const metadata: Metadata = {
  title: "Seguimiento de pedido",
  description: "Consulta el estado de tu pedido en Brownie Lab ingresando tu número de teléfono.",
};

export default async function SeguimientoPage() {
  const config = await getConfiguracion();
  const whatsapp = config?.whatsapp || storeConfig.whatsapp;

  return <SeguimientoClient whatsapp={whatsapp} />;
}
