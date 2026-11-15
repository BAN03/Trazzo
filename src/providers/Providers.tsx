'use client';

import { ReactNode, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../hooks/useAuthStore';
import { useDatabase } from '../hooks/useDatabase';

/**
 * Sincroniza al usuario autenticado con SQLite. Así cualquier pantalla puede
 * insertar ventas/productos sin violar las llaves foráneas.
 */
export function Providers({ children }: { children: ReactNode }) {
  const { user, hasHydrated } = useAuthStore();
  const db = useDatabase();

  useEffect(() => {
    if (!hasHydrated || !user || !db.initialized) return;
    db.ensureAuthUser(user);
  }, [hasHydrated, user, db]);

  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}
