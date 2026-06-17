/**
 * Claims que nos interesan de un token de identidad interna.
 * Coinciden con los claims estándar de un access token v2.0 de Microsoft Entra ID.
 */
export interface InternalTokenClaims {
  oid: string; // Object ID del usuario en Entra ID
  email: string; // preferred_username / email
  roles: string[]; // App roles asignados en Entra ID
}

/**
 * Puerto de verificación de tokens internos.
 * - Mock: valida un JWT HS256 firmado localmente.
 * - Real (Entra ID): validaría RS256 contra las JWKS públicas de Microsoft.
 *
 * El guard depende SOLO de esta interfaz → no cambia al pasar a Entra ID real.
 */
export interface InternalTokenVerifier {
  verify(token: string): InternalTokenClaims;
}
