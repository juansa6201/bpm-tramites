import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors/domain-error';
import { AccionMovimiento } from '../enums/accion-movimiento.enum';
import { EstadoTramite } from '../enums/estado-tramite.enum';

/** Trámite inexistente → 404. */
export class TramiteNoEncontradoError extends NotFoundError {
  constructor(id: string) {
    super(`Trámite ${id} no encontrado`);
  }
}

/** La acción no aplica al estado actual (regla de negocio) → 422. */
export class TransicionInvalidaError extends BusinessRuleError {
  constructor(accion: AccionMovimiento, estado: EstadoTramite) {
    super(`No se puede ejecutar ${accion} sobre un trámite en estado ${estado}`);
  }
}

/** El tipo/rol del usuario no puede ejecutar la acción → 403. */
export class AccionNoPermitidaError extends ForbiddenError {
  constructor(accion: AccionMovimiento) {
    super(`No tenés permisos para ejecutar ${accion}`);
  }
}

/** El interno no opera el área actual del trámite → 403. */
export class SinPermisoSobreAreaError extends ForbiddenError {
  constructor() {
    super('No tenés permisos sobre el área de este trámite');
  }
}

/** Un externo intenta operar un trámite en el que no participa → 403. */
export class ExternoNoParticipaError extends ForbiddenError {
  constructor() {
    super('No participás en este trámite');
  }
}

/** Otra operación modificó el trámite primero (bloqueo optimista) → 409. */
export class ConflictoDeConcurrenciaError extends ConflictError {
  constructor() {
    super('El trámite fue modificado por otra operación. Reintentá.');
  }
}

// --------------------------- Creación de trámites ---------------------------

/** Tipo de trámite inexistente → 404. */
export class TipoTramiteNoEncontradoError extends NotFoundError {
  constructor(id: string) {
    super(`Tipo de trámite ${id} no encontrado`);
  }
}

/** Tipo de trámite inactivo → 422. */
export class TipoTramiteInactivoError extends BusinessRuleError {
  constructor() {
    super('El tipo de trámite no está activo');
  }
}

/** El tipo no permite que un externo inicie el trámite → 422. */
export class TipoNoPermiteInicioExternoError extends BusinessRuleError {
  constructor() {
    super('Este tipo de trámite no permite inicio externo');
  }
}

/** El actor no puede iniciar trámites de ese circuito → 403. */
export class OrigenNoPermitidoParaActorError extends ForbiddenError {
  constructor() {
    super('No podés iniciar trámites de este circuito');
  }
}

/** El circuito Interno→Externo requiere vincular un usuario externo → 422. */
export class TramiteRequiereExternoError extends BusinessRuleError {
  constructor() {
    super('Este circuito requiere vincular un usuario externo');
  }
}

/** No se pudo generar un número único tras varios intentos → 409. */
export class NumeroDuplicadoError extends ConflictError {
  constructor() {
    super('No se pudo generar un número único para el trámite. Reintentá.');
  }
}
