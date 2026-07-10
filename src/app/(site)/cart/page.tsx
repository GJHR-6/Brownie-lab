import PedidoFlow from "./PedidoFlow";
import { getCajaBuilderData } from "@/lib/cajaBuilderData";

export default async function CartPage() {
  const builderData = await getCajaBuilderData();
  return <PedidoFlow builderData={builderData} />;
}
