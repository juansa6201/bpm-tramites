import { Module } from '@nestjs/common';
import { AreasController } from './areas.controller';
import { TiposTramiteController } from './tipos-tramite.controller';
import { SecurityModule } from '../security/security.module';
import { AREA_REPOSITORY, TIPO_TRAMITE_REPOSITORY } from '../../application/tokens';
import { AreaRepository } from '../../domain/repositories/area.repository';
import { TipoTramiteRepository } from '../../domain/repositories/tipo-tramite.repository';
import { PrismaAreaRepository } from '../../infrastructure/persistence/repositories/prisma-area.repository';
import { PrismaTipoTramiteRepository } from '../../infrastructure/persistence/repositories/prisma-tipo-tramite.repository';
import { WorkflowAuthGuard } from '../guards/workflow-auth.guard';

import { ListarAreasUseCase } from '../../application/use-cases/config/listar-areas.use-case';
import { CrearAreaUseCase } from '../../application/use-cases/config/crear-area.use-case';
import { ActualizarAreaUseCase } from '../../application/use-cases/config/actualizar-area.use-case';
import { ListarTiposTramiteUseCase } from '../../application/use-cases/config/listar-tipos-tramite.use-case';
import { ListarTiposIniciablesExternoUseCase } from '../../application/use-cases/config/listar-tipos-iniciables-externo.use-case';
import { CrearTipoTramiteUseCase } from '../../application/use-cases/config/crear-tipo-tramite.use-case';
import { ActualizarTipoTramiteUseCase } from '../../application/use-cases/config/actualizar-tipo-tramite.use-case';

@Module({
  imports: [SecurityModule],
  controllers: [AreasController, TiposTramiteController],
  providers: [
    { provide: AREA_REPOSITORY, useClass: PrismaAreaRepository },
    { provide: TIPO_TRAMITE_REPOSITORY, useClass: PrismaTipoTramiteRepository },

    // Áreas
    {
      provide: ListarAreasUseCase,
      useFactory: (areas: AreaRepository) => new ListarAreasUseCase(areas),
      inject: [AREA_REPOSITORY],
    },
    {
      provide: CrearAreaUseCase,
      useFactory: (areas: AreaRepository) => new CrearAreaUseCase(areas),
      inject: [AREA_REPOSITORY],
    },
    {
      provide: ActualizarAreaUseCase,
      useFactory: (areas: AreaRepository) => new ActualizarAreaUseCase(areas),
      inject: [AREA_REPOSITORY],
    },

    // Tipos de trámite (crear/actualizar validan el área inicial → necesitan AreaRepository)
    {
      provide: ListarTiposTramiteUseCase,
      useFactory: (tipos: TipoTramiteRepository) => new ListarTiposTramiteUseCase(tipos),
      inject: [TIPO_TRAMITE_REPOSITORY],
    },
    {
      provide: ListarTiposIniciablesExternoUseCase,
      useFactory: (tipos: TipoTramiteRepository) => new ListarTiposIniciablesExternoUseCase(tipos),
      inject: [TIPO_TRAMITE_REPOSITORY],
    },
    {
      provide: CrearTipoTramiteUseCase,
      useFactory: (tipos: TipoTramiteRepository, areas: AreaRepository) =>
        new CrearTipoTramiteUseCase(tipos, areas),
      inject: [TIPO_TRAMITE_REPOSITORY, AREA_REPOSITORY],
    },
    {
      provide: ActualizarTipoTramiteUseCase,
      useFactory: (tipos: TipoTramiteRepository, areas: AreaRepository) =>
        new ActualizarTipoTramiteUseCase(tipos, areas),
      inject: [TIPO_TRAMITE_REPOSITORY, AREA_REPOSITORY],
    },

    // El guard se construye en este módulo; sus deps vienen de SecurityModule.
    WorkflowAuthGuard,
  ],
})
export class ConfiguracionModule {}
