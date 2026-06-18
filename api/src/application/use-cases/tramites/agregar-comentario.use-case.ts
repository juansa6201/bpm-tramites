import { TramiteRepository } from '../../../domain/repositories/tramite.repository';
import { ComentarioTramiteRepository } from '../../../domain/repositories/comentario-tramite.repository';
import { Visibilidad } from '../../../domain/tramites/enums/visibilidad.enum';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { Actor } from '../../dto/actor';
import { AgregarComentarioInput } from '../../dto/tramites/agregar-comentario.input';
import { ComentarioView, toComentarioView } from '../../dto/tramites/comentario.view';
import {
  TramiteNoEncontradoError,
  VisibilidadNoPermitidaError,
} from '../../../domain/tramites/errors/tramite.errors';
import { autorizarVisibilidad } from './workflow-helpers';

/**
 * Agrega un comentario a un trámite.
 *
 * No es una transición de estado: NO genera MovimientoTramite ni necesita el
 * UnitOfWork. Solo quien puede VER el trámite puede comentarlo. Un externo no
 * puede marcar un comentario como INTERNA (reservado al equipo interno).
 */
export class AgregarComentarioUseCase {
  constructor(
    private readonly tramites: TramiteRepository,
    private readonly comentarios: ComentarioTramiteRepository,
  ) {}

  async execute(input: AgregarComentarioInput): Promise<ComentarioView> {
    const tramite = await this.tramites.findById(input.tramiteId);
    if (!tramite) throw new TramiteNoEncontradoError(input.tramiteId);

    autorizarVisibilidad(tramite, input.actor);

    const comentario = await this.comentarios.create({
      tramiteId: tramite.id,
      mensaje: input.mensaje,
      visibilidad: this.resolverVisibilidad(input.actor, input.visibilidad),
      autorTipo: input.actor.tipo,
      autorId: input.actor.id,
    });
    return toComentarioView(comentario);
  }

  private resolverVisibilidad(actor: Actor, pedida?: Visibilidad): Visibilidad {
    if (actor.tipo === TipoUsuario.EXTERNO && pedida === Visibilidad.INTERNA) {
      throw new VisibilidadNoPermitidaError();
    }
    return pedida ?? Visibilidad.TODOS;
  }
}
