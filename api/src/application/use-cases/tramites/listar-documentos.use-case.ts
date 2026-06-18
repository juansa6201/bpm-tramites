import { TramiteRepository } from '../../../domain/repositories/tramite.repository';
import { DocumentoTramiteRepository } from '../../../domain/repositories/documento-tramite.repository';
import { ListarDocumentosInput } from '../../dto/tramites/documento.input';
import { DocumentoView, toDocumentoView } from '../../dto/tramites/documento.view';
import { TramiteNoEncontradoError } from '../../../domain/tramites/errors/tramite.errors';
import { autorizarVisibilidad } from './workflow-helpers';

/**
 * Lista los documentos visibles de un trámite. Doble filtro: el actor debe ver
 * el trámite, y cada documento INTERNA se oculta a los externos (regla en la
 * entidad DocumentoTramite.esVisiblePara).
 */
export class ListarDocumentosUseCase {
  constructor(
    private readonly tramites: TramiteRepository,
    private readonly documentos: DocumentoTramiteRepository,
  ) {}

  async execute(input: ListarDocumentosInput): Promise<DocumentoView[]> {
    const tramite = await this.tramites.findById(input.tramiteId);
    if (!tramite) throw new TramiteNoEncontradoError(input.tramiteId);

    autorizarVisibilidad(tramite, input.actor);

    const documentos = await this.documentos.listByTramite(tramite.id);
    return documentos.filter((d) => d.esVisiblePara(input.actor.tipo)).map(toDocumentoView);
  }
}
