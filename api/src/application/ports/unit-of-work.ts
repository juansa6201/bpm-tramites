import { TramiteRepository } from '../../domain/repositories/tramite.repository';
import { MovimientoTramiteRepository } from '../../domain/repositories/movimiento-tramite.repository';

/**
 * Repositorios TRANSACCIONALES que el UnitOfWork entrega dentro de una
 * transacción. Son las mismas interfaces de dominio, pero la implementación
 * concreta está ligada a la transacción en curso.
 */
export interface WorkflowRepositories {
  tramites: TramiteRepository;
  movimientos: MovimientoTramiteRepository;
}

/**
 * Puerto de transacción (Unit of Work).
 * Ejecuta `work` dentro de una transacción atómica; si `work` lanza, se hace
 * rollback. La implementación (Prisma $transaction) vive en infrastructure.
 *
 * Gracias a esto, el caso de uso coordina una transacción SIN conocer Prisma.
 */
export interface UnitOfWork {
  runInTransaction<T>(work: (repos: WorkflowRepositories) => Promise<T>): Promise<T>;
}
