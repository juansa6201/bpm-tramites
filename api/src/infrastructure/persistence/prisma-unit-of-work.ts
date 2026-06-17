import { Injectable } from '@nestjs/common';
import { UnitOfWork, WorkflowRepositories } from '../../application/ports/unit-of-work';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaTramiteRepository } from './repositories/prisma-tramite.repository';
import { PrismaMovimientoTramiteRepository } from './repositories/prisma-movimiento-tramite.repository';

/**
 * Implementación del UnitOfWork con Prisma $transaction.
 * Crea repositorios ligados al cliente transaccional `tx`, de modo que todas
 * las escrituras de `work` ocurren en la MISMA transacción (atómicas).
 */
@Injectable()
export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  runInTransaction<T>(work: (repos: WorkflowRepositories) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const repos: WorkflowRepositories = {
        tramites: new PrismaTramiteRepository(tx),
        movimientos: new PrismaMovimientoTramiteRepository(tx),
      };
      return work(repos);
    });
  }
}
