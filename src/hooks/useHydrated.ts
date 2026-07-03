'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * true una vez hidratado en el cliente, false durante SSR/hidratación.
 * Reemplaza el patrón `useEffect(() => setMounted(true), [])` sin el
 * render doble que ese patrón provoca.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
