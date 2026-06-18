import { apiClient } from './api-client';
import type {
  Comentario,
  CrearTramiteResult,
  Documento,
  Paginated,
  PrioridadTramite,
  TramiteDetalle,
  TramiteListItem,
  TramiteTransicionResult,
} from '@/types/tramite';
import type { TipoTramite } from '@/types/config';

// Todas las llamadas del portal externo adjuntan el JWT externo (scope).
const EXT = { scope: 'externo' as const };

export interface CrearTramiteExternoBody {
  tipoTramiteId: string;
  titulo: string;
  descripcion: string;
  prioridad?: PrioridadTramite;
}

/**
 * Mis trámites: el backend FUERZA usuarioExternoId = yo, así que esto ya trae
 * solo los propios. El externo maneja pocos, traemos una página amplia.
 */
export function misTramites(signal?: AbortSignal): Promise<Paginated<TramiteListItem>> {
  return apiClient.get<Paginated<TramiteListItem>>('/tramites?page=1&pageSize=100', {
    ...EXT,
    notifyOnError: false,
    signal,
  });
}

/** Tipos que el externo puede iniciar (activos + permiteInicioExterno). */
export function tiposIniciables(signal?: AbortSignal): Promise<TipoTramite[]> {
  return apiClient.get<TipoTramite[]>('/tipos-tramite/iniciables-externos', {
    ...EXT,
    notifyOnError: false,
    signal,
  });
}

/** Crea un trámite Externo→Interno. El server fuerza el origen y el usuarioExterno. */
export function crearTramiteExterno(body: CrearTramiteExternoBody): Promise<CrearTramiteResult> {
  return apiClient.post<CrearTramiteResult>(
    '/tramites',
    { ...body, origen: 'EXTERNO_INTERNO' },
    EXT,
  );
}

export function getTramiteExterno(id: string, signal?: AbortSignal): Promise<TramiteDetalle> {
  return apiClient.get<TramiteDetalle>(`/tramites/${id}`, { ...EXT, notifyOnError: false, signal });
}

export function listComentariosExterno(id: string, signal?: AbortSignal): Promise<Comentario[]> {
  return apiClient.get<Comentario[]>(`/tramites/${id}/comentarios`, {
    ...EXT,
    notifyOnError: false,
    signal,
  });
}

/** El externo no puede usar INTERNA: omitimos visibilidad y el backend usa TODOS. */
export function addComentarioExterno(id: string, mensaje: string): Promise<Comentario> {
  return apiClient.post<Comentario>(`/tramites/${id}/comentarios`, { mensaje }, EXT);
}

export function ejecutarAccionExterna(
  id: string,
  slug: string,
  body: { comentario?: string },
): Promise<TramiteTransicionResult> {
  return apiClient.post<TramiteTransicionResult>(`/tramites/${id}/${slug}`, body, EXT);
}

export function listDocumentosExterno(id: string, signal?: AbortSignal): Promise<Documento[]> {
  return apiClient.get<Documento[]>(`/tramites/${id}/documentos`, {
    ...EXT,
    notifyOnError: false,
    signal,
  });
}

/** Sube un archivo. La visibilidad va como query (el externo comparte con TODOS). */
export function subirDocumentoExterno(id: string, file: File): Promise<Documento> {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.upload<Documento>(`/tramites/${id}/documentos?visibilidad=TODOS`, fd, EXT);
}

/** Descarga autenticada: un <a href> no manda el Bearer, así que bajamos el blob. */
export async function descargarDocumentoExterno(
  id: string,
  documentoId: string,
  nombreArchivo: string,
): Promise<void> {
  const blob = await apiClient.download(`/tramites/${id}/documentos/${documentoId}`, EXT);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
