import { loadToken } from './auth-storage';
import { notify, triggerUnauthorized } from './notifier';
import type { VariantType } from 'notistack';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

/** Error tipado que el api-client lanza ante respuestas no-2xx o fallos de red. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions {
  /** Adjuntar el bearer token. Default true (poner false en el login). */
  auth?: boolean;
  /** Mostrar snackbar automático ante error. Default true. */
  notifyOnError?: boolean;
  signal?: AbortSignal;
}

// Cuerpo serializable. `unknown` (no Record<string,unknown>) para aceptar
// interfaces nombradas, que no tienen index signature implícita.
type JsonBody = unknown;

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

/** Extrae el message del backend ({ message } o { message: string[] } de class-validator). */
function extractMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message: unknown }).message;
    if (Array.isArray(message)) {
      const joined = message.filter((m) => typeof m === 'string' && m).join(', ');
      if (joined) return joined;
    } else if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return defaultMessageFor(status);
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 400:
      return 'Solicitud inválida.';
    case 403:
      return 'No tenés permisos para esta acción.';
    case 404:
      return 'Recurso no encontrado.';
    case 409:
      return 'Conflicto con el estado actual del recurso.';
    case 422:
      return 'No se pudo procesar la operación.';
    default:
      return status >= 500 ? 'Error del servidor.' : 'Ocurrió un error.';
  }
}

/** 4xx de negocio → warning, el resto (red/5xx) → error. */
function variantFor(status: number): VariantType {
  return status >= 400 && status < 500 ? 'warning' : 'error';
}

async function request<T>(
  method: string,
  path: string,
  body?: JsonBody,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true, notifyOnError = true, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = loadToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    // Aborts no son errores a notificar: los re-lanzamos tal cual.
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    if (notifyOnError) notify('No se pudo conectar con el servidor.', 'error');
    throw new ApiError(0, 'Network error');
  }

  const payload = await parseBody(res);

  if (res.ok) return payload as T;

  const message = extractMessage(payload, res.status);

  if (res.status === 401 && auth) {
    // Sesión expirada en una request autenticada: el AuthProvider limpia y
    // redirige. Un 401 de una request sin token (ej. login con email inexistente)
    // NO es sesión expirada: cae al notify genérico con el message real del backend.
    triggerUnauthorized();
    if (notifyOnError) notify('Tu sesión expiró. Iniciá sesión de nuevo.', 'warning');
  } else if (notifyOnError) {
    notify(message, variantFor(res.status));
  }

  throw new ApiError(res.status, message, payload);
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: JsonBody, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: JsonBody, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: JsonBody, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
};
