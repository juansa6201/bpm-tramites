'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { clearExternalAuth, loadExternalAuth, saveExternalAuth } from '@/lib/auth-storage';
import { getExternalMe, loginExternal } from '@/lib/auth-externos';
import { registerUnauthorizedHandler } from '@/lib/notifier';
import type { ExternalUser } from '@/types/auth';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface ExternalAuthContextValue {
  user: ExternalUser | null;
  token: string | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const ExternalAuthContext = React.createContext<ExternalAuthContextValue | undefined>(undefined);

export function ExternalAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<ExternalUser | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  // Arranca en 'loading' para no parpadear ni romper la hidratación SSR.
  const [status, setStatus] = React.useState<AuthStatus>('loading');
  // Permite abortar la revalidación /me en vuelo (evita revivir una sesión cerrada).
  const meAbortRef = React.useRef<AbortController | null>(null);

  const logout = React.useCallback(() => {
    meAbortRef.current?.abort();
    clearExternalAuth();
    setUser(null);
    setToken(null);
    setStatus('unauthenticated');
    router.replace('/externo/login');
  }, [router]);

  // Hidratación inicial desde localStorage + revalidación del token con /auth/me.
  React.useEffect(() => {
    const stored = loadExternalAuth();
    if (!stored) {
      setStatus('unauthenticated');
      return;
    }
    setUser(stored.user);
    setToken(stored.token);
    setStatus('authenticated');

    // Revalida en silencio. Si la sesión se cierra mientras /me está en vuelo,
    // el abort evita que su respuesta repueble el estado y resucite la sesión.
    const controller = new AbortController();
    meAbortRef.current = controller;
    getExternalMe(controller.signal)
      .then((me) => {
        if (controller.signal.aborted) return;
        const merged: ExternalUser = {
          ...stored.user,
          email: me && typeof me.email === 'string' ? me.email : stored.user.email,
        };
        setUser(merged);
        saveExternalAuth({ token: stored.token, user: merged });
      })
      .catch(() => {
        /* 401 lo maneja el unauthorized handler; abort y otros errores se ignoran. */
      });

    return () => {
      controller.abort();
    };
  }, []);

  // El api-client avisa de los 401 a través de este handler.
  React.useEffect(() => {
    registerUnauthorizedHandler(logout);
  }, [logout]);

  const login = React.useCallback(async (email: string, password: string) => {
    const res = await loginExternal(email, password);
    const nextUser: ExternalUser = {
      id: res.usuario.id,
      nombre: res.usuario.nombre,
      email: res.usuario.email,
      tipo: res.usuario.tipo,
    };
    saveExternalAuth({ token: res.accessToken, user: nextUser });
    setUser(nextUser);
    setToken(res.accessToken);
    setStatus('authenticated');
  }, []);

  const value = React.useMemo<ExternalAuthContextValue>(
    () => ({ user, token, status, login, logout }),
    [user, token, status, login, logout],
  );

  return <ExternalAuthContext.Provider value={value}>{children}</ExternalAuthContext.Provider>;
}

export function useExternalAuth(): ExternalAuthContextValue {
  const ctx = React.useContext(ExternalAuthContext);
  if (!ctx) throw new Error('useExternalAuth debe usarse dentro de <ExternalAuthProvider>');
  return ctx;
}
