import type { ExternalUser, InternalUser } from '@/types/auth';

// Claves de localStorage. Mantenerlas acá las hace la única fuente de verdad:
// los contexts y el api-client leen/escriben por estas funciones, sin duplicar
// strings. Los portales interno y externo usan NAMESPACES separados, así sus
// sesiones (y sus JWT) conviven sin pisarse.
const INTERNAL_TOKEN_KEY = 'bpm.interno.token';
const INTERNAL_USER_KEY = 'bpm.interno.user';
const EXTERNAL_TOKEN_KEY = 'bpm.externo.token';
const EXTERNAL_USER_KEY = 'bpm.externo.user';

export interface StoredAuth {
  token: string;
  user: InternalUser;
}

export interface StoredExternalAuth {
  token: string;
  user: ExternalUser;
}

// ------------------------------- INTERNO -------------------------------

/** Lee la sesión interna persistida. Devuelve null en SSR o si no hay datos válidos. */
export function loadStoredAuth(): StoredAuth | null {
  if (typeof window === 'undefined') return null;
  const token = window.localStorage.getItem(INTERNAL_TOKEN_KEY);
  const rawUser = window.localStorage.getItem(INTERNAL_USER_KEY);
  if (!token || !rawUser) return null;
  try {
    return { token, user: JSON.parse(rawUser) as InternalUser };
  } catch {
    return null;
  }
}

export function saveStoredAuth(auth: StoredAuth): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(INTERNAL_TOKEN_KEY, auth.token);
  window.localStorage.setItem(INTERNAL_USER_KEY, JSON.stringify(auth.user));
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(INTERNAL_TOKEN_KEY);
  window.localStorage.removeItem(INTERNAL_USER_KEY);
}

/** Solo el token interno (lo usa el api-client en requests con scope interno). */
export function loadInternalToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(INTERNAL_TOKEN_KEY);
}

// ------------------------------- EXTERNO -------------------------------

/** Lee la sesión externa persistida. Devuelve null en SSR o si no hay datos válidos. */
export function loadExternalAuth(): StoredExternalAuth | null {
  if (typeof window === 'undefined') return null;
  const token = window.localStorage.getItem(EXTERNAL_TOKEN_KEY);
  const rawUser = window.localStorage.getItem(EXTERNAL_USER_KEY);
  if (!token || !rawUser) return null;
  try {
    return { token, user: JSON.parse(rawUser) as ExternalUser };
  } catch {
    return null;
  }
}

export function saveExternalAuth(auth: StoredExternalAuth): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(EXTERNAL_TOKEN_KEY, auth.token);
  window.localStorage.setItem(EXTERNAL_USER_KEY, JSON.stringify(auth.user));
}

export function clearExternalAuth(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(EXTERNAL_TOKEN_KEY);
  window.localStorage.removeItem(EXTERNAL_USER_KEY);
}

/** Solo el token externo (lo usa el api-client en requests con scope externo). */
export function loadExternalToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(EXTERNAL_TOKEN_KEY);
}
