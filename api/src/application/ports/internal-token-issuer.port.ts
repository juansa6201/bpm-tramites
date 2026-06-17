import { InternalTokenClaims } from './internal-token-verifier.port';

/**
 * Puerto de emisión de tokens internos.
 *
 * Existe SOLO para el mock local: con Entra ID real, los tokens los emite
 * Microsoft tras el login MSAL en el frontend, así que este puerto y el
 * endpoint de login interno desaparecen.
 */
export interface InternalTokenIssuer {
  issue(claims: InternalTokenClaims): string;
}
