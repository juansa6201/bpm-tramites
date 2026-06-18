import { Actor } from '../actor';
import { EstadoTramite } from '../../../domain/tramites/enums/estado-tramite.enum';
import { OrigenTramite } from '../../../domain/tramites/enums/origen-tramite.enum';
import { PrioridadTramite } from '../../../domain/tramites/enums/prioridad-tramite.enum';

/** Filtros que el cliente puede pedir en la bandeja (antes de aplicar visibilidad). */
export interface ListarTramitesFiltros {
  estado?: EstadoTramite;
  origen?: OrigenTramite;
  prioridad?: PrioridadTramite;
  areaActualId?: string;
  usuarioAsignadoId?: string;
  usuarioExternoId?: string;
  page?: number;
  pageSize?: number;
}

export interface ListarTramitesInput {
  actor: Actor;
  filtros: ListarTramitesFiltros;
}
