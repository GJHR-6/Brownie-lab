import { getVariantes } from '@/actions/personaliza';
import PersonalizaAdminClient from './PersonalizaAdminClient';

export const metadata = { title: 'Armador — Admin' };

export default async function PersonalizaAdminPage() {
  const variantes = await getVariantes();
  return <PersonalizaAdminClient initialVariantes={variantes} />;
}
