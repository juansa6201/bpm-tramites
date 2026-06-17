import { Tramite as TramiteRow } from '@prisma/client';
import { Tramite } from '../../../domain/tramites/entities/tramite.entity';
import { EstadoTramite } from '../../../domain/tramites/enums/estado-tramite.enum';
import { OrigenTramite } from '../../../domain/tramites/enums/origen-tramite.enum';
import { PrioridadTramite } from '../../../domain/tramites/enums/prioridad-tramite.enum';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';

export class TramiteMapper {
  static toDomain(row: TramiteRow): Tramite {
    return new Tramite({
      id: row.id,
      numero: row.numero,
      titulo: row.titulo,
      descripcion: row.descripcion,
      origen: row.origen as OrigenTramite,
      estado: row.estado as EstadoTramite,
      prioridad: row.prioridad as PrioridadTramite,
      tipoTramiteId: row.tipoTramiteId,
      areaActualId: row.areaActualId,
      usuarioAsignadoId: row.usuarioAsignadoId,
      usuarioExternoId: row.usuarioExternoId,
      creadoPorTipo: row.creadoPorTipo as TipoUsuario,
      creadoPorId: row.creadoPorId,
      version: row.version,
      fechaCreacion: row.fechaCreacion,
      fechaActualizacion: row.fechaActualizacion,
      fechaCierre: row.fechaCierre,
    });
  }
}
