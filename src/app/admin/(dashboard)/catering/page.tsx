import { getCateringSolicitudesAdmin } from '@/actions/catering';
import CateringClient from './CateringClient';

export default async function CateringPage() {
  const solicitudes = await getCateringSolicitudesAdmin();
  return <CateringClient initialSolicitudes={solicitudes} />;
}
