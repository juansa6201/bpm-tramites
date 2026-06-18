import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AgregarComentarioUseCase } from '../../application/use-cases/tramites/agregar-comentario.use-case';
import { ListarComentariosUseCase } from '../../application/use-cases/tramites/listar-comentarios.use-case';
import { WorkflowAuthGuard } from '../guards/workflow-auth.guard';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';
import { actorFromUser } from './actor.util';
import { AgregarComentarioRequest } from './dto/agregar-comentario.request';

@ApiTags('comentarios')
@ApiBearerAuth()
@Controller('tramites/:id/comentarios')
@UseGuards(WorkflowAuthGuard)
export class ComentariosController {
  constructor(
    private readonly agregarUC: AgregarComentarioUseCase,
    private readonly listarUC: ListarComentariosUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  agregar(
    @Param('id') id: string,
    @Body() body: AgregarComentarioRequest,
    @CurrentUser() u: CurrentUserData,
  ) {
    return this.agregarUC.execute({
      tramiteId: id,
      actor: actorFromUser(u),
      mensaje: body.mensaje,
      visibilidad: body.visibilidad,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  listar(@Param('id') id: string, @CurrentUser() u: CurrentUserData) {
    return this.listarUC.execute({ tramiteId: id, actor: actorFromUser(u) });
  }
}
