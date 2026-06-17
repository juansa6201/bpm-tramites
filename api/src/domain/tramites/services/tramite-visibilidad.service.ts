import { Tramite } from '../entities/tramite.entity';
import { TipoUsuario } from '../../usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../usuarios/enums/rol-interno.enum';

/** Actor para evaluar visibilidad (primitivos de dominio, sin acoplar a Nest). */
export interface ActorVisibilidad {
  tipo: TipoUsuario;
  id: string;
  rol?: RolInterno;
  areaId?: string;
}

/**
 * Política de visibilidad de un trámite (servicio de dominio puro).
 *
 * Reglas del enunciado:
 *  - Un externo solo ve trámites donde participa (no ve trámites ajenos).
 *  - Un admin o un auditor ven todo.
 *  - Un operador/supervisor/mesa solo ven trámites de su área.
 */
export class TramiteVisibilidadPolicy {
  static puedeVer(tramite: Tramite, actor: ActorVisibilidad): boolean {
    if (actor.tipo === TipoUsuario.EXTERNO) {
      return tramite.participaElExterno(actor.id);
    }
    if (actor.rol === RolInterno.ADMIN || actor.rol === RolInterno.AUDITOR) {
      return true;
    }
    return actor.areaId !== undefined && tramite.perteneceAlArea(actor.areaId);
  }
}
