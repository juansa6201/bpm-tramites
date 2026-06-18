import { apiClient } from './api-client';
import type {
  ExternalLoginResponse,
  ExternalMeResponse,
  RegisterExternalResult,
} from '@/types/auth';

export interface RegisterExternalBody {
  nombre: string;
  email: string;
  documento: string;
  organizacion?: string;
  password: string;
}

/**
 * Alta de un externo. La cuenta nace PENDIENTE_VERIFICACION (no devuelve token):
 * se activa aparte antes de poder loguear.
 */
export function registerExternal(body: RegisterExternalBody): Promise<RegisterExternalResult> {
  return apiClient.post<RegisterExternalResult>('/auth/external/register', body, { auth: false });
}

/** Login externo: devuelve el JWT externo + datos del usuario. */
export function loginExternal(email: string, password: string): Promise<ExternalLoginResponse> {
  return apiClient.post<ExternalLoginResponse>(
    '/auth/external/login',
    { email, password },
    { auth: false },
  );
}

/** Revalida el token externo. Scope externo para adjuntar el JWT correcto. */
export function getExternalMe(signal?: AbortSignal): Promise<ExternalMeResponse> {
  return apiClient.get<ExternalMeResponse>('/auth/me', {
    scope: 'externo',
    notifyOnError: false,
    signal,
  });
}
