import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ListarUsuariosExternosUseCase } from '../../application/use-cases/usuarios/listar-usuarios-externos.use-case';
import { WorkflowAuthGuard } from '../guards/workflow-auth.guard';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';
import { actorFromUser } from '../tramites/actor.util';

@ApiTags('usuarios')
@ApiBearerAuth()
@Controller('usuarios-externos')
@UseGuards(WorkflowAuthGuard)
export class UsuariosController {
  constructor(private readonly listarExternosUC: ListarUsuariosExternosUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  listarExternos(@CurrentUser() u: CurrentUserData) {
    return this.listarExternosUC.execute({ actor: actorFromUser(u) });
  }
}
