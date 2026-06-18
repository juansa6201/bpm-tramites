import { Actor } from '../../application/dto/actor';
import { TipoUsuario } from '../../domain/usuarios/enums/tipo-usuario.enum';
import { CurrentUserData } from '../decorators/current-user.decorator';

/**
 * Traduce la identidad HTTP (@CurrentUser) al Actor de aplicación.
 * Para internos, rol y areaId siempre están presentes (los setea el guard).
 */
export function actorFromUser(user: CurrentUserData): Actor {
  return user.tipo === TipoUsuario.INTERNO
    ? { tipo: TipoUsuario.INTERNO, id: user.id, rol: user.rol!, areaId: user.areaId! }
    : { tipo: TipoUsuario.EXTERNO, id: user.id };
}
