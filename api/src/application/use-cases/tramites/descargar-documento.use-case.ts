import { TramiteRepository } from '../../../domain/repositories/tramite.repository';
import { DocumentoTramiteRepository } from '../../../domain/repositories/documento-tramite.repository';
import { StoragePort } from '../../ports/storage.port';
import {
  DescargarDocumentoInput,
  DescargarDocumentoResult,
} from '../../dto/tramites/documento.input';
import { toDocumentoView } from '../../dto/tramites/documento.view';
import {
  DocumentoNoEncontradoError,
  TramiteNoEncontradoError,
} from '../../../domain/tramites/errors/tramite.errors';
import { autorizarVisibilidad } from './workflow-helpers';

/**
 * Devuelve el binario de un documento más sus metadatos. Un documento no visible
 * para el actor (INTERNA visto por un externo) se trata como inexistente (404),
 * para no filtrar su existencia.
 */
export class DescargarDocumentoUseCase {
  constructor(
    private readonly tramites: TramiteRepository,
    private readonly documentos: DocumentoTramiteRepository,
    private readonly storage: StoragePort,
  ) {}

  async execute(input: DescargarDocumentoInput): Promise<DescargarDocumentoResult> {
    const tramite = await this.tramites.findById(input.tramiteId);
    if (!tramite) throw new TramiteNoEncontradoError(input.tramiteId);

    autorizarVisibilidad(tramite, input.actor);

    const documento = await this.documentos.findById(input.documentoId);
    if (
      !documento ||
      documento.tramiteId !== tramite.id ||
      !documento.esVisiblePara(input.actor.tipo)
    ) {
      throw new DocumentoNoEncontradoError(input.documentoId);
    }

    const contenido = await this.storage.read(documento.storageKey);
    if (!contenido) throw new DocumentoNoEncontradoError(input.documentoId);

    return { documento: toDocumentoView(documento), contenido };
  }
}
