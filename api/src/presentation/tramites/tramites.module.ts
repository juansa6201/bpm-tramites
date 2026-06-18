import { Module } from '@nestjs/common';
import { TramitesController } from './tramites.controller';
import { ComentariosController } from './comentarios.controller';
import { SecurityModule } from '../security/security.module';
import { WorkflowStateMachine } from '../../domain/services/workflow-state-machine';
import { UnitOfWork } from '../../application/ports/unit-of-work';
import {
  CLOCK,
  COMENTARIO_TRAMITE_REPOSITORY,
  MOVIMIENTO_TRAMITE_REPOSITORY,
  TIPO_TRAMITE_REPOSITORY,
  TRAMITE_REPOSITORY,
  UNIT_OF_WORK,
} from '../../application/tokens';
import { Clock } from '../../application/ports/clock.port';
import { SystemClock } from '../../infrastructure/clock/system-clock';
import { TipoTramiteRepository } from '../../domain/repositories/tipo-tramite.repository';
import { TramiteRepository } from '../../domain/repositories/tramite.repository';
import { MovimientoTramiteRepository } from '../../domain/repositories/movimiento-tramite.repository';
import { ComentarioTramiteRepository } from '../../domain/repositories/comentario-tramite.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PrismaUnitOfWork } from '../../infrastructure/persistence/prisma-unit-of-work';
import { PrismaTipoTramiteRepository } from '../../infrastructure/persistence/repositories/prisma-tipo-tramite.repository';
import { PrismaTramiteRepository } from '../../infrastructure/persistence/repositories/prisma-tramite.repository';
import { PrismaMovimientoTramiteRepository } from '../../infrastructure/persistence/repositories/prisma-movimiento-tramite.repository';
import { PrismaComentarioTramiteRepository } from '../../infrastructure/persistence/repositories/prisma-comentario-tramite.repository';
import { WorkflowAuthGuard } from '../guards/workflow-auth.guard';

import { IngresarTramiteUseCase } from '../../application/use-cases/tramites/ingresar-tramite.use-case';
import { TomarTramiteUseCase } from '../../application/use-cases/tramites/tomar-tramite.use-case';
import { AsignarTramiteUseCase } from '../../application/use-cases/tramites/asignar-tramite.use-case';
import { DerivarTramiteUseCase } from '../../application/use-cases/tramites/derivar-tramite.use-case';
import { ObservarTramiteUseCase } from '../../application/use-cases/tramites/observar-tramite.use-case';
import { ResponderObservacionUseCase } from '../../application/use-cases/tramites/responder-observacion.use-case';
import { SolicitarIntervencionExternaUseCase } from '../../application/use-cases/tramites/solicitar-intervencion-externa.use-case';
import { ResponderIntervencionExternaUseCase } from '../../application/use-cases/tramites/responder-intervencion-externa.use-case';
import { AprobarTramiteUseCase } from '../../application/use-cases/tramites/aprobar-tramite.use-case';
import { RechazarTramiteUseCase } from '../../application/use-cases/tramites/rechazar-tramite.use-case';
import { CerrarTramiteUseCase } from '../../application/use-cases/tramites/cerrar-tramite.use-case';
import { CancelarTramiteUseCase } from '../../application/use-cases/tramites/cancelar-tramite.use-case';
import { CrearTramiteUseCase } from '../../application/use-cases/tramites/crear-tramite.use-case';
import { ListarTramitesUseCase } from '../../application/use-cases/tramites/listar-tramites.use-case';
import { VerTramiteUseCase } from '../../application/use-cases/tramites/ver-tramite.use-case';
import { EditarTramiteUseCase } from '../../application/use-cases/tramites/editar-tramite.use-case';
import { EliminarTramiteUseCase } from '../../application/use-cases/tramites/eliminar-tramite.use-case';
import { AgregarComentarioUseCase } from '../../application/use-cases/tramites/agregar-comentario.use-case';
import { ListarComentariosUseCase } from '../../application/use-cases/tramites/listar-comentarios.use-case';

/** Todos los casos de uso comparten constructor (uow, stateMachine). */
type WorkflowUseCaseCtor = new (uow: UnitOfWork, sm: WorkflowStateMachine) => unknown;

