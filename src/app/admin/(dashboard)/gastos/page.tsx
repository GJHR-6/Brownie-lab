import { getGastos } from '@/actions/gastos';
import GastosClient from './GastosClient';

export default async function GastosPage() {
  const gastos = await getGastos();
  return <GastosClient initialGastos={gastos} />;
}
