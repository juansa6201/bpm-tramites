import { TipoTramite as TipoTramiteRow } from '@prisma/client';
import { TipoTramite } from '../../../domain/tramites/entities/tipo-tramite.entity';

export class TipoTramiteMapper {
  static toDomain(row: TipoTramiteRow): TipoTramite {
    return new TipoTramite({
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion,
      activo: row.activo,
      requiereExterno: row.requiereExterno,
      permiteInicioExterno: row.permiteInicioExterno,
      slaHoras: row.slaHoras,
      areaInicialId: row.areaInicialId,
    });
  }
}
