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
import { ListarTiposTramiteUseCase } from '../../application/use-cases/config/listar-tipos-tramite.use-case';
import { CrearTipoTramiteUseCase } from '../../application/use-cases/config/crear-tipo-tramite.use-case';
import { ActualizarTipoTramiteUseCase } from '../../application/use-cases/config/actualizar-tipo-tramite.use-case';
import { WorkflowAuthGuard } from '../guards/workflow-auth.guard';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';
import { actorFromUser } from '../tramites/actor.util';
import { ActualizarTipoTramiteRequest, CrearTipoTramiteRequest } from './dto/tipo-tramite.request';

@ApiTags('configuración')
@ApiBearerAuth()
@Controller('tipos-tramite')
@UseGuards(WorkflowAuthGuard)
export class TiposTramiteController {
  constructor(
    private readonly listarUC: ListarTiposTramiteUseCase,
    private readonly crearUC: CrearTipoTramiteUseCase,
    private readonly actualizarUC: ActualizarTipoTramiteUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  listar(@CurrentUser() u: CurrentUserData) {
    return this.listarUC.execute({ actor: actorFromUser(u) });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  crear(@Body() body: CrearTipoTramiteRequest, @CurrentUser() u: CurrentUserData) {
    return this.crearUC.execute({
      actor: actorFromUser(u),
      codigo: body.codigo,
      nombre: body.nombre,
      descripcion: body.descripcion,
      activo: body.activo,
      requiereExterno: body.requiereExterno,
      permiteInicioExterno: body.permiteInicioExterno,
      slaHoras: body.slaHoras,
      areaInicialId: body.areaInicialId,
    });
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  actualizar(
    @Param('id') id: string,
    @Body() body: ActualizarTipoTramiteRequest,
    @CurrentUser() u: CurrentUserData,
  ) {
    return this.actualizarUC.execute({
      actor: actorFromUser(u),
      id,
      nombre: body.nombre,
      descripcion: body.descripcion,
      activo: body.activo,
      requiereExterno: body.requiereExterno,
      permiteInicioExterno: body.permiteInicioExterno,
      slaHoras: body.slaHoras,
      areaInicialId: body.areaInicialId,
    });
  }
}
