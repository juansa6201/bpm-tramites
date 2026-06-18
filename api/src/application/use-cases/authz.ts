import { Actor } from '../dto/actor';
import { TipoUsuario } from '../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../domain/usuarios/enums/rol-interno.enum';
import {
  RequiereRolAdminError,
  RequiereUsuarioInternoError,
} from '../../domain/shared/errors/authz.errors';

/** Restringe la operación a usuarios internos (un externo recibe 403). */
export function requireInterno(actor: Actor): void {
  if (actor.tipo !== TipoUsuario.INTERNO) {
    throw new RequiereUsuarioInternoError();
  }
}

/** Restringe la operación a rol ADMIN. */
export function requireAdmin(actor: Actor): void {
  if (actor.tipo !== TipoUsuario.INTERNO || actor.rol !== RolInterno.ADMIN) {
    throw new RequiereRolAdminError();
  }
}
