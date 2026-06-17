import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import {
  BusinessRuleError,
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../domain/shared/errors/domain-error';

/**
 * Traduce los errores de dominio a códigos HTTP.
 * Es el ÚNICO lugar donde el dominio "se entera" de HTTP (indirectamente).
 */
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();

    let status: number = HttpStatus.UNPROCESSABLE_ENTITY; // 422 por defecto
    if (error instanceof NotFoundError)
      status = HttpStatus.NOT_FOUND; // 404
    else if (error instanceof UnauthorizedError)
      status = HttpStatus.UNAUTHORIZED; // 401
    else if (error instanceof ForbiddenError)
      status = HttpStatus.FORBIDDEN; // 403
    else if (error instanceof ConflictError)
      status = HttpStatus.CONFLICT; // 409
    else if (error instanceof BusinessRuleError) status = HttpStatus.UNPROCESSABLE_ENTITY; // 422

    reply.status(status).send({
      statusCode: status,
      error: error.name,
      message: error.message,
    });
  }
}
