'use client';

import { useState, useTransition, useEffect } from 'react';
import { buscarCliente } from '@/actions/fidelizacion';
import type { ClienteFidelizacion, CuponFidelizacion } from '@/actions/fidelizacion';
import { Copy, Check, Loader2, ChevronRight, Award, Share, Smartphone } from 'lucide-react';

// ── Detección de plataforma ───────────────────────────────────────────────────

type Plataforma = 'android' | 'ios' | 'desktop';

function detectarPlataforma(): Plataforma {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  return 'desktop';
}

// ── Stamp grid ────────────────────────────────────────────────────────────────

function SelloGrid({ actual }: { actual: number }) {
  return (
    <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
      {Array.from({ length: 10 }, (_, i) => {
        const ganado = i < actual;
        return (
          <div
            key={i}
            className={`
              aspect-square rounded-full flex items-center justify-center
              text-xl sm:text-2xl transition-all duration-500
              ${ganado
                ? 'bg-amber-700 shadow-lg shadow-amber-700/40 scale-105 ring-2 ring-amber-400/50'
                : 'bg-stone-100 border-2 border-dashed border-stone-300'
              }
            `}
          >
            {ganado
              ? <span role="img" aria-label="sello ganado">🍪</span>
              : <span className="text-xs font-semibold text-stone-400">{i + 1}</span>
            }
          </div>
        );
      })}
    </div>
  );
}

// ── Barra de progreso ─────────────────────────────────────────────────────────

function BarraProgreso({ actual }: { actual: number }) {
  const pct = Math.min((actual / 10) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-stone-500">
        <span>{actual} de 10 sellos</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Botón copiar ──────────────────────────────────────────────────────────────

function BotonCopiar({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <button
      onClick={copiar}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
        transition-all duration-200
        ${copiado
          ? 'bg-green-100 text-green-700'
          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
        }
      `}
    >
      {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copiado ? 'Copiado' : 'Copiar'}
    </button>
  );
}

// ── Sección de guardado — diferente por plataforma ───────────────────────────

function SeccionGuardar({ telefono, plataforma }: { telefono: string; plataforma: Plataforma }) {
  if (plataforma === 'android') {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5" />
          Guarda tu tarjeta digital
        </p>

        {/* Google Wallet — solo Android */}
        <a
          href={`/api/wallet/google/${telefono}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-stone-200 text-stone-800 rounded-xl px-4 py-3 hover:border-stone-300 hover:bg-stone-50 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <div className="text-left leading-tight">
            <p className="text-[10px] text-stone-500">Añadir a</p>
            <p className="text-sm font-semibold">Google Wallet</p>
          </div>
        </a>

        <p className="text-center text-xs text-stone-400">
          O guarda esta página en tu navegador
        </p>
      </div>
    );
  }

  if (plataforma === 'ios') {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 space-y-1.5">
        <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
          <Share className="w-3.5 h-3.5" />
          Añade esta página a tu pantalla de inicio
        </p>
        <p className="text-xs text-blue-600 leading-relaxed">
          Toca <strong>Compartir</strong> en Safari → <strong>"Añadir a pantalla de inicio"</strong> para acceder rápido a tu tarjeta de sellos.
        </p>
      </div>
    );
  }

  // Desktop
  return (
    <div className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 space-y-1">
      <p className="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
        <Smartphone className="w-3.5 h-3.5" />
        Accede desde tu móvil
      </p>
      <p className="text-xs text-stone-500">
        Visita <strong>brownielabhn.com</strong> desde tu teléfono para guardar la tarjeta en Google Wallet (Android) o en pantalla de inicio (iPhone).
      </p>
    </div>
  );
}

// ── Tarjeta activa ────────────────────────────────────────────────────────────

