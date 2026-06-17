import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { INTERNAL_TOKEN_VERIFIER, USUARIO_INTERNO_REPOSITORY } from '../../application/tokens';
import {
  InternalTokenClaims,
  InternalTokenVerifier,
} from '../../application/ports/internal-token-verifier.port';
import { UsuarioInternoRepository } from '../../domain/usuarios/repositories/usuario-interno.repository';
import { TipoUsuario } from '../../domain/usuarios/enums/tipo-usuario.enum';
import { CurrentUserData } from '../decorators/current-user.decorator';

/**
 * Protege rutas para usuarios INTERNOS.
 *
 * Pasos (idénticos con mock o Entra ID real):
 *  1. Lee el Bearer token.
 *  2. Lo verifica vía el puerto InternalTokenVerifier (mock HS256 / real RS256+JWKS).
 *  3. Mapea el claim `oid` al usuario interno por `azureObjectId`.
 *  4. Verifica que esté activo y adjunta la identidad al request.
 *
 * Cambiar de mock a Entra ID real NO toca este archivo: solo cambia qué
 * implementación de InternalTokenVerifier inyecta el módulo.
 */
@Injectable()
export class InternalAuthGuard implements CanActivate {
  constructor(
    @Inject(INTERNAL_TOKEN_VERIFIER) private readonly verifier: InternalTokenVerifier,
    @Inject(USUARIO_INTERNO_REPOSITORY) private readonly usuarios: UsuarioInternoRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticación ausente');
    }
    const token = header.slice('Bearer '.length).trim();

    let claims: InternalTokenClaims;
    try {
      claims = this.verifier.verify(token);
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    // Un token válido pero SIN `oid` no es una identidad interna (p. ej. un token
    // externo verificado con el mismo secret en modo mock) → 403, no 401.
    if (!claims.oid) {
      throw new ForbiddenException('Se requiere una identidad interna');
    }

    // Mapeo de identidad Azure → usuario interno (por azureObjectId = oid).
    const usuario = await this.usuarios.findByAzureObjectId(claims.oid);
    if (!usuario) {
      throw new UnauthorizedException('Identidad interna no provisionada');
    }
    if (!usuario.estaActivo()) {
      throw new ForbiddenException('Usuario interno inactivo');
    }

    const user: CurrentUserData = {
      id: usuario.id,
      email: usuario.email,
      tipo: TipoUsuario.INTERNO,
      rol: usuario.rol,
      areaId: usuario.areaId,
    };
    request.user = user;
    return true;
  }
}
