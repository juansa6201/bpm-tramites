import { TramiteRepository } from '../../../domain/repositories/tramite.repository';
import { ComentarioTramiteRepository } from '../../../domain/repositories/comentario-tramite.repository';
import { ListarComentariosInput } from '../../dto/tramites/listar-comentarios.input';
import { ComentarioView, toComentarioView } from '../../dto/tramites/comentario.view';
import { TramiteNoEncontradoError } from '../../../domain/tramites/errors/tramite.errors';
import { autorizarVisibilidad } from './workflow-helpers';

/**
 * Lista los comentarios visibles de un trámite.
 *
 * Doble filtro de visibilidad: (1) el actor debe poder ver el trámite, y
 * (2) cada comentario INTERNA se oculta a los externos (regla en la entidad
 * ComentarioTramite.esVisiblePara). El filtrado por comentario es en memoria
 * a propósito: es la lista acotada de UN trámite y la regla vive en el dominio.
 */
export class ListarComentariosUseCase {
  constructor(
    private readonly tramites: TramiteRepository,
    private readonly comentarios: ComentarioTramiteRepository,
  ) {}

  async execute(input: ListarComentariosInput): Promise<ComentarioView[]> {
    const tramite = await this.tramites.findById(input.tramiteId);
    if (!tramite) throw new TramiteNoEncontradoError(input.tramiteId);

    autorizarVisibilidad(tramite, input.actor);

    const comentarios = await this.comentarios.listByTramite(tramite.id);
    return comentarios.filter((c) => c.esVisiblePara(input.actor.tipo)).map(toComentarioView);
  }
}
