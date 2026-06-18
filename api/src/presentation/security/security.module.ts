import { Module } from '@nestjs/common';
import {
  INTERNAL_TOKEN_VERIFIER,
  TOKEN_SERVICE,
  USUARIO_INTERNO_REPOSITORY,
} from '../../application/tokens';
import { PrismaUsuarioInternoRepository } from '../../infrastructure/persistence/repositories/prisma-usuario-interno.repository';
import { MockEntraIdTokenService } from '../../infrastructure/security/mock-entra-id-token.service';
import { JwtTokenService } from '../../infrastructure/security/jwt-token.service';

/**
 * Provee las dependencias del WorkflowAuthGuard (identidad interna + externa)
 * y las exporta por token. Cada módulo consumidor importa este módulo y declara
 * WorkflowAuthGuard en SUS providers: con @UseGuards(clase) Nest construye el
 * guard en el contexto del controller, resolviendo estos tokens importados. Así
 * el cableado de seguridad vive una sola vez, acá.
 */
@Module({
  providers: [
    { provide: USUARIO_INTERNO_REPOSITORY, useClass: PrismaUsuarioInternoRepository },
    MockEntraIdTokenService,
    { provide: INTERNAL_TOKEN_VERIFIER, useExisting: MockEntraIdTokenService },
    JwtTokenService,
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
  exports: [USUARIO_INTERNO_REPOSITORY, INTERNAL_TOKEN_VERIFIER, TOKEN_SERVICE],
})
export class SecurityModule {}
