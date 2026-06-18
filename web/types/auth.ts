/** Roles de un usuario interno (espejo del enum del backend). */
export type RolInterno = 'ADMIN' | 'MESA_ENTRADA' | 'OPERADOR' | 'SUPERVISOR' | 'AUDITOR';

export type TipoUsuario = 'INTERNO' | 'EXTERNO';

/**
 * Usuario interno tal como lo guarda el front.
 * `nombre` llega del login, `areaId` de /me: por eso ambos son opcionales.
 */
export interface InternalUser {
  id: string;
  email: string;
  rol: RolInterno;
  tipo: TipoUsuario;
  nombre?: string;
  areaId?: string;
}

/** Respuesta de POST /api/auth/internal/login. */
export interface InternalLoginResponse {
  accessToken: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: RolInterno;
    tipo: TipoUsuario;
  };
}

/** Respuesta de GET /api/auth/internal/me (no incluye nombre). */
export interface InternalMeResponse {
  id: string;
  email: string;
  tipo: TipoUsuario;
  rol?: RolInterno;
  areaId?: string;
}

/**
 * Usuario externo tal como lo guarda el front.
 * `nombre` llega del login; /me puede no traerlo, por eso es opcional.
 */
export interface ExternalUser {
  id: string;
  email: string;
  tipo: TipoUsuario;
  nombre?: string;
}

/** Respuesta de POST /api/auth/external/login. */
export interface ExternalLoginResponse {
  accessToken: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    tipo: TipoUsuario;
  };
}

/** Respuesta de GET /api/auth/me (externo). Puede no incluir nombre. */
export interface ExternalMeResponse {
  id: string;
  email: string;
  tipo: TipoUsuario;
  nombre?: string;
}

/** Resultado de POST /api/auth/external/register (sin token: la cuenta nace pendiente). */
export interface RegisterExternalResult {
  id: string;
  nombre: string;
  email: string;
  estado: string;
}
