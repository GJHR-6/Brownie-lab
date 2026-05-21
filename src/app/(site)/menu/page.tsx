import { getProductosPublicos, getCategoriasPublicas } from "@/lib/data";
import MenuClient from "./MenuClient";

export const revalidate = 60;

export default async function MenuPage() {
  const [productos, categorias] = await Promise.all([
    getProductosPublicos(),
    getCategoriasPublicas(),
  ]);
  return <MenuClient productos={productos} categorias={categorias} />;
}
