import { Module } from '@nestjs/common';
import { TramitesController } from './tramites.controller';
import { WorkflowStateMachine } from '../../domain/services/workflow-state-machine';
import { UnitOfWork } from '../../application/ports/unit-of-work';
import {
  INTERNAL_TOKEN_VERIFIER,
  TIPO_TRAMITE_REPOSITORY,
  TOKEN_SERVICE,
  UNIT_OF_WORK,
  USUARIO_INTERNO_REPOSITORY,
} from '../../application/tokens';
import { TipoTramiteRepository } from '../../domain/repositories/tipo-tramite.repository';
import { PrismaUnitOfWork } from '../../infrastructure/persistence/prisma-unit-of-work';
import { PrismaUsuarioInternoRepository } from '../../infrastructure/persistence/repositories/prisma-usuario-interno.repository';
import { PrismaTipoTramiteRepository } from '../../infrastructure/persistence/repositories/prisma-tipo-tramite.repository';
import { MockEntraIdTokenService } from '../../infrastructure/security/mock-entra-id-token.service';
import { JwtTokenService } from '../../infrastructure/security/jwt-token.service';
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
  controllers: [TramitesController],
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

    // Dependencias del WorkflowAuthGuard (identidad interna + externa).
    { provide: USUARIO_INTERNO_REPOSITORY, useClass: PrismaUsuarioInternoRepository },
    MockEntraIdTokenService,
    { provide: INTERNAL_TOKEN_VERIFIER, useExisting: MockEntraIdTokenService },
    JwtTokenService,
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    WorkflowAuthGuard,
  ],
})
export class TramitesModule {}
