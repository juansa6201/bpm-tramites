/**
 * Base de todos los errores de dominio. No conoce HTTP.
 * Un exception filter en presentation traduce cada categoría al código correcto.
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Violación de una regla de negocio → HTTP 422. */
export abstract class BusinessRuleError extends DomainError {}

/** Recurso inexistente → HTTP 404. */
export abstract class NotFoundError extends DomainError {}

/** No autenticado → HTTP 401. */
export abstract class UnauthorizedError extends DomainError {}

/** Autenticado pero sin permisos → HTTP 403. */
export abstract class ForbiddenError extends DomainError {}

/** Conflicto de concurrencia (bloqueo optimista) → HTTP 409. */
export abstract class ConflictError extends DomainError {}
