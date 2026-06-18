import { apiClient } from './api-client';
import type { Area } from '@/types/tramite';
import type {
  ActualizarAreaBody,
  ActualizarTipoTramiteBody,
  CrearAreaBody,
  CrearTipoTramiteBody,
  TipoTramite,
} from '@/types/config';

// --- Tipos de trámite ---

export function listTiposTramite(signal?: AbortSignal): Promise<TipoTramite[]> {
  return apiClient.get<TipoTramite[]>('/tipos-tramite', { notifyOnError: false, signal });
}

export function crearTipoTramite(body: CrearTipoTramiteBody): Promise<TipoTramite> {
  return apiClient.post<TipoTramite>('/tipos-tramite', body);
}

export function actualizarTipoTramite(
  id: string,
  body: ActualizarTipoTramiteBody,
): Promise<TipoTramite> {
  return apiClient.put<TipoTramite>(`/tipos-tramite/${id}`, body);
}

// --- Áreas (la lectura listAreas vive en tramites-api y se reutiliza) ---

export function crearArea(body: CrearAreaBody): Promise<Area> {
  return apiClient.post<Area>('/areas', body);
}

export function actualizarArea(id: string, body: ActualizarAreaBody): Promise<Area> {
  return apiClient.put<Area>(`/areas/${id}`, body);
}