function TarjetaActiva({
  cliente,
  cupones,
  plataforma,
  onReset,
}: {
  cliente: ClienteFidelizacion;
  cupones: CuponFidelizacion[];
  plataforma: Plataforma;
  onReset: () => void;
}) {
  const sellosRestantes = 10 - cliente.compras_actuales;

  return (
    <div className="space-y-5">
      {/* Encabezado cliente */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-stone-800 text-lg">
            {cliente.nombre || 'Bienvenido/a'}
          </p>
          <p className="text-stone-400 text-sm">{cliente.telefono}</p>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2"
        >
          Cambiar
        </button>
      </div>

      {/* Banner de premio */}
      {cupones.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <Award className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">¡Tienes un premio disponible!</p>
            <p className="text-amber-600 text-xs mt-0.5">Usa tu cupón en el siguiente pedido</p>
          </div>
        </div>
      )}

      {/* Tarjeta visual de sellos — EL activo digital para iOS/Desktop */}
      <div className="bg-gradient-to-br from-amber-800 to-stone-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <p className="text-amber-300 text-xs font-semibold uppercase tracking-widest">Club Brownie Lab</p>
          <span className="text-lg">🍫</span>
        </div>

        {/* Grid sobre fondo oscuro */}
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => {
            const ganado = i < cliente.compras_actuales;
            return (
              <div
                key={i}
                className={`
                  aspect-square rounded-full flex items-center justify-center text-base
                  transition-all duration-500
                  ${ganado
                    ? 'bg-amber-400 shadow-md shadow-amber-400/30'
                    : 'bg-white/10 border border-white/20'
                  }
                `}
              >
                {ganado
                  ? <span role="img" aria-label="sello">🍪</span>
                  : <span className="text-white/30 text-[10px] font-bold">{i + 1}</span>
                }
              </div>
            );
          })}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-wide">Progreso</p>
            <p className="text-white font-bold text-xl">{cliente.compras_actuales}<span className="text-white/40 text-sm font-normal"> / 10</span></p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-[10px] uppercase tracking-wide">
              {sellosRestantes === 0 ? 'Premio' : 'Faltan'}
            </p>
            <p className="text-amber-300 font-semibold text-sm">
              {sellosRestantes === 0 ? '¡Disponible!' : `${sellosRestantes} más`}
            </p>
          </div>
        </div>

        <div className="pt-1 border-t border-white/10">
          <p className="text-white/40 text-[10px]">{cliente.telefono} · brownielabhn.com</p>
        </div>
      </div>

      {/* Guardar — diferente por plataforma */}
      <SeccionGuardar telefono={cliente.telefono} plataforma={plataforma} />

      {/* Cupones */}
      {cupones.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Cupones disponibles
          </p>
          <div className="space-y-2">
            {cupones.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-mono font-bold text-amber-800 text-sm tracking-widest">
                    {c.codigo_unico}
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">1 brownie gratis</p>
                </div>
                <BotonCopiar codigo={c.codigo_unico} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

type Estado =
  | { tipo: 'idle' }
  | { tipo: 'found'; cliente: ClienteFidelizacion; cupones: CuponFidelizacion[] }
  | { tipo: 'error'; mensaje: string };

export default function LoyaltySection({ onClienteFound }: { onClienteFound?: (sellos: number) => void } = {}) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'idle' });
  const [telefono, setTelefono] = useState('');
  const [plataforma, setPlataforma] = useState<Plataforma>('desktop');
  const [isPending, startTransition] = useTransition();

  // Detectar plataforma client-side (navigator no existe en SSR)
  useEffect(() => {
    setPlataforma(detectarPlataforma());
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!telefono.trim()) return;

    startTransition(async () => {
      const result = await buscarCliente(telefono);
      if (result.success) {
        setEstado({ tipo: 'found', cliente: result.data.cliente, cupones: result.data.cupones });
        onClienteFound?.(result.data.cliente.compras_actuales);
      } else {
        setEstado({ tipo: 'error', mensaje: result.error });
      }
    });
  }

  function handleReset() {
    setEstado({ tipo: 'idle' });
    setTelefono('');
    onClienteFound?.(4);
  }

  return (
    <section className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="inline-block text-3xl mb-2">🍫</span>
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-800">Club Brownie Lab</h2>
        <p className="text-stone-500 mt-1.5 text-sm max-w-xs mx-auto">
          Acumula sellos con cada compra y gana un brownie gratis al llegar a 10
        </p>
      </div>

      {/* Tarjeta contenedor */}
      <div className="max-w-sm mx-auto bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-100 overflow-hidden">
        {/* Franja superior brand */}
        <div className="h-2 bg-gradient-to-r from-amber-800 via-amber-600 to-amber-400" />

        <div className="p-6">
          {/* idle → input teléfono */}
          {estado.tipo === 'idle' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-center text-stone-600 text-sm">
                Ingresa tu teléfono para ver tus sellos
              </p>

              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 9999-1234"
                inputMode="tel"
                className="w-full border-2 border-stone-200 focus:border-amber-500 rounded-2xl px-4 py-3.5 text-center text-stone-800 font-mono text-lg tracking-widest placeholder:text-stone-300 placeholder:text-base placeholder:tracking-normal focus:outline-none transition-colors"
              />

              <button
                type="submit"
                disabled={isPending || !telefono.trim()}
                className="w-full flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition-colors"
              >
                {isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Consultando…</>
                  : <><ChevronRight className="w-4 h-4" /> Ver mis sellos</>
                }
              </button>

              <p className="text-center text-xs text-stone-400">
                Sin cuenta ni contraseña — solo tu número
              </p>
            </form>
          )}

          {/* error */}
          {estado.tipo === 'error' && (
            <div className="space-y-4 text-center">
              <div className="bg-stone-50 rounded-2xl p-6">
                <p className="text-4xl mb-3">🍪</p>
                <p className="text-stone-600 text-sm">{estado.mensaje}</p>
              </div>
              <button
                onClick={handleReset}
                className="w-full border-2 border-stone-200 hover:border-stone-300 text-stone-600 font-medium py-3 rounded-2xl transition-colors text-sm"
              >
                Intentar con otro número
              </button>
            </div>
          )}

          {/* found → tarjeta completa */}
          {estado.tipo === 'found' && (
            <TarjetaActiva
              cliente={estado.cliente}
              cupones={estado.cupones}
              plataforma={plataforma}
              onReset={handleReset}
            />
          )}
        </div>

        <div className="px-6 pb-5 text-center">
          <p className="text-xs text-stone-300">brownielabhn.com · Club de fidelización</p>
        </div>
      </div>
    </section>
  );
}
