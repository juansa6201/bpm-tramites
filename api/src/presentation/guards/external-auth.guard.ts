import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TOKEN_SERVICE } from '../../application/tokens';
import { TokenService } from '../../application/ports/token-service.port';
import { TipoUsuario } from '../../domain/usuarios/enums/tipo-usuario.enum';
import { CurrentUserData } from '../decorators/current-user.decorator';

/**
 * Protege rutas para usuarios EXTERNOS autenticados con JWT.
 * Si pasa, deja request.user disponible para @CurrentUser().
 */
@Injectable()
export class ExternalAuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_SERVICE) private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;

    // 1) Debe venir el header Authorization: Bearer <token>
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticación ausente');
    }
    const token = header.slice('Bearer '.length).trim();

    // 2) El token debe ser válido (firma + expiración)
    let payload: TokenPayloadLike;
    try {
      payload = this.tokens.verify(token);
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    // 3) La identidad debe ser EXTERNA (un interno no entra por acá)
    if (payload.tipo !== TipoUsuario.EXTERNO) {
      throw new ForbiddenException('Se requiere una identidad externa');
    }

    // 4) Adjuntamos el usuario al request para los handlers
    const user: CurrentUserData = {
      id: payload.sub,
      email: payload.email,
      tipo: payload.tipo,
    };
    request.user = user;
    return true;
  }
}

type TokenPayloadLike = { sub: string; email: string; tipo: TipoUsuario };
