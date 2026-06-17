import { ComentarioTramite } from '../tramites/entities/comentario-tramite.entity';
import { Visibilidad } from '../tramites/enums/visibilidad.enum';
import { TipoUsuario } from '../usuarios/enums/tipo-usuario.enum';

/** Datos para crear un comentario. */
export interface NuevoComentarioData {
  tramiteId: string;
  mensaje: string;
  visibilidad: Visibilidad;
  autorTipo: TipoUsuario;
  autorId: string;
}

/** Puerto de persistencia de comentarios (INTERFACE en el dominio). */
export interface ComentarioTramiteRepository {
  create(data: NuevoComentarioData): Promise<ComentarioTramite>;
  /** Devuelve todos los comentarios; el filtrado por visibilidad lo hace el caso de uso. */
  listByTramite(tramiteId: string): Promise<ComentarioTramite[]>;
}
