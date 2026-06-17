import { ForbiddenError, UnauthorizedError } from '../../shared/errors/domain-error';

/** El email (login) o el oid (guard) no mapea a ningún interno → 401. */
export class UsuarioInternoNoEncontradoError extends UnauthorizedError {
  constructor() {
    super('Usuario interno no encontrado');
  }
}

/** Usuario interno inactivo → 403. */
export class UsuarioInternoInactivoError extends ForbiddenError {
  constructor() {
    super('El usuario interno está inactivo');
  }
}
