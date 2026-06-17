import { UsuarioExternoRepository } from '../../../domain/usuarios/repositories/usuario-externo.repository';
import { PasswordHasher } from '../../ports/password-hasher.port';
import { TokenService } from '../../ports/token-service.port';
import { LoginExternalInput } from '../../dto/auth/login-external.input';
import { AuthTokenResult } from '../../dto/auth/auth-result';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import {
  CredencialesInvalidasError,
  UsuarioExternoBloqueadoError,
  UsuarioExternoNoActivoError,
} from '../../../domain/usuarios/errors/usuario-externo.errors';

/**
 * Login de un usuario externo: valida credenciales y emite un JWT.
 * Clase plana: no conoce Nest.
 */
export class LoginExternalUserUseCase {
  constructor(
    private readonly usuarios: UsuarioExternoRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: LoginExternalInput): Promise<AuthTokenResult> {
    const usuario = await this.usuarios.findByEmail(input.email);

    // Mismo error para "no existe" y "password incorrecto": no filtramos cuál falló.
    if (!usuario || !usuario.passwordHash) {
      throw new CredencialesInvalidasError();
    }
    const passwordOk = await this.hasher.compare(input.password, usuario.passwordHash);
    if (!passwordOk) {
      throw new CredencialesInvalidasError();
    }

    // Recién después de validar credenciales chequeamos el estado de la cuenta.
    if (usuario.estaBloqueado()) {
      throw new UsuarioExternoBloqueadoError();
    }
    if (!usuario.puedeAutenticarse()) {
      throw new UsuarioExternoNoActivoError();
    }

    const accessToken = this.tokens.sign({
      sub: usuario.id,
      email: usuario.email,
      tipo: TipoUsuario.EXTERNO,
    });

    return {
      accessToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        tipo: TipoUsuario.EXTERNO,
      },
    };
  }
}
