import { apiClient } from './api-client';
import type {
  Area,
  Comentario,
  CrearTramiteBody,
  CrearTramiteResult,
  Paginated,
  TramiteDetalle,
  TramiteListItem,
  TramitesFilters,
  TramiteTransicionResult,
  Visibilidad,
} from '@/types/tramite';
import type { UsuarioExterno } from '@/types/config';

/**
 * Lista trámites (bandeja). notifyOnError:false porque la tabla muestra su propio
 * estado de error inline con "Reintentar" (evitamos el snackbar duplicado). Un 401
 * igual dispara el logout (eso no depende de notifyOnError).
 */
export function listTramites(
  f: TramitesFilters,
  signal?: AbortSignal,
): Promise<Paginated<TramiteListItem>> {
  const qs = new URLSearchParams();
  if (f.estado) qs.set('estado', f.estado);
  if (f.prioridad) qs.set('prioridad', f.prioridad);
  if (f.origen) qs.set('origen', f.origen);
  if (f.areaActualId) qs.set('areaActualId', f.areaActualId);
  // El input date da 'YYYY-MM-DD'. Mandamos límites UTC explícitos para que el
  // rango sea inclusivo del día completo (mismo criterio UTC que el dashboard).
  if (f.creadoDesde) qs.set('creadoDesde', `${f.creadoDesde}T00:00:00.000Z`);
  if (f.creadoHasta) qs.set('creadoHasta', `${f.creadoHasta}T23:59:59.999Z`);
  qs.set('page', String(f.page));
  qs.set('pageSize', String(f.pageSize));
  return apiClient.get<Paginated<TramiteListItem>>(`/tramites?${qs.toString()}`, {
    notifyOnError: false,
    signal,
  });
}

export function listAreas(signal?: AbortSignal): Promise<Area[]> {
  return apiClient.get<Area[]>('/areas', { notifyOnError: false, signal });
}

/** Usuarios externos activos (para designar el externo en un trámite Interno→Externo). */
export function listUsuariosExternos(signal?: AbortSignal): Promise<UsuarioExterno[]> {
  return apiClient.get<UsuarioExterno[]>('/usuarios-externos', { notifyOnError: false, signal });
}

/** Crea un trámite. notifyOnError por defecto: un 422 (ej: tipo inactivo) se muestra. */
export function crearTramite(body: CrearTramiteBody): Promise<CrearTramiteResult> {
  return apiClient.post<CrearTramiteResult>('/tramites', body);
}

/** Detalle del trámite con timeline + accionesPermitidas. Error inline (sin snackbar). */
export function getTramite(id: string, signal?: AbortSignal): Promise<TramiteDetalle> {
  return apiClient.get<TramiteDetalle>(`/tramites/${id}`, { notifyOnError: false, signal });
}

export function listComentarios(id: string, signal?: AbortSignal): Promise<Comentario[]> {
  return apiClient.get<Comentario[]>(`/tramites/${id}/comentarios`, {
    notifyOnError: false,
    signal,
  });
}

export function addComentario(
  id: string,
  mensaje: string,
  visibilidad: Visibilidad,
): Promise<Comentario> {
  return apiClient.post<Comentario>(`/tramites/${id}/comentarios`, { mensaje, visibilidad });
}

/**
 * Ejecuta una acción de workflow. Mantiene notifyOnError (snackbar) por defecto:
 * un 422/403 del backend se muestra tal cual (ej: transición inválida o sin permiso).
 */
export function ejecutarAccion(
  id: string,
  slug: string,
  body: { comentario?: string; areaNuevaId?: string },
): Promise<TramiteTransicionResult> {
  return apiClient.post<TramiteTransicionResult>(`/tramites/${id}/${slug}`, body);
}
