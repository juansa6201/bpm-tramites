import { UsuarioInterno as UsuarioInternoRow } from '@prisma/client';
import { UsuarioInterno } from '../../../domain/usuarios/entities/usuario-interno.entity';
import { RolInterno } from '../../../domain/usuarios/enums/rol-interno.enum';

/** Traduce la fila de Prisma a la entidad de dominio del usuario interno. */
export class UsuarioInternoMapper {
  static toDomain(row: UsuarioInternoRow): UsuarioInterno {
    return new UsuarioInterno({
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      azureObjectId: row.azureObjectId,
      rol: row.rol as RolInterno,
      areaId: row.areaId,
      activo: row.activo,
    });
  }
}
