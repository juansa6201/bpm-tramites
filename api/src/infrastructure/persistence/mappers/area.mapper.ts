import { Area as AreaRow } from '@prisma/client';
import { Area } from '../../../domain/tramites/entities/area.entity';

export class AreaMapper {
  static toDomain(row: AreaRow): Area {
    return new Area({
      id: row.id,
      nombre: row.nombre,
      codigo: row.codigo,
      activa: row.activa,
    });
  }
}
