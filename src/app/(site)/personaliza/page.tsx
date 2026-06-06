import { getToppingsDinamicos } from "@/lib/data";
import PersonalizaClient from "./PersonalizaClient";

export default async function PersonalizaPage() {
  const toppingsDB = await getToppingsDinamicos();
  const toppings = toppingsDB.map(t => ({ name: t.nombre, price: t.precio_extra, imagen_url: t.imagen_url }));
  return <PersonalizaClient toppings={toppings} />;
}
