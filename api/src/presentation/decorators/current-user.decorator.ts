import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TipoUsuario } from '../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../domain/usuarios/enums/rol-interno.enum';

/** Identidad que un guard adjunta al request. rol/areaId solo aplican a internos. */
export interface CurrentUserData {
  id: string;
  email: string;
  tipo: TipoUsuario;
  rol?: RolInterno;
  areaId?: string;
}

/**
 * @CurrentUser() -> inyecta el usuario autenticado en el handler.
 * @CurrentUser('id') -> inyecta solo ese campo.
 * Lee request.user, que el guard (External o Internal) dejó seteado.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData | undefined;
    return data ? user?.[data] : user;
  },
);
