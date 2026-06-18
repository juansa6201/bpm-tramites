import { UsuarioExterno } from '../../../domain/usuarios/entities/usuario-externo.entity';
import { EstadoUsuarioExterno } from '../../../domain/usuarios/enums/estado-usuario-externo.enum';

/** Vista de salida plana de un usuario externo (para pickers internos). */
export interface UsuarioExternoView {
  id: string;
  nombre: string;
  email: string;
  documento: string;
  organizacion: string | null;
  estado: EstadoUsuarioExterno;
}

export function toUsuarioExternoView(u: UsuarioExterno): UsuarioExternoView {
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    documento: u.documento,
    organizacion: u.organizacion,
    estado: u.estado,
  };
}
