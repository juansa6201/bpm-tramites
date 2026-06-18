export type EstadoTramite =
  | 'BORRADOR'
  | 'INGRESADO'
  | 'EN_REVISION'
  | 'OBSERVADO'
  | 'ESPERANDO_EXTERNO'
  | 'ESPERANDO_INTERNO'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'CANCELADO'
  | 'CERRADO';

export type PrioridadTramite = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type OrigenTramite = 'INTERNO_INTERNO' | 'INTERNO_EXTERNO' | 'EXTERNO_INTERNO';

export type TipoUsuario = 'INTERNO' | 'EXTERNO';

export type Visibilidad = 'INTERNA' | 'EXTERNA' | 'TODOS';

export type AccionMovimiento =
  | 'CREAR'
  | 'INGRESAR'
  | 'TOMAR'
  | 'ASIGNAR'
  | 'DERIVAR'
  | 'OBSERVAR'
  | 'RESPONDER_OBSERVACION'
  | 'SOLICITAR_INTERVENCION_EXTERNA'
  | 'RESPONDER_INTERVENCION_EXTERNA'
  | 'APROBAR'
  | 'RECHAZAR'
  | 'CANCELAR'
  | 'CERRAR';

/** Campos base de un trámite, compartidos por la bandeja y el detalle (fechas ISO string). */
export interface TramiteBase {
  id: string;
  numero: string;
  titulo: string;
  descripcion: string;
  origen: OrigenTramite;
  estado: EstadoTramite;
  prioridad: PrioridadTramite;
  tipoTramiteId: string;
  areaActualId: string | null;
  usuarioAsignadoId: string | null;
  usuarioExternoId: string | null;
  version: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaCierre: string | null;
}

/** Ítem de la bandeja (GET /tramites): base + estado del SLA calculado en el server. */
export interface TramiteListItem extends TramiteBase {
  fechaVencimiento: string | null;
  slaVencido: boolean;
}

/** Movimiento: una entrada de la timeline de auditoría. */
export interface MovimientoTramite {
  id: string;
  estadoAnterior: EstadoTramite | null;
  estadoNuevo: EstadoTramite;
  areaAnteriorId: string | null;
  areaNuevaId: string | null;
  usuarioTipo: TipoUsuario;
  usuarioId: string;
  accion: AccionMovimiento;
  comentario: string | null;
  fecha: string;
}

/** Detalle (GET /tramites/:id): base + timeline + acciones habilitadas para el actor. */
export interface TramiteDetalle extends TramiteBase {
  movimientos: MovimientoTramite[];
  accionesPermitidas: AccionMovimiento[];
}

/** Comentario (GET /tramites/:id/comentarios). */
export interface Comentario {
  id: string;
  tramiteId: string;
  mensaje: string;
  visibilidad: Visibilidad;
  autorTipo: TipoUsuario;
  autorId: string;
  fecha: string;
}

/** Documento adjunto (GET /tramites/:id/documentos). No expone storageKey. */
export interface Documento {
  id: string;
  tramiteId: string;
  nombreArchivo: string;
  mimeType: string;
  size: number;
  visibilidad: Visibilidad;
  subidoPorTipo: TipoUsuario;
  subidoPorId: string;
  fechaCarga: string;
}

/** Resultado de una acción de workflow (POST /tramites/:id/<accion>). */
export interface TramiteTransicionResult {
  id: string;
  numero: string;
  estadoAnterior: EstadoTramite;
  estadoNuevo: EstadoTramite;
}

/** Body para crear un trámite (POST /tramites). */
export interface CrearTramiteBody {
  tipoTramiteId: string;
  titulo: string;
  descripcion: string;
  origen: OrigenTramite;
  prioridad?: PrioridadTramite;
  usuarioExternoId?: string;
  areaActualId?: string;
}

/** Resultado de crear un trámite. */
export interface CrearTramiteResult {
  id: string;
  numero: string;
  estado: EstadoTramite;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Estado de los filtros + paginación de la bandeja (page es 1-based, como el backend). */
export interface TramitesFilters {
  estado?: EstadoTramite;
  prioridad?: PrioridadTramite;
  origen?: OrigenTramite;
  areaActualId?: string;
  creadoDesde?: string;
  creadoHasta?: string;
  page: number;
  pageSize: number;
}

export interface Area {
  id: string;
  nombre: string;
  codigo: string;
  activa: boolean;
}
