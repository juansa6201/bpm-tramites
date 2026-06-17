import { UsuarioExterno as UsuarioExternoRow } from '@prisma/client';
import { UsuarioExterno } from '../../../domain/usuarios/entities/usuario-externo.entity';
import { EstadoUsuarioExterno } from '../../../domain/usuarios/enums/estado-usuario-externo.enum';

/**
 * Traduce entre la fila de Prisma y la entidad de dominio.
 * Es el único lugar donde se "tocan" los tipos de @prisma/client para usuarios externos.
 */
export class UsuarioExternoMapper {
  static toDomain(row: UsuarioExternoRow): UsuarioExterno {
    return new UsuarioExterno({
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      documento: row.documento,
      organizacion: row.organizacion,
      // Los valores del enum coinciden 1:1, por eso el cast es seguro.
      estado: row.estado as EstadoUsuarioExterno,
      fechaAlta: row.fechaAlta,
      passwordHash: row.passwordHash,
    });
  }
}
