import { ComentarioTramite as ComentarioRow } from '@prisma/client';
import { ComentarioTramite } from '../../../domain/tramites/entities/comentario-tramite.entity';
import { Visibilidad } from '../../../domain/tramites/enums/visibilidad.enum';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';

export class ComentarioTramiteMapper {
  static toDomain(row: ComentarioRow): ComentarioTramite {
    return new ComentarioTramite({
      id: row.id,
      tramiteId: row.tramiteId,
      mensaje: row.mensaje,
      visibilidad: row.visibilidad as Visibilidad,
      autorTipo: row.autorTipo as TipoUsuario,
      autorId: row.autorId,
      fecha: row.fecha,
    });
  }
}
