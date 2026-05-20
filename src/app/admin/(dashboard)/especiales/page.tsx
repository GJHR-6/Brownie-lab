import { getEspeciales } from '@/actions/especiales';
import EspecialesClient from './EspecialesClient';

export default async function EspecialesPage() {
  const especiales = await getEspeciales();
  return <EspecialesClient initialEspeciales={especiales} />;
}
