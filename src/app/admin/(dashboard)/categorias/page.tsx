import { getCategorias } from '@/actions/categorias';
import CategoriasClient from './CategoriasClient';

export default async function CategoriasPage() {
  const categorias = await getCategorias();
  return <CategoriasClient initialCategorias={categorias} />;
}
