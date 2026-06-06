import { getActividad } from '@/actions/actividad';
import ActividadClient from './ActividadClient';

export default async function ActividadPage() {
  const logs = await getActividad(200);
  return <ActividadClient logs={logs} />;
}
