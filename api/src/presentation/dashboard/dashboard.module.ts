import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { SecurityModule } from '../security/security.module';
import { DASHBOARD_REPOSITORY } from '../../application/tokens';
import { DashboardRepository } from '../../domain/repositories/dashboard.repository';
import { PrismaDashboardRepository } from '../../infrastructure/persistence/repositories/prisma-dashboard.repository';
import { VerDashboardUseCase } from '../../application/use-cases/dashboard/ver-dashboard.use-case';
import { WorkflowAuthGuard } from '../guards/workflow-auth.guard';

@Module({
  imports: [SecurityModule],
  controllers: [DashboardController],
  providers: [
    { provide: DASHBOARD_REPOSITORY, useClass: PrismaDashboardRepository },
    {
      provide: VerDashboardUseCase,
      useFactory: (dashboard: DashboardRepository) => new VerDashboardUseCase(dashboard),
      inject: [DASHBOARD_REPOSITORY],
    },

    // El guard se construye en este módulo; sus deps vienen de SecurityModule.
    WorkflowAuthGuard,
  ],
})
export class DashboardModule {}
