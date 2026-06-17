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

/**
 * Puerto de persistencia (INTERFACE en el dominio).
 * La implementación concreta (Prisma) vive en infrastructure.
 */
export interface UsuarioExternoRepository {
  findById(id: string): Promise<UsuarioExterno | null>;
  findByEmail(email: string): Promise<UsuarioExterno | null>;
  findByDocumento(documento: string): Promise<UsuarioExterno | null>;
  create(data: CrearUsuarioExternoData): Promise<UsuarioExterno>;
}
