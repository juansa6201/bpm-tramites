import { Visibilidad } from '../enums/visibilidad.enum';
import { TipoUsuario } from '../../usuarios/enums/tipo-usuario.enum';

export interface DocumentoTramiteProps {
  id: string;
  tramiteId: string;
  nombreArchivo: string;
  mimeType: string;
  size: number;
  storageKey: string;
  visibilidad: Visibilidad;
  subidoPorTipo: TipoUsuario;
  subidoPorId: string;
  fechaCarga: Date;
}

/** Documento adjunto a un trámite. Respeta visibilidad. */
export class DocumentoTramite {
  constructor(private readonly props: DocumentoTramiteProps) {}

  get id(): string {
    return this.props.id;
  }
  get tramiteId(): string {
    return this.props.tramiteId;
  }
  get nombreArchivo(): string {
    return this.props.nombreArchivo;
  }
  get mimeType(): string {
    return this.props.mimeType;
  }
  get size(): number {
    return this.props.size;
  }
  get storageKey(): string {
    return this.props.storageKey;
  }
  get visibilidad(): Visibilidad {
    return this.props.visibilidad;
  }
  get subidoPorTipo(): TipoUsuario {
    return this.props.subidoPorTipo;
  }
  get subidoPorId(): string {
    return this.props.subidoPorId;
  }
  get fechaCarga(): Date {
    return this.props.fechaCarga;
  }

  /**
   * Regla de visibilidad: los internos ven todo; un externo NO ve lo INTERNA.
   */
  esVisiblePara(tipoUsuario: TipoUsuario): boolean {
    if (tipoUsuario === TipoUsuario.INTERNO) {
      return true;
    }
    return this.props.visibilidad !== Visibilidad.INTERNA;
  }

  /** ¿Lo subió este actor? (para permisos de borrado). */
  fueSubidoPor(tipoUsuario: TipoUsuario, usuarioId: string): boolean {
    return this.props.subidoPorTipo === tipoUsuario && this.props.subidoPorId === usuarioId;
  }
}
