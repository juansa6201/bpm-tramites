import { TipoUsuario } from '../../domain/usuarios/enums/tipo-usuario.enum';

/** Contenido del JWT. `sub` = id del usuario. */
export interface TokenPayload {
  sub: string;
  email: string;
  tipo: TipoUsuario;
}

/**
 * Puerto de emisión/verificación de tokens. Implementado en infrastructure (JWT).
 */
export interface TokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}
