import { getResenasAdmin } from '@/actions/resenas';
import ResenasClient from './ResenasClient';

export default async function ResenasPage() {
  const resenas = await getResenasAdmin();
  return <ResenasClient initialResenas={resenas} />;
}
