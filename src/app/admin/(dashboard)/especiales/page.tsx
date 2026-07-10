import { getEspeciales } from '@/actions/especiales';
import { getProductos } from '@/actions/productos';
import EspecialesClient from './EspecialesClient';

export default async function EspecialesPage() {
  const [especiales, productos] = await Promise.all([getEspeciales(), getProductos()]);
  const opciones = productos.map((p) => ({ id: p.id, nombre: p.nombre }));
  return <EspecialesClient initialEspeciales={especiales} productos={opciones} />;
}
