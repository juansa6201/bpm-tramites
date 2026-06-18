import { loadExternalToken, loadInternalToken } from './auth-storage';
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

/** Portal cuyo token se adjunta. Cada portal persiste su JWT por separado. */
export type AuthScope = 'interno' | 'externo';

export interface RequestOptions {
  /** Adjuntar el bearer token. Default true (poner false en el login/registro). */
  auth?: boolean;
  /** Qué token adjuntar (interno/externo). Default 'interno'. */
  scope?: AuthScope;
  /** Mostrar snackbar automático ante error. Default true. */
  notifyOnError?: boolean;
  signal?: AbortSignal;
}

// Cuerpo serializable. `unknown` (no Record<string,unknown>) para aceptar
// interfaces nombradas, que no tienen index signature implícita.
type JsonBody = unknown;

function authHeaders(scope: AuthScope): Record<string, string> {
  const token = scope === 'externo' ? loadExternalToken() : loadInternalToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
    case 413:
      return 'El archivo supera el tamaño máximo permitido.';
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

/** Falla de red: aborts se re-lanzan tal cual; el resto notifica y lanza ApiError(0). */
function networkError(err: unknown, notifyOnError: boolean): never {
  if (err instanceof DOMException && err.name === 'AbortError') throw err;
  if (notifyOnError) notify('No se pudo conectar con el servidor.', 'error');
  throw new ApiError(0, 'Network error');
}

/** Respuesta no-2xx: notifica/redirige según corresponda y lanza ApiError. */
async function fail(res: Response, auth: boolean, notifyOnError: boolean): Promise<never> {
  const payload = await parseBody(res);
  const message = extractMessage(payload, res.status);

  if (res.status === 401 && auth) {
    // Sesión expirada en una request autenticada: el AuthProvider del portal
    // activo limpia y redirige. Un 401 sin token (ej. login con credenciales
    // inválidas) NO es sesión expirada: cae al notify genérico.
    triggerUnauthorized();
    if (notifyOnError) notify('Tu sesión expiró. Iniciá sesión de nuevo.', 'warning');
  } else if (notifyOnError) {
    notify(message, variantFor(res.status));
  }

  throw new ApiError(res.status, message, payload);
}

async function request<T>(
  method: string,
  path: string,
  body?: JsonBody,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true, scope = 'interno', notifyOnError = true, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) Object.assign(headers, authHeaders(scope));

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    networkError(err, notifyOnError);
  }

  if (!res.ok) return fail(res, auth, notifyOnError);
  return (await parseBody(res)) as T;
}

/** Sube un archivo (multipart/form-data). NO setea Content-Type: el browser pone el boundary. */
async function upload<T>(
  path: string,
  formData: FormData,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true, scope = 'interno', notifyOnError = true, signal } = options;

  const headers: Record<string, string> = {};
  if (auth) Object.assign(headers, authHeaders(scope));

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: formData, signal });
  } catch (err) {
    networkError(err, notifyOnError);
  }

  if (!res.ok) return fail(res, auth, notifyOnError);
  return (await parseBody(res)) as T;
}

/** Descarga binaria: devuelve el Blob (el caller arma el filename para guardarlo). */
async function download(path: string, options: RequestOptions = {}): Promise<Blob> {
  const { auth = true, scope = 'interno', notifyOnError = true, signal } = options;

  const headers: Record<string, string> = {};
  if (auth) Object.assign(headers, authHeaders(scope));

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method: 'GET', headers, signal });
  } catch (err) {
    networkError(err, notifyOnError);
  }

  if (!res.ok) return fail(res, auth, notifyOnError);
  return res.blob();
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
  upload,
  download,
};
