import { UsuarioInterno } from '../entities/usuario-interno.entity';

/**
 * Puerto de persistencia (INTERFACE en el dominio).
 * La implementación concreta (Prisma) vive en infrastructure.
 *
 * Los internos no se registran por la API (se aprovisionan vía seed/Azure),
 * por eso este puerto es solo de lectura.
 */
export interface UsuarioInternoRepository {
  findById(id: string): Promise<UsuarioInterno | null>;
  findByEmail(email: string): Promise<UsuarioInterno | null>;
  findByAzureObjectId(azureObjectId: string): Promise<UsuarioInterno | null>;
}
