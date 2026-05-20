import { getPromociones } from '@/actions/promociones';
import PromocionesClient from './PromocionesClient';

export default async function PromocionesPage() {
  const promociones = await getPromociones();
  return <PromocionesClient initialPromociones={promociones} />;
}
