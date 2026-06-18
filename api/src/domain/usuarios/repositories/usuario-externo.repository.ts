import { UsuarioExterno } from '../entities/usuario-externo.entity';

/**
 * Datos para crear un usuario externo.
 * id, estado inicial y fechaAlta los asigna la capa de persistencia.
 */
export interface CrearUsuarioExternoData {
  nombre: string;
  email: string;
  documento: string;
  organizacion: string | null;
  passwordHash: string | null;
}

/** Filtros del listado de usuarios externos (para el picker de Interno→Externo). */
export interface ListarUsuariosExternosFiltros {
  soloActivos?: boolean;
}

/**
 * Puerto de persistencia (INTERFACE en el dominio).
 * La implementación concreta (Prisma) vive en infrastructure.
 */
export interface UsuarioExternoRepository {
  findById(id: string): Promise<UsuarioExterno | null>;
  findByEmail(email: string): Promise<UsuarioExterno | null>;
  findByDocumento(documento: string): Promise<UsuarioExterno | null>;
  create(data: CrearUsuarioExternoData): Promise<UsuarioExterno>;
  list(filtros?: ListarUsuariosExternosFiltros): Promise<UsuarioExterno[]>;
}
