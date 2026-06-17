import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import {
  InternalTokenClaims,
  InternalTokenVerifier,
} from '../../application/ports/internal-token-verifier.port';
import { InternalTokenIssuer } from '../../application/ports/internal-token-issuer.port';

/**
 * MOCK de Microsoft Entra ID para desarrollo local.
 *
 * ── ¿Por qué un mock? ────────────────────────────────────────────────────
 *  - No queremos depender de un tenant real de Azure para levantar el proyecto.
 *  - Permite probar TODO el flujo interno (login → token → guard → autorización)
 *    de forma offline y reproducible (CI, docker, etc.).
 *
 * ── Forma del token ──────────────────────────────────────────────────────
 *  - Emitimos un JWT con los MISMOS claims que un access token v2.0 de Entra ID:
 *    `oid`, `preferred_username`/`email`, `roles`, `tid`, `aud`, `iss`.
 *  - Única diferencia con el real: lo firmamos con HS256 + secret local, en vez
 *    de RS256 con las claves privadas de Microsoft.
 *
 * ── Cómo se enchufa Entra ID REAL sin tocar el guard ─────────────────────
 *  El InternalAuthGuard depende del puerto `InternalTokenVerifier`, NO de esta
 *  clase. Para producción:
 *    1. Crear `EntraIdTokenVerifier implements InternalTokenVerifier` que valide
 *       el JWT contra las JWKS públicas de Microsoft (p. ej. con `jwks-rsa`),
 *       chequee `iss`/`aud`/`exp` y devuelva los MISMOS `InternalTokenClaims`.
 *    2. Cambiar el provider de `INTERNAL_TOKEN_VERIFIER` en el módulo (1 línea).
 *    3. El issuer y el endpoint de login interno se ELIMINAN: con Entra real, el
 *       token lo emite Microsoft tras el login MSAL en el frontend.
 *  El guard, los use cases y el dominio no se modifican.
 */
@Injectable()
export class MockEntraIdTokenService implements InternalTokenIssuer, InternalTokenVerifier {
  private readonly secret: string =
    process.env.INTERNAL_JWT_SECRET ?? process.env.JWT_SECRET ?? 'dev_internal_secret';
  private readonly expiresIn: string = process.env.INTERNAL_JWT_EXPIRES_IN ?? '8h';
  private readonly tenantId: string = process.env.AZURE_TENANT_ID || 'mock-tenant-id';
  private readonly audience: string = process.env.AZURE_CLIENT_ID || 'mock-client-id';

  issue(claims: InternalTokenClaims): string {
    // Payload con la forma de un access token v2.0 de Entra ID.
    const payload = {
      oid: claims.oid,
      preferred_username: claims.email,
      email: claims.email,
      roles: claims.roles,
      tid: this.tenantId,
      aud: this.audience,
      iss: `https://login.microsoftonline.com/${this.tenantId}/v2.0`,
    };
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
    } as unknown as jwt.SignOptions);
  }

  verify(token: string): InternalTokenClaims {
    const decoded = jwt.verify(token, this.secret) as Record<string, unknown>;
    return {
      oid: String(decoded.oid ?? ''),
      email: String(decoded.preferred_username ?? decoded.email ?? ''),
      roles: Array.isArray(decoded.roles) ? (decoded.roles as string[]) : [],
    };
  }
}
