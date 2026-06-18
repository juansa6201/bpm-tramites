import type { InternalUser } from '@/types/auth';

// Claves de localStorage. Mantenerlas acá las hace la única fuente de verdad:
// AuthContext y api-client leen/escriben por estas funciones, sin duplicar strings.
const TOKEN_KEY = 'bpm.interno.token';
const USER_KEY = 'bpm.interno.user';

export interface StoredAuth {
  token: string;
  user: InternalUser;
}

/** Lee la sesión persistida. Devuelve null en SSR o si no hay datos válidos. */
export function loadStoredAuth(): StoredAuth | null {
  if (typeof window === 'undefined') return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  const rawUser = window.localStorage.getItem(USER_KEY);
  if (!token || !rawUser) return null;
  try {
    return { token, user: JSON.parse(rawUser) as InternalUser };
  } catch {
    return null;
  }
}

export function saveStoredAuth(auth: StoredAuth): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, auth.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

/** Solo el token (lo usa el api-client en cada request). */
export function loadToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
