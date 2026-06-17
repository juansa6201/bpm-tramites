import { MovimientoTramite } from '../tramites/entities/movimiento-tramite.entity';
import { EstadoTramite } from '../tramites/enums/estado-tramite.enum';
import { AccionMovimiento } from '../tramites/enums/accion-movimiento.enum';
import { TipoUsuario } from '../usuarios/enums/tipo-usuario.enum';

/** Datos para registrar un movimiento de auditoría. */
export interface NuevoMovimientoData {
  tramiteId: string;
  estadoAnterior: EstadoTramite | null;
  estadoNuevo: EstadoTramite;
  areaAnteriorId: string | null;
  areaNuevaId: string | null;
  usuarioTipo: TipoUsuario;
  usuarioId: string;
  accion: AccionMovimiento;
  comentario: string | null;
}

/**
 * Puerto de persistencia de la auditoría (INTERFACE en el dominio).
 *
 * Nota: la creación de un movimiento junto al cambio de estado del trámite
 * debe ocurrir de forma ATÓMICA. La estrategia de transacción se resuelve en
 * los casos de uso de workflow (unit-of-work / $transaction de Prisma).
 */
export interface MovimientoTramiteRepository {
  create(data: NuevoMovimientoData): Promise<MovimientoTramite>;
  /** Timeline del trámite, ordenado por fecha ascendente. */
  listByTramite(tramiteId: string): Promise<MovimientoTramite[]>;
}
