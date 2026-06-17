import { EstadoTramite } from '../enums/estado-tramite.enum';
import { AccionMovimiento } from '../enums/accion-movimiento.enum';
import { TipoUsuario } from '../../usuarios/enums/tipo-usuario.enum';

export interface MovimientoTramiteProps {
  id: string;
  tramiteId: string;
  estadoAnterior: EstadoTramite | null;
  estadoNuevo: EstadoTramite;
  areaAnteriorId: string | null;
  areaNuevaId: string | null;
  usuarioTipo: TipoUsuario;
  usuarioId: string;
  accion: AccionMovimiento;
  comentario: string | null;
  fecha: Date;
}

/**
 * Registro de auditoría del workflow (append-only). Forma parte del agregado
 * Trámite: cada transición genera uno.
 */
export class MovimientoTramite {
  constructor(private readonly props: MovimientoTramiteProps) {}

  get id(): string {
    return this.props.id;
  }
  get tramiteId(): string {
    return this.props.tramiteId;
  }
  get estadoAnterior(): EstadoTramite | null {
    return this.props.estadoAnterior;
  }
  get estadoNuevo(): EstadoTramite {
    return this.props.estadoNuevo;
  }
  get areaAnteriorId(): string | null {
    return this.props.areaAnteriorId;
  }
  get areaNuevaId(): string | null {
    return this.props.areaNuevaId;
  }
  get usuarioTipo(): TipoUsuario {
    return this.props.usuarioTipo;
  }
  get usuarioId(): string {
    return this.props.usuarioId;
  }
  get accion(): AccionMovimiento {
    return this.props.accion;
  }
  get comentario(): string | null {
    return this.props.comentario;
  }
  get fecha(): Date {
    return this.props.fecha;
  }
}
