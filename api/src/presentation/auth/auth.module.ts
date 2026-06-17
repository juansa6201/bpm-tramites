import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { RegisterExternalUserUseCase } from '../../application/use-cases/auth/register-external-user.use-case';
import { LoginExternalUserUseCase } from '../../application/use-cases/auth/login-external-user.use-case';
import { LoginInternalMockUseCase } from '../../application/use-cases/auth/login-internal-mock.use-case';
import {
  INTERNAL_TOKEN_ISSUER,
  INTERNAL_TOKEN_VERIFIER,
  PASSWORD_HASHER,
  TOKEN_SERVICE,
  USUARIO_EXTERNO_REPOSITORY,
  USUARIO_INTERNO_REPOSITORY,
} from '../../application/tokens';
import { UsuarioExternoRepository } from '../../domain/usuarios/repositories/usuario-externo.repository';
import { UsuarioInternoRepository } from '../../domain/usuarios/repositories/usuario-interno.repository';
import { PasswordHasher } from '../../application/ports/password-hasher.port';
import { TokenService } from '../../application/ports/token-service.port';
import { InternalTokenIssuer } from '../../application/ports/internal-token-issuer.port';
import { PrismaUsuarioExternoRepository } from '../../infrastructure/persistence/repositories/prisma-usuario-externo.repository';
import { PrismaUsuarioInternoRepository } from '../../infrastructure/persistence/repositories/prisma-usuario-interno.repository';
import { BcryptPasswordHasher } from '../../infrastructure/security/bcrypt-password-hasher';
import { JwtTokenService } from '../../infrastructure/security/jwt-token.service';
import { MockEntraIdTokenService } from '../../infrastructure/security/mock-entra-id-token.service';
import { ExternalAuthGuard } from '../guards/external-auth.guard';
import { InternalAuthGuard } from '../guards/internal-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [
    // --- Adapters de infraestructura, atados a sus tokens de DI ---
    { provide: USUARIO_EXTERNO_REPOSITORY, useClass: PrismaUsuarioExternoRepository },
    { provide: USUARIO_INTERNO_REPOSITORY, useClass: PrismaUsuarioInternoRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },

    // El mock implementa issuer + verifier; una sola instancia para ambos tokens.
    MockEntraIdTokenService,
    { provide: INTERNAL_TOKEN_ISSUER, useExisting: MockEntraIdTokenService },
    { provide: INTERNAL_TOKEN_VERIFIER, useExisting: MockEntraIdTokenService },

    // --- Casos de uso (application): clases planas cableadas con useFactory ---
    {
      provide: RegisterExternalUserUseCase,
      useFactory: (usuarios: UsuarioExternoRepository, hasher: PasswordHasher) =>
        new RegisterExternalUserUseCase(usuarios, hasher),
      inject: [USUARIO_EXTERNO_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: LoginExternalUserUseCase,
      useFactory: (
        usuarios: UsuarioExternoRepository,
        hasher: PasswordHasher,
        tokens: TokenService,
      ) => new LoginExternalUserUseCase(usuarios, hasher, tokens),
      inject: [USUARIO_EXTERNO_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE],
    },
    {
      provide: LoginInternalMockUseCase,
      useFactory: (usuarios: UsuarioInternoRepository, issuer: InternalTokenIssuer) =>
        new LoginInternalMockUseCase(usuarios, issuer),
      inject: [USUARIO_INTERNO_REPOSITORY, INTERNAL_TOKEN_ISSUER],
    },

    ExternalAuthGuard,
    InternalAuthGuard,
  ],
})
export class AuthModule {}
