import { Visibilidad } from '../enums/visibilidad.enum';
import { TipoUsuario } from '../../usuarios/enums/tipo-usuario.enum';

export interface ComentarioTramiteProps {
  id: string;
  tramiteId: string;
  mensaje: string;
  visibilidad: Visibilidad;
  autorTipo: TipoUsuario;
  autorId: string;
  fecha: Date;
}

/** Comentario de un trámite. Respeta visibilidad (interno no visible a externos). */
export class ComentarioTramite {
  constructor(private readonly props: ComentarioTramiteProps) {}

  get id(): string {
    return this.props.id;
  }
  get tramiteId(): string {
    return this.props.tramiteId;
  }
  get mensaje(): string {
    return this.props.mensaje;
  }
  get visibilidad(): Visibilidad {
    return this.props.visibilidad;
  }
  get autorTipo(): TipoUsuario {
    return this.props.autorTipo;
  }
  get autorId(): string {
    return this.props.autorId;
  }
  get fecha(): Date {
    return this.props.fecha;
  }

  /**
   * Regla clave del enunciado: los comentarios INTERNA no son visibles para externos.
   */
  esVisiblePara(tipoUsuario: TipoUsuario): boolean {
    if (tipoUsuario === TipoUsuario.INTERNO) {
      return true;
    }
    return this.props.visibilidad !== Visibilidad.INTERNA;
  }
}
