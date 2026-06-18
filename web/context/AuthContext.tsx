'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { clearStoredAuth, loadStoredAuth, saveStoredAuth } from '@/lib/auth-storage';
import { registerUnauthorizedHandler } from '@/lib/notifier';
import type { InternalLoginResponse, InternalMeResponse, InternalUser } from '@/types/auth';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: InternalUser | null;
  token: string | null;
  status: AuthStatus;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<InternalUser | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  // Arranca en 'loading' para no parpadear ni romper la hidratación SSR.
  const [status, setStatus] = React.useState<AuthStatus>('loading');
  // Permite abortar la revalidación /me en vuelo (evita que reviva una sesión cerrada).
  const meAbortRef = React.useRef<AbortController | null>(null);

  const logout = React.useCallback(() => {
    meAbortRef.current?.abort();
    clearStoredAuth();
    setUser(null);
    setToken(null);
    setStatus('unauthenticated');
    router.replace('/interno/login');
  }, [router]);

  // Hidratación inicial desde localStorage + revalidación del token con /me.
  React.useEffect(() => {
    const stored = loadStoredAuth();
    if (!stored) {
      setStatus('unauthenticated');
      return;
    }
    setUser(stored.user);
    setToken(stored.token);
    setStatus('authenticated');

    // Revalida en silencio. El controller se aborta en logout/unmount: si la
    // sesión se cierra mientras /me está en vuelo, su respuesta NO repuebla el
    // estado ni el localStorage, así que no resucita la sesión.
    const controller = new AbortController();
    meAbortRef.current = controller;
    apiClient
      .get<InternalMeResponse>('/auth/internal/me', {
        notifyOnError: false,
        signal: controller.signal,
      })
      .then((me) => {
        if (controller.signal.aborted) return;
        // /me no trae nombre: lo conservamos del storage y completamos rol/areaId.
        const merged: InternalUser = {
          ...stored.user,
          email: me && typeof me.email === 'string' ? me.email : stored.user.email,
          rol: me?.rol ?? stored.user.rol,
          areaId: me?.areaId ?? stored.user.areaId,
        };
        setUser(merged);
        saveStoredAuth({ token: stored.token, user: merged });
      })
      .catch(() => {
        /* 401 ya lo maneja el unauthorized handler; abort y otros errores se ignoran. */
      });

    return () => {
      controller.abort();
    };
  }, []);

  // El api-client avisa de los 401 a través de este handler.
  React.useEffect(() => {
    registerUnauthorizedHandler(logout);
  }, [logout]);

  const login = React.useCallback(async (email: string) => {
    const res = await apiClient.post<InternalLoginResponse>(
      '/auth/internal/login',
      { email },
      { auth: false },
    );
    const nextUser: InternalUser = {
      id: res.usuario.id,
      nombre: res.usuario.nombre,
      email: res.usuario.email,
      rol: res.usuario.rol,
      tipo: res.usuario.tipo,
    };
    saveStoredAuth({ token: res.accessToken, user: nextUser });
    setUser(nextUser);
    setToken(res.accessToken);
    setStatus('authenticated');
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, token, status, login, logout }),
    [user, token, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
