import { getVariantes } from '@/actions/personaliza';
import { getCajasAdmin } from '@/actions/cajas';
import ArmadorTabs from './ArmadorTabs';

export const metadata = { title: 'Armador — Admin' };

export default async function PersonalizaAdminPage() {
  const [variantes, cajas] = await Promise.all([getVariantes(), getCajasAdmin()]);
  return <ArmadorTabs variantes={variantes} cajas={cajas} />;
}
