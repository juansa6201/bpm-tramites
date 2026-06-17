import { UsuarioInternoRepository } from '../../../domain/usuarios/repositories/usuario-interno.repository';
import { InternalTokenIssuer } from '../../ports/internal-token-issuer.port';
import { LoginInternalInput } from '../../dto/auth/login-internal.input';
import { InternalAuthTokenResult } from '../../dto/auth/auth-result';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import {
  UsuarioInternoInactivoError,
  UsuarioInternoNoEncontradoError,
} from '../../../domain/usuarios/errors/usuario-interno.errors';

/**
 * Login interno MOCK: toma un interno de los seeds (por email) y emite un token
 * con la MISMA forma que Entra ID (claims oid/email/roles).
 *
 * Con Entra ID real este caso de uso NO existe: el token lo emite Microsoft.
 */
export class LoginInternalMockUseCase {
  constructor(
    private readonly usuarios: UsuarioInternoRepository,
    private readonly issuer: InternalTokenIssuer,
  ) {}

  async execute(input: LoginInternalInput): Promise<InternalAuthTokenResult> {
    const usuario = await this.usuarios.findByEmail(input.email);
    if (!usuario) {
      throw new UsuarioInternoNoEncontradoError();
    }
    if (!usuario.estaActivo()) {
      throw new UsuarioInternoInactivoError();
    }

    // El claim `oid` será lo que el guard use para re-mapear al usuario interno.
    const accessToken = this.issuer.issue({
      oid: usuario.azureObjectId,
      email: usuario.email,
      roles: [usuario.rol],
    });

    return {
      accessToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        tipo: TipoUsuario.INTERNO,
      },
    };
  }
}
