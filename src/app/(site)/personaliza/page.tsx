import { getToppingsDinamicos } from "@/lib/data";
import PersonalizaClient from "./PersonalizaClient";

export default async function PersonalizaPage() {
  const toppingsDB = await getToppingsDinamicos();
  const toppings = toppingsDB.map(t => ({ name: t.nombre, price: t.precio_extra }));
  return <PersonalizaClient toppings={toppings} />;
}
