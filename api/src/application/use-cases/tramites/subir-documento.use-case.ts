import { TramiteRepository } from '../../../domain/repositories/tramite.repository';
import { DocumentoTramiteRepository } from '../../../domain/repositories/documento-tramite.repository';
import { StoragePort } from '../../ports/storage.port';
import { Visibilidad } from '../../../domain/tramites/enums/visibilidad.enum';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { Actor } from '../../dto/actor';
import { SubirDocumentoInput } from '../../dto/tramites/documento.input';
import { DocumentoView, toDocumentoView } from '../../dto/tramites/documento.view';
import {
  TramiteNoEncontradoError,
  VisibilidadNoPermitidaError,
} from '../../../domain/tramites/errors/tramite.errors';
import { autorizarVisibilidad } from './workflow-helpers';

/**
 * Sube un documento a un trámite: guarda el binario en el StoragePort y registra
 * los metadatos. No es transición de estado (sin MovimientoTramite ni UoW).
 * Solo quien puede ver el trámite puede subir; un externo no puede marcar INTERNA.
 */
export class SubirDocumentoUseCase {
  constructor(
    private readonly tramites: TramiteRepository,
    private readonly documentos: DocumentoTramiteRepository,
    private readonly storage: StoragePort,
  ) {}

  async execute(input: SubirDocumentoInput): Promise<DocumentoView> {
    const tramite = await this.tramites.findById(input.tramiteId);
    if (!tramite) throw new TramiteNoEncontradoError(input.tramiteId);

    autorizarVisibilidad(tramite, input.actor);
    const visibilidad = this.resolverVisibilidad(input.actor, input.visibilidad);

    const storageKey = await this.storage.save({
      contenido: input.contenido,
      nombreArchivo: input.nombreArchivo,
      mimeType: input.mimeType,
    });

    const documento = await this.documentos.create({
      tramiteId: tramite.id,
      nombreArchivo: input.nombreArchivo,
      mimeType: input.mimeType,
      size: input.contenido.length,
      storageKey,
      visibilidad,
      subidoPorTipo: input.actor.tipo,
      subidoPorId: input.actor.id,
    });
    return toDocumentoView(documento);
  }

  private resolverVisibilidad(actor: Actor, pedida?: Visibilidad): Visibilidad {
    if (actor.tipo === TipoUsuario.EXTERNO && pedida === Visibilidad.INTERNA) {
      throw new VisibilidadNoPermitidaError();
    }
    return pedida ?? Visibilidad.TODOS;
  }
}
