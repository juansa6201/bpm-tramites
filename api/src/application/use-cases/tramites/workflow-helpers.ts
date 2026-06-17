import { TransitionResult } from '../../../domain/services/workflow-state-machine';
import { AccionMovimiento } from '../../../domain/tramites/enums/accion-movimiento.enum';
import { EstadoTramite } from '../../../domain/tramites/enums/estado-tramite.enum';
import { Tramite } from '../../../domain/tramites/entities/tramite.entity';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../../domain/usuarios/enums/rol-interno.enum';
import { Actor } from '../../dto/actor';
import {
  AccionNoPermitidaError,
  ExternoNoParticipaError,
  SinPermisoSobreAreaError,
  TransicionInvalidaError,
} from '../../../domain/tramites/errors/tramite.errors';

/** rolUsuario para el state machine: solo aplica a internos. */
export function rolDe(actor: Actor): RolInterno | undefined {
  return actor.tipo === TipoUsuario.INTERNO ? actor.rol : undefined;
}

/**
 * Convierte el resultado del WorkflowStateMachine en estadoNuevo, o lanza:
 *  - ESTADO_INVALIDO → 422 (regla de negocio)
 *  - TIPO/ROL        → 403 (no autorizado)
 */
export function resolverTransicion(
  resultado: TransitionResult,
  accion: AccionMovimiento,
  estado: EstadoTramite,
): EstadoTramite {
  if (!resultado.permitida || !resultado.estadoNuevo) {
    throw resultado.motivo === 'ESTADO_INVALIDO'
      ? new TransicionInvalidaError(accion, estado)
      : new AccionNoPermitidaError(accion);
  }
  return resultado.estadoNuevo;
}

/**
 * Autorización de scope (más allá del rol, que ya validó el state machine):
 *  - interno: opera su área (admin ve todo)
 *  - externo: debe participar en el trámite
 */
export function autorizarActor(tramite: Tramite, actor: Actor): void {
  if (actor.tipo === TipoUsuario.INTERNO) {
    if (actor.rol !== RolInterno.ADMIN && !tramite.perteneceAlArea(actor.areaId)) {
      throw new SinPermisoSobreAreaError();
    }
  } else if (!tramite.participaElExterno(actor.id)) {
    throw new ExternoNoParticipaError();
  }
}
