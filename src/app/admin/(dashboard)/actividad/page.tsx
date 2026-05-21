import { getActividad } from '@/actions/actividad';
import { Clock, Package, ShoppingBag, Settings, User } from 'lucide-react';

const TIPO_ICON: Record<string, React.ReactNode> = {
  producto: <Package className="w-4 h-4 text-blue-500" />,
  pedido:   <ShoppingBag className="w-4 h-4 text-amber-500" />,
  config:   <Settings className="w-4 h-4 text-purple-500" />,
  auth:     <User className="w-4 h-4 text-green-500" />,
};

export default async function ActividadPage() {
  const logs = await getActividad(200);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Registro de actividad</h1>
        <p className="text-stone-500 text-sm mt-0.5">{logs.length} eventos recientes</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {logs.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-16">Sin actividad registrada.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-stone-50/70 transition-colors">
                <div className="mt-0.5 flex-shrink-0">
                  {TIPO_ICON[log.tipo] ?? <Clock className="w-4 h-4 text-stone-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-800">{log.descripcion}</p>
                  {log.usuario_email && (
                    <p className="text-xs text-stone-400 mt-0.5">{log.usuario_email}</p>
                  )}
                </div>
                <p className="text-xs text-stone-400 flex-shrink-0 mt-0.5">
                  {new Date(log.created_at).toLocaleString('es-HN', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
