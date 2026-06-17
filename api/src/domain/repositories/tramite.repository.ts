import { Tramite } from '../tramites/entities/tramite.entity';
import { EstadoTramite } from '../tramites/enums/estado-tramite.enum';
import { OrigenTramite } from '../tramites/enums/origen-tramite.enum';
import { PrioridadTramite } from '../tramites/enums/prioridad-tramite.enum';
import { TipoUsuario } from '../usuarios/enums/tipo-usuario.enum';
import { PaginatedResult } from '../shared/pagination';

/** Datos de creación de un trámite (estado inicial y fechas los pone la persistencia). */
export interface CrearTramiteData {
  numero: string;
  titulo: string;
  descripcion: string;
  origen: OrigenTramite;
  prioridad: PrioridadTramite;
  tipoTramiteId: string;
  areaActualId: string | null;
  usuarioAsignadoId: string | null;
  usuarioExternoId: string | null;
  creadoPorTipo: TipoUsuario;
  creadoPorId: string;
}

/** Filtros del listado de trámites (bandeja). */
export interface TramiteFilters {
  estado?: EstadoTramite;
  origen?: OrigenTramite;
  prioridad?: PrioridadTramite;
  areaActualId?: string;
  usuarioAsignadoId?: string;
  usuarioExternoId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Puerto de persistencia del agregado Trámite (INTERFACE en el dominio).
 * Implementado con Prisma en infrastructure.
 */
export interface TramiteRepository {
  findById(id: string): Promise<Tramite | null>;
  findByNumero(numero: string): Promise<Tramite | null>;
  list(filters: TramiteFilters): Promise<PaginatedResult<Tramite>>;
  create(data: CrearTramiteData): Promise<Tramite>;

  /** Devuelve el mayor número con ese prefijo (para numerar), o null si no hay. */
  ultimoNumeroConPrefijo(prefijo: string): Promise<string | null>;
  /**
   * Persiste los cambios del trámite con bloqueo OPTIMISTA por `version`.
   * Debe fallar si la versión en base ya no coincide (concurrencia).
   */
  update(tramite: Tramite): Promise<void>;

  /**
   * "Toma" ATÓMICA (compare-and-swap): cambia estado y asignado en una sola
   * sentencia, SOLO si el trámite sigue como se leyó (estadoEsperado +
   * usuarioAsignadoEsperado). Devuelve true si esta operación ganó la carrera,
   * false si otro usuario lo tomó primero.
   */
  tomarAtomico(params: {
    id: string;
    estadoEsperado: EstadoTramite;
    usuarioAsignadoEsperado: string | null;
    estadoNuevo: EstadoTramite;
    usuarioAsignadoId: string;
  }): Promise<boolean>;
}
