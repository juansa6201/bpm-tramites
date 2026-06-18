import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  PayloadTooLargeException,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { MultipartFile } from '@fastify/multipart';
import { SubirDocumentoUseCase } from '../../application/use-cases/tramites/subir-documento.use-case';
import { ListarDocumentosUseCase } from '../../application/use-cases/tramites/listar-documentos.use-case';
import { DescargarDocumentoUseCase } from '../../application/use-cases/tramites/descargar-documento.use-case';
import { EliminarDocumentoUseCase } from '../../application/use-cases/tramites/eliminar-documento.use-case';
import { WorkflowAuthGuard } from '../guards/workflow-auth.guard';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';
import { actorFromUser } from '../tramites/actor.util';
import { SubirDocumentoQuery } from './dto/subir-documento.query';

@ApiTags('documentos')
@ApiBearerAuth()
@Controller('tramites/:id/documentos')
@UseGuards(WorkflowAuthGuard)
export class DocumentosController {
  constructor(
    private readonly subirUC: SubirDocumentoUseCase,
    private readonly listarUC: ListarDocumentosUseCase,
    private readonly descargarUC: DescargarDocumentoUseCase,
    private readonly eliminarUC: EliminarDocumentoUseCase,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  async subir(
    @Param('id') id: string,
    @Query() query: SubirDocumentoQuery,
    @Req() req: FastifyRequest,
    @CurrentUser() u: CurrentUserData,
  ) {
    let file: MultipartFile | undefined;
    try {
      file = await req.file();
    } catch (e) {
      throw this.mapMultipartError(e);
    }
    if (!file) throw new BadRequestException('Se requiere un archivo (multipart/form-data)');

    let contenido: Buffer;
    try {
      contenido = await file.toBuffer();
    } catch (e) {
      throw this.mapMultipartError(e);
    }

    return this.subirUC.execute({
      tramiteId: id,
      actor: actorFromUser(u),
      nombreArchivo: file.filename,
      mimeType: file.mimetype,
      contenido,
      visibilidad: query.visibilidad,
    });
  }

  /** Traduce errores de @fastify/multipart a códigos HTTP claros. */
  private mapMultipartError(e: unknown): Error {
    const code = (e as { code?: string })?.code;
    if (code === 'FST_REQ_FILE_TOO_LARGE') {
      return new PayloadTooLargeException('El archivo supera el tamaño máximo permitido');
    }
    return new BadRequestException('Se requiere un archivo válido (multipart/form-data)');
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  listar(@Param('id') id: string, @CurrentUser() u: CurrentUserData) {
    return this.listarUC.execute({ tramiteId: id, actor: actorFromUser(u) });
  }

  @Get(':documentoId')
  async descargar(
    @Param('id') id: string,
    @Param('documentoId') documentoId: string,
    @CurrentUser() u: CurrentUserData,
    @Res() reply: FastifyReply,
  ) {
    const { documento, contenido } = await this.descargarUC.execute({
      tramiteId: id,
      documentoId,
      actor: actorFromUser(u),
    });
    // Content-Length lo calcula Fastify del buffer (evita divergir de la metadata).
    reply
      .header('Content-Type', documento.mimeType)
      .header('Content-Disposition', this.contentDisposition(documento.nombreArchivo))
      .send(contenido);
  }

  /**
   * Content-Disposition seguro (RFC 6266/5987): el nombre viene del archivo que
   * subió el usuario, así que se sanitiza para el `filename=` ASCII (sin comillas
   * ni control chars) y se agrega `filename*` percent-encoded para el nombre real.
   */
  private contentDisposition(nombre: string): string {
    const ascii = nombre.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
    const encoded = encodeURIComponent(nombre);
    return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
  }

  @Delete(':documentoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminar(
    @Param('id') id: string,
    @Param('documentoId') documentoId: string,
    @CurrentUser() u: CurrentUserData,
  ) {
    await this.eliminarUC.execute({ tramiteId: id, documentoId, actor: actorFromUser(u) });
  }
}
