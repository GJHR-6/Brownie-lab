import { redirect } from 'next/navigation';

// Fidelización se fusionó con Clientes: sellos, cupones, compra manual y
// fusión de números viven ahora en el drawer de cada cliente.
export default function FidelizacionPage() {
  redirect('/admin/clientes');
}
