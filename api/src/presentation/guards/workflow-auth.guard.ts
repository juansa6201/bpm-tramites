import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  INTERNAL_TOKEN_VERIFIER,
  TOKEN_SERVICE,
  USUARIO_INTERNO_REPOSITORY,
} from '../../application/tokens';
import { InternalTokenVerifier } from '../../application/ports/internal-token-verifier.port';
import { TokenService } from '../../application/ports/token-service.port';
import { UsuarioInternoRepository } from '../../domain/usuarios/repositories/usuario-interno.repository';
import { TipoUsuario } from '../../domain/usuarios/enums/tipo-usuario.enum';
import { CurrentUserData } from '../decorators/current-user.decorator';

/**
 * Guard de workflow: acepta identidad INTERNA o EXTERNA y deja request.user
 * con el tipo correcto. La autorización fina (qué puede hacer cada uno) la
 * resuelven el WorkflowStateMachine y los casos de uso, no el guard.
 */
@Injectable()
export class WorkflowAuthGuard implements CanActivate {
  constructor(
    @Inject(INTERNAL_TOKEN_VERIFIER) private readonly internalVerifier: InternalTokenVerifier,
    @Inject(USUARIO_INTERNO_REPOSITORY) private readonly internos: UsuarioInternoRepository,
    @Inject(TOKEN_SERVICE) private readonly externalTokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticación ausente');
    }
    const token = header.slice('Bearer '.length).trim();

    // 1) ¿Token interno (Entra ID / mock con claim oid)?
    try {
      const claims = this.internalVerifier.verify(token);
      if (claims.oid) {
        const interno = await this.internos.findByAzureObjectId(claims.oid);
        if (!interno) throw new UnauthorizedException('Identidad interna no provisionada');
        if (!interno.estaActivo()) throw new ForbiddenException('Usuario interno inactivo');
        const user: CurrentUserData = {
          id: interno.id,
          email: interno.email,
          tipo: TipoUsuario.INTERNO,
          rol: interno.rol,
          areaId: interno.areaId,
        };
        request.user = user;
        return true;
      }
    } catch (e) {
      // Si ya es un error de auth interno (provisionado/inactivo) lo propagamos.
      if (e instanceof ForbiddenException || e instanceof UnauthorizedException) throw e;
      // Si solo falló la verificación como interno, probamos como externo.
    }

    // 2) ¿Token externo?
    try {
      const payload = this.externalTokens.verify(token);
      if (payload.tipo === TipoUsuario.EXTERNO) {
        const user: CurrentUserData = {
          id: payload.sub,
          email: payload.email,
          tipo: TipoUsuario.EXTERNO,
        };
        request.user = user;
        return true;
      }
    } catch {
      // cae al rechazo final
    }

    throw new UnauthorizedException('Token inválido o expirado');
  }
}
