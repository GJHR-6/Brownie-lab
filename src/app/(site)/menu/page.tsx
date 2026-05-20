import { getProductosPublicos } from "@/lib/data";
import MenuClient from "./MenuClient";

export const revalidate = 60;

export default async function MenuPage() {
  const productos = await getProductosPublicos();
  return <MenuClient productos={productos} />;
}
