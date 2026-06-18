import { ForbiddenError } from './domain-error';

/** La operación requiere un usuario interno (un externo la intentó) → 403. */
export class RequiereUsuarioInternoError extends ForbiddenError {
  constructor() {
    super('Esta operación requiere un usuario interno');
  }
}

/** La operación requiere rol ADMIN → 403. */
export class RequiereRolAdminError extends ForbiddenError {
  constructor() {
    super('Esta operación requiere rol de administrador');
  }
}
