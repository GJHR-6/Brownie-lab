import type { Metadata } from "next";
import { getProductosPublicos } from "@/lib/data";
import FavoritosClient from "./FavoritosClient";

export const metadata: Metadata = {
  title: "Mis favoritos",
  description: "Tus productos guardados de Brownie Lab.",
};

export default async function FavoritosPage() {
  const productos = await getProductosPublicos();
  return <FavoritosClient productos={productos} />;
}
