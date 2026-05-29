import { getIngredientes } from '@/actions/ingredientes';
import IngredientesClient from './IngredientesClient';

export default async function IngredientesPage() {
  const ingredientes = await getIngredientes();
  return <IngredientesClient initialIngredientes={ingredientes} />;
}
