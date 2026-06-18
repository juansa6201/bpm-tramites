import { BusinessRuleError, NotFoundError } from '../../shared/errors/domain-error';

/** Área inexistente → 404. */
export class AreaNoEncontradaError extends NotFoundError {
  constructor(id: string) {
    super(`Área ${id} no encontrada`);
  }
}

/** Código de área duplicado → 422. */
export class CodigoAreaEnUsoError extends BusinessRuleError {
  constructor(codigo: string) {
    super(`El código de área "${codigo}" ya está en uso`);
  }
}

/** Código de tipo de trámite duplicado → 422. */
export class CodigoTipoTramiteEnUsoError extends BusinessRuleError {
  constructor(codigo: string) {
    super(`El código de tipo de trámite "${codigo}" ya está en uso`);
  }
}
