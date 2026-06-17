export interface TipoTramiteProps {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  requiereExterno: boolean;
  permiteInicioExterno: boolean;
  slaHoras: number;
  areaInicialId: string | null;
}

/** Configuración de un tipo de trámite. */
export class TipoTramite {
  constructor(private readonly props: TipoTramiteProps) {}

  get id(): string {
    return this.props.id;
  }
  get codigo(): string {
    return this.props.codigo;
  }
  get nombre(): string {
    return this.props.nombre;
  }
  get descripcion(): string | null {
    return this.props.descripcion;
  }
  get slaHoras(): number {
    return this.props.slaHoras;
  }
  get areaInicialId(): string | null {
    return this.props.areaInicialId;
  }

  estaActivo(): boolean {
    return this.props.activo;
  }
  requiereExterno(): boolean {
    return this.props.requiereExterno;
  }
  permiteInicioExterno(): boolean {
    return this.props.permiteInicioExterno;
  }
}
