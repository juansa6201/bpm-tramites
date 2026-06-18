import { Tramite } from '../../../domain/tramites/entities/tramite.entity';
import { MovimientoTramite } from '../../../domain/tramites/entities/movimiento-tramite.entity';
import { EstadoTramite } from '../../../domain/tramites/enums/estado-tramite.enum';
import { OrigenTramite } from '../../../domain/tramites/enums/origen-tramite.enum';
import { PrioridadTramite } from '../../../domain/tramites/enums/prioridad-tramite.enum';
import { AccionMovimiento } from '../../../domain/tramites/enums/accion-movimiento.enum';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { SlaPolicy } from '../../../domain/tramites/services/sla-policy';

/**
 * Vistas de SALIDA (objetos planos, serializables).
 *
 * Las entidades de dominio guardan su estado en `private props` y lo exponen
 * vía getters: `JSON.stringify(entidad)` produciría `{"props":{...}}`. Por eso
 * cada lectura mapea la entidad a un objeto plano explícito, igual que las
 * escrituras devuelven sus result DTOs. Es el límite donde el dominio se
 * traduce a un contrato de transporte.
 */
export interface TramiteView {
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
  creadoPorTipo: TipoUsuario;
  creadoPorId: string;
  version: number;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  fechaCierre: Date | null;
}

/**
 * Ítem de la bandeja: el trámite + el estado de su SLA, ya resuelto en el server
 * (única fuente de verdad, espejo del dashboard). `fechaVencimiento` es null si
 * no se pudo determinar el SLA del tipo.
 */
export interface TramiteListItemView extends TramiteView {
  fechaVencimiento: Date | null;
  slaVencido: boolean;
}

/** Un ítem de la timeline de auditoría del trámite. */
export interface MovimientoView {
  id: string;
  estadoAnterior: EstadoTramite | null;
  estadoNuevo: EstadoTramite;
  areaAnteriorId: string | null;
  areaNuevaId: string | null;
  usuarioTipo: TipoUsuario;
  usuarioId: string;
  accion: AccionMovimiento;
  comentario: string | null;
  fecha: Date;
}

/** Detalle del trámite con su timeline embebida y las acciones que el actor puede ejecutar. */
export interface TramiteDetalleView extends TramiteView {
  movimientos: MovimientoView[];
  /** Acciones de workflow habilitadas para este actor en el estado actual (guía de UI). */
  accionesPermitidas: AccionMovimiento[];
}

export function toTramiteView(t: Tramite): TramiteView {
  return {
    id: t.id,
    numero: t.numero,
    titulo: t.titulo,
    descripcion: t.descripcion,
    origen: t.origen,
    estado: t.estado,
    prioridad: t.prioridad,
    tipoTramiteId: t.tipoTramiteId,
    areaActualId: t.areaActualId,
    usuarioAsignadoId: t.usuarioAsignadoId,
    usuarioExternoId: t.usuarioExternoId,
    creadoPorTipo: t.creadoPorTipo,
    creadoPorId: t.creadoPorId,
    version: t.version,
    fechaCreacion: t.fechaCreacion,
    fechaActualizacion: t.fechaActualizacion,
    fechaCierre: t.fechaCierre,
  };
}

/**
 * Construye el ítem de bandeja resolviendo el SLA. `slaHoras` puede venir
 * undefined (tipo no encontrado): en ese caso no hay vencimiento que mostrar.
 */
export function toTramiteListItemView(
  t: Tramite,
  slaHoras: number | undefined,
  ahora: Date,
): TramiteListItemView {
  const fechaVencimiento =
    slaHoras !== undefined ? SlaPolicy.fechaVencimiento(t.fechaCreacion, slaHoras) : null;
  const slaVencido =
    fechaVencimiento !== null && SlaPolicy.estaVencido(t.estado, fechaVencimiento, ahora);
  return { ...toTramiteView(t), fechaVencimiento, slaVencido };
}

export function toMovimientoView(m: MovimientoTramite): MovimientoView {
  return {
    id: m.id,
    estadoAnterior: m.estadoAnterior,
    estadoNuevo: m.estadoNuevo,
    areaAnteriorId: m.areaAnteriorId,
    areaNuevaId: m.areaNuevaId,
    usuarioTipo: m.usuarioTipo,
    usuarioId: m.usuarioId,
    accion: m.accion,
    comentario: m.comentario,
    fecha: m.fecha,
  };
}

export function toTramiteDetalleView(
  t: Tramite,
  movimientos: MovimientoTramite[],
  accionesPermitidas: AccionMovimiento[],
): TramiteDetalleView {
  return {
    ...toTramiteView(t),
    movimientos: movimientos.map(toMovimientoView),
    accionesPermitidas,
  };
}
