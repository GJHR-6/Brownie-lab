import { getDeliveryZonesAdmin } from '@/actions/deliveryZones';
import ZonasEnvioClient from './ZonasEnvioClient';

export default async function ZonasEnvioPage() {
  const zonas = await getDeliveryZonesAdmin();
  return <ZonasEnvioClient initialZonas={zonas} />;
}
