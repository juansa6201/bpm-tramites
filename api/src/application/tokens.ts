/**
 * Tokens de inyección de dependencias (Symbols = JS puro, no import de Nest).
 * Asocian cada interfaz (domain/application) con su implementación (infrastructure)
 * en el módulo de presentation.
 */
export const USUARIO_EXTERNO_REPOSITORY = Symbol('UsuarioExternoRepository');
export const USUARIO_INTERNO_REPOSITORY = Symbol('UsuarioInternoRepository');
export const PASSWORD_HASHER = Symbol('PasswordHasher');
export const TOKEN_SERVICE = Symbol('TokenService');
export const INTERNAL_TOKEN_VERIFIER = Symbol('InternalTokenVerifier');
export const INTERNAL_TOKEN_ISSUER = Symbol('InternalTokenIssuer');
