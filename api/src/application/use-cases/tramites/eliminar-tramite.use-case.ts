import { TramiteRepository } from '../../../domain/repositories/tramite.repository';
import { Tramite } from '../../../domain/tramites/entities/tramite.entity';
import { EliminarTramiteInput } from '../../dto/tramites/editar-tramite.input';
import { Actor } from '../../dto/actor';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../../domain/usuarios/enums/rol-interno.enum';
import {
  TramiteNoEncontradoError,
  SinPermisoParaEliminarTramiteError,
} from '../../../domain/tramites/errors/tramite.errors';
import { requireAdmin } from '../authz';
import { autorizarVisibilidad } from './workflow-helpers';

/**
 * Elimina un trámite con dos semánticas:
 *  - BORRADOR → hard delete (creador o ADMIN). El cascade borra su agregado.
 *  - cualquier otro estado → soft delete, solo ADMIN (se conserva la auditoría).
 *
 * Un trámite ya en circuito no se "borra" desde la operatoria: se CANCELA por el
 * workflow. El soft delete es una baja administrativa que lo oculta del sistema.
 */
export class EliminarTramiteUseCase {
  constructor(private readonly tramites: TramiteRepository) {}

  async execute(input: EliminarTramiteInput): Promise<void> {
    const tramite = await this.tramites.findById(input.tramiteId);
    if (!tramite) throw new TramiteNoEncontradoError(input.tramiteId);

    if (tramite.esBorrador()) {
      autorizarVisibilidad(tramite, input.actor);
      if (!this.puedeBorrarBorrador(tramite, input.actor)) {
        throw new SinPermisoParaEliminarTramiteError();
      }
      await this.tramites.delete(tramite.id);
      return;
    }

    // No es borrador: baja administrativa (soft delete), solo ADMIN.
    requireAdmin(input.actor);
    await this.tramites.softDelete(tramite.id);
  }

  private puedeBorrarBorrador(tramite: Tramite, actor: Actor): boolean {
    if (tramite.fueCreadoPor(actor.tipo, actor.id)) return true;
    return actor.tipo === TipoUsuario.INTERNO && actor.rol === RolInterno.ADMIN;
  }
}
