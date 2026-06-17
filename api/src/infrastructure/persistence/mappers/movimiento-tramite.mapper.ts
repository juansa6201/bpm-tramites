import { MovimientoTramite as MovimientoRow } from '@prisma/client';
import { MovimientoTramite } from '../../../domain/tramites/entities/movimiento-tramite.entity';
import { EstadoTramite } from '../../../domain/tramites/enums/estado-tramite.enum';
import { AccionMovimiento } from '../../../domain/tramites/enums/accion-movimiento.enum';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';

export class MovimientoTramiteMapper {
  static toDomain(row: MovimientoRow): MovimientoTramite {
    return new MovimientoTramite({
      id: row.id,
      tramiteId: row.tramiteId,
      estadoAnterior: row.estadoAnterior as EstadoTramite | null,
      estadoNuevo: row.estadoNuevo as EstadoTramite,
      areaAnteriorId: row.areaAnteriorId,
      areaNuevaId: row.areaNuevaId,
      usuarioTipo: row.usuarioTipo as TipoUsuario,
      usuarioId: row.usuarioId,
      accion: row.accion as AccionMovimiento,
      comentario: row.comentario,
      fecha: row.fecha,
    });
  }
}
