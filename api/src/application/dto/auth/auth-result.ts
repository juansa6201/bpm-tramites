import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../../domain/usuarios/enums/rol-interno.enum';

/** Resultado de un login externo exitoso. */
export interface AuthTokenResult {
  accessToken: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    tipo: TipoUsuario;
  };
}

/** Resultado de un registro exitoso (sin token: el externo arranca no-activo). */
export interface RegisteredExternalResult {
  id: string;
  nombre: string;
  email: string;
  estado: string;
}

/** Resultado de un login interno exitoso (incluye el rol). */
export interface InternalAuthTokenResult {
  accessToken: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: RolInterno;
    tipo: TipoUsuario;
  };
}
