import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VerDashboardUseCase } from '../../application/use-cases/dashboard/ver-dashboard.use-case';
import { WorkflowAuthGuard } from '../guards/workflow-auth.guard';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';
import { actorFromUser } from '../tramites/actor.util';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(WorkflowAuthGuard)
export class DashboardController {
  constructor(private readonly verDashboardUC: VerDashboardUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  ver(@CurrentUser() u: CurrentUserData) {
    return this.verDashboardUC.execute({ actor: actorFromUser(u) });
  }
}
