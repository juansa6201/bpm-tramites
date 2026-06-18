import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ListarTramitesUseCase } from '../../application/use-cases/tramites/listar-tramites.use-case';
import { VerTramiteUseCase } from '../../application/use-cases/tramites/ver-tramite.use-case';
import { EditarTramiteUseCase } from '../../application/use-cases/tramites/editar-tramite.use-case';
import { EliminarTramiteUseCase } from '../../application/use-cases/tramites/eliminar-tramite.use-case';
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
import { Actor } from '../../application/dto/actor';
import { TipoUsuario } from '../../domain/usuarios/enums/tipo-usuario.enum';
import { WorkflowAuthGuard } from '../guards/workflow-auth.guard';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';
import { ComentarioOpcionalRequest, ComentarioRequeridoRequest } from './dto/comentario.request';
import { AsignarRequest } from './dto/asignar.request';
import { DerivarRequest } from './dto/derivar.request';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CrearTramiteRequest } from './dto/crear-tramite.request';
import { ListarTramitesQuery } from './dto/listar-tramites.query';
import { EditarTramiteRequest } from './dto/editar-tramite.request';

@ApiTags('tramites')
@ApiBearerAuth()
@Controller('tramites')
@UseGuards(WorkflowAuthGuard)
export class TramitesController {
  constructor(
    private readonly ingresarUC: IngresarTramiteUseCase,
    private readonly tomarUC: TomarTramiteUseCase,
    private readonly asignarUC: AsignarTramiteUseCase,
    private readonly derivarUC: DerivarTramiteUseCase,
    private readonly observarUC: ObservarTramiteUseCase,
    private readonly responderObservacionUC: ResponderObservacionUseCase,
    private readonly solicitarIntervencionUC: SolicitarIntervencionExternaUseCase,
    private readonly responderIntervencionUC: ResponderIntervencionExternaUseCase,
    private readonly aprobarUC: AprobarTramiteUseCase,
    private readonly rechazarUC: RechazarTramiteUseCase,
    private readonly cerrarUC: CerrarTramiteUseCase,
    private readonly cancelarUC: CancelarTramiteUseCase,
    private readonly crearUC: CrearTramiteUseCase,
    private readonly listarUC: ListarTramitesUseCase,
    private readonly verUC: VerTramiteUseCase,
    private readonly editarUC: EditarTramiteUseCase,
    private readonly eliminarUC: EliminarTramiteUseCase,
  ) {}

