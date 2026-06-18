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
export const UNIT_OF_WORK = Symbol('UnitOfWork');
export const TIPO_TRAMITE_REPOSITORY = Symbol('TipoTramiteRepository');
export const AREA_REPOSITORY = Symbol('AreaRepository');
export const TRAMITE_REPOSITORY = Symbol('TramiteRepository');
export const MOVIMIENTO_TRAMITE_REPOSITORY = Symbol('MovimientoTramiteRepository');
export const COMENTARIO_TRAMITE_REPOSITORY = Symbol('ComentarioTramiteRepository');
export const DOCUMENTO_TRAMITE_REPOSITORY = Symbol('DocumentoTramiteRepository');
export const DASHBOARD_REPOSITORY = Symbol('DashboardRepository');
export const STORAGE_PORT = Symbol('StoragePort');
export const CLOCK = Symbol('Clock');
