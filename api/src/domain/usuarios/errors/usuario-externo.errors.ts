import {
  BusinessRuleError,
  ForbiddenError,
  UnauthorizedError,
} from '../../shared/errors/domain-error';

/** Email duplicado al registrar → 422. */
export class EmailEnUsoError extends BusinessRuleError {
  constructor(email: string) {
    super(`El email "${email}" ya está registrado`);
  }
}

/** Documento duplicado al registrar → 422. */
export class DocumentoEnUsoError extends BusinessRuleError {
  constructor(documento: string) {
    super(`El documento "${documento}" ya está registrado`);
  }
}

/** Email inexistente o password incorrecto → 401 (sin filtrar cuál falló). */
export class CredencialesInvalidasError extends UnauthorizedError {
  constructor() {
    super('Credenciales inválidas');
  }
}

/** Usuario bloqueado → 403. */
export class UsuarioExternoBloqueadoError extends ForbiddenError {
  constructor() {
    super('El usuario externo está bloqueado');
  }
}

/** Usuario aún no verificado/activo → 403. */
export class UsuarioExternoNoActivoError extends ForbiddenError {
  constructor() {
    super('El usuario externo no está activo. Verificá tu cuenta para poder ingresar.');
  }
}