const WORKFLOW_USE_CASES: WorkflowUseCaseCtor[] = [
  IngresarTramiteUseCase,
  TomarTramiteUseCase,
  AsignarTramiteUseCase,
  DerivarTramiteUseCase,
  ObservarTramiteUseCase,
  ResponderObservacionUseCase,
  SolicitarIntervencionExternaUseCase,
  ResponderIntervencionExternaUseCase,
  AprobarTramiteUseCase,
  RechazarTramiteUseCase,
  CerrarTramiteUseCase,
  CancelarTramiteUseCase,
];

@Module({
  imports: [SecurityModule],
  controllers: [TramitesController, ComentariosController],
  providers: [
    // Servicio de dominio (puro) + Unit of Work (transacciones).
    { provide: WorkflowStateMachine, useValue: new WorkflowStateMachine() },
    { provide: UNIT_OF_WORK, useClass: PrismaUnitOfWork },

    // Casos de uso (clases planas) cableados de forma uniforme con useFactory.
    ...WORKFLOW_USE_CASES.map((UseCase) => ({
      provide: UseCase,
      useFactory: (uow: UnitOfWork, sm: WorkflowStateMachine) => new UseCase(uow, sm),
      inject: [UNIT_OF_WORK, WorkflowStateMachine],
    })),

    // CrearTramite tiene otro constructor (uow, tipoRepo): provider dedicado.
    { provide: TIPO_TRAMITE_REPOSITORY, useClass: PrismaTipoTramiteRepository },
    {
      provide: CrearTramiteUseCase,
      useFactory: (uow: UnitOfWork, tipos: TipoTramiteRepository) =>
        new CrearTramiteUseCase(uow, tipos),
      inject: [UNIT_OF_WORK, TIPO_TRAMITE_REPOSITORY],
    },

    // Lecturas: NO necesitan transacción, usan repos ligados al PrismaService
    // (cliente no transaccional). El filtrado/paginado ocurre en la base.
    {
      provide: TRAMITE_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaTramiteRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: MOVIMIENTO_TRAMITE_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaMovimientoTramiteRepository(prisma),
      inject: [PrismaService],
    },
    { provide: CLOCK, useClass: SystemClock },
    {
      provide: ListarTramitesUseCase,
      useFactory: (tramites: TramiteRepository, tipos: TipoTramiteRepository, clock: Clock) =>
        new ListarTramitesUseCase(tramites, tipos, clock),
      inject: [TRAMITE_REPOSITORY, TIPO_TRAMITE_REPOSITORY, CLOCK],
    },
    {
      provide: VerTramiteUseCase,
      useFactory: (
        tramites: TramiteRepository,
        movimientos: MovimientoTramiteRepository,
        sm: WorkflowStateMachine,
      ) => new VerTramiteUseCase(tramites, movimientos, sm),
      inject: [TRAMITE_REPOSITORY, MOVIMIENTO_TRAMITE_REPOSITORY, WorkflowStateMachine],
    },
    {
      provide: EditarTramiteUseCase,
      useFactory: (tramites: TramiteRepository) => new EditarTramiteUseCase(tramites),
      inject: [TRAMITE_REPOSITORY],
    },
    {
      provide: EliminarTramiteUseCase,
      useFactory: (tramites: TramiteRepository) => new EliminarTramiteUseCase(tramites),
      inject: [TRAMITE_REPOSITORY],
    },

    // Comentarios (no son transición de estado: repos directos, sin UoW).
    {
      provide: COMENTARIO_TRAMITE_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaComentarioTramiteRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: AgregarComentarioUseCase,
      useFactory: (tramites: TramiteRepository, comentarios: ComentarioTramiteRepository) =>
        new AgregarComentarioUseCase(tramites, comentarios),
      inject: [TRAMITE_REPOSITORY, COMENTARIO_TRAMITE_REPOSITORY],
    },
    {
      provide: ListarComentariosUseCase,
      useFactory: (tramites: TramiteRepository, comentarios: ComentarioTramiteRepository) =>
        new ListarComentariosUseCase(tramites, comentarios),
      inject: [TRAMITE_REPOSITORY, COMENTARIO_TRAMITE_REPOSITORY],
    },

    // El guard se construye en este módulo; sus deps vienen de SecurityModule.
    WorkflowAuthGuard,
  ],
})
export class TramitesModule {}
