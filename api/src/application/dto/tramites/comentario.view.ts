import { ComentarioTramite } from '../../../domain/tramites/entities/comentario-tramite.entity';
import { Visibilidad } from '../../../domain/tramites/enums/visibilidad.enum';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';

/** Vista de salida plana de un comentario (serializable). */
export interface ComentarioView {
  id: string;
  tramiteId: string;
  mensaje: string;
  visibilidad: Visibilidad;
  autorTipo: TipoUsuario;
  autorId: string;
  fecha: Date;
}

export function toComentarioView(c: ComentarioTramite): ComentarioView {
  return {
    id: c.id,
    tramiteId: c.tramiteId,
    mensaje: c.mensaje,
    visibilidad: c.visibilidad,
    autorTipo: c.autorTipo,
    autorId: c.autorId,
    fecha: c.fecha,
  };
}