  private actor(user: CurrentUserData): Actor {
    return user.tipo === TipoUsuario.INTERNO
      ? { tipo: TipoUsuario.INTERNO, id: user.id, rol: user.rol!, areaId: user.areaId! }
      : { tipo: TipoUsuario.EXTERNO, id: user.id };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  crear(@Body() body: CrearTramiteRequest, @CurrentUser() u: CurrentUserData) {
    return this.crearUC.execute({
      actor: this.actor(u),
      tipoTramiteId: body.tipoTramiteId,
      titulo: body.titulo,
      descripcion: body.descripcion,
      origen: body.origen,
      prioridad: body.prioridad,
      usuarioExternoId: body.usuarioExternoId ?? null,
      areaActualId: body.areaActualId ?? null,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  listar(@Query() query: ListarTramitesQuery, @CurrentUser() u: CurrentUserData) {
    return this.listarUC.execute({ actor: this.actor(u), filtros: query });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  ver(@Param('id') id: string, @CurrentUser() u: CurrentUserData) {
    return this.verUC.execute({ tramiteId: id, actor: this.actor(u) });
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  editar(
    @Param('id') id: string,
    @Body() body: EditarTramiteRequest,
    @CurrentUser() u: CurrentUserData,
  ) {
    return this.editarUC.execute({
      tramiteId: id,
      actor: this.actor(u),
      titulo: body.titulo,
      descripcion: body.descripcion,
      prioridad: body.prioridad,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminar(@Param('id') id: string, @CurrentUser() u: CurrentUserData) {
    await this.eliminarUC.execute({ tramiteId: id, actor: this.actor(u) });
  }

  @Post(':id/ingresar')
  @HttpCode(HttpStatus.OK)
  ingresar(
    @Param('id') id: string,
    @Body() body: ComentarioOpcionalRequest,
    @CurrentUser() u: CurrentUserData,
  ) {
    return this.ingresarUC.execute({
      tramiteId: id,
      actor: this.actor(u),
      comentario: body.comentario,
    });
  }

  @Post(':id/tomar')
  @HttpCode(HttpStatus.OK)
  tomar(
    @Param('id') id: string,
    @Body() body: ComentarioOpcionalRequest,
    @CurrentUser() u: CurrentUserData,
  ) {
    return this.tomarUC.execute({
      tramiteId: id,
      actor: this.actor(u),
      comentario: body.comentario,
    });
  }

  @Post(':id/asignar')
  @HttpCode(HttpStatus.OK)
  asignar(
    @Param('id') id: string,
    @Body() body: AsignarRequest,
    @CurrentUser() u: CurrentUserData,
  ) {
    return this.asignarUC.execute({
      tramiteId: id,
      actor: this.actor(u),
      usuarioAsignadoId: body.usuarioAsignadoId,
      comentario: body.comentario,
    });
  }

  @Post(':id/derivar')
  @HttpCode(HttpStatus.OK)
  derivar(
    @Param('id') id: string,
    @Body() body: DerivarRequest,
    @CurrentUser() u: CurrentUserData,
  ) {
    return this.derivarUC.execute({
      tramiteId: id,
      actor: this.actor(u),
      areaNuevaId: body.areaNuevaId,
      comentario: body.comentario,
    });
  }

  @Post(':id/observar')
  @HttpCode(HttpStatus.OK)
  observar(
    @Param('id') id: string,
    @Body() body: ComentarioRequeridoRequest,
    @CurrentUser() u: CurrentUserData,
  ) {
    return this.observarUC.execute({
      tramiteId: id,
      actor: this.actor(u),
      comentario: body.comentario,
    });
  }

  @Post(':id/responder-observacion')
  @HttpCode(HttpStatus.OK)
  responderObservacion(
    @Param('id') id: string,
    @Body() body: ComentarioRequeridoRequest,
    @CurrentUser() u: CurrentUserData,
  ) {
    return this.responderObservacionUC.execute({
      tramiteId: id,
      actor: this.actor(u),
      comentario: body.comentario,
    });
  }

  @Post(':id/solicitar-intervencion-externa')
  @HttpCode(HttpStatus.OK)
  solicitarIntervencion(
    @Param('id') id: string,
    @Body() body: ComentarioRequeridoRequest,
    @CurrentUser() u: CurrentUserData,
  ) {
    return this.solicitarIntervencionUC.execute({
      tramiteId: id,
      actor: this.actor(u),
      comentario: body.comentario,
    });
  }

  @Post(':id/responder-intervencion-externa')
  @HttpCode(HttpStatus.OK)
  responderIntervencion(
    @Param('id') id: string,
    @Body() body: ComentarioRequeridoRequest,
    @CurrentUser() u: CurrentUserData,
  ) {
    return this.responderIntervencionUC.execute({
      tramiteId: id,
      actor: this.actor(u),
      comentario: body.comentario,
    });
  }

  @Post(':id/aprobar')
  @HttpCode(HttpStatus.OK)
  aprobar(
    @Param('id') id: string,
    @Body() body: ComentarioOpcionalRequest,
    @CurrentUser() u: CurrentUserData,
  ) {
    return this.aprobarUC.execute({
      tramiteId: id,
      actor: this.actor(u),
      comentario: body.comentario,
    });
  }

  @Post(':id/rechazar')
  @HttpCode(HttpStatus.OK)
  rechazar(
    @Param('id') id: string,
    @Body() body: ComentarioRequeridoRequest,
    @CurrentUser() u: CurrentUserData,
  ) {
    return this.rechazarUC.execute({
      tramiteId: id,
      actor: this.actor(u),
      comentario: body.comentario,
    });
  }

  @Post(':id/cerrar')
  @HttpCode(HttpStatus.OK)
  cerrar(
    @Param('id') id: string,
    @Body() body: ComentarioOpcionalRequest,
    @CurrentUser() u: CurrentUserData,
  ) {
    return this.cerrarUC.execute({
      tramiteId: id,
      actor: this.actor(u),
      comentario: body.comentario,
    });
  }

  @Post(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  cancelar(
    @Param('id') id: string,
    @Body() body: ComentarioRequeridoRequest,
    @CurrentUser() u: CurrentUserData,
  ) {
    return this.cancelarUC.execute({
      tramiteId: id,
      actor: this.actor(u),
      comentario: body.comentario,
    });
  }
}
