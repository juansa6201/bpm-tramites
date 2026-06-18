import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ListarAreasUseCase } from '../../application/use-cases/config/listar-areas.use-case';
import { CrearAreaUseCase } from '../../application/use-cases/config/crear-area.use-case';
import { ActualizarAreaUseCase } from '../../application/use-cases/config/actualizar-area.use-case';
import { WorkflowAuthGuard } from '../guards/workflow-auth.guard';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';
import { actorFromUser } from '../tramites/actor.util';
import { ActualizarAreaRequest, CrearAreaRequest } from './dto/area.request';

@ApiTags('configuración')
@ApiBearerAuth()
@Controller('areas')
@UseGuards(WorkflowAuthGuard)
export class AreasController {
  constructor(
    private readonly listarUC: ListarAreasUseCase,
    private readonly crearUC: CrearAreaUseCase,
    private readonly actualizarUC: ActualizarAreaUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  listar(@CurrentUser() u: CurrentUserData) {
    return this.listarUC.execute({ actor: actorFromUser(u) });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  crear(@Body() body: CrearAreaRequest, @CurrentUser() u: CurrentUserData) {
    return this.crearUC.execute({
      actor: actorFromUser(u),
      nombre: body.nombre,
      codigo: body.codigo,
      activa: body.activa,
    });
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  actualizar(
    @Param('id') id: string,
    @Body() body: ActualizarAreaRequest,
    @CurrentUser() u: CurrentUserData,
  ) {
    return this.actualizarUC.execute({
      actor: actorFromUser(u),
      id,
      nombre: body.nombre,
      activa: body.activa,
    });
  }
}
