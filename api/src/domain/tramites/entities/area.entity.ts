export interface AreaProps {
  id: string;
  nombre: string;
  codigo: string;
  activa: boolean;
}

/** Área organizativa. Agregado de configuración. */
export class Area {
  constructor(private readonly props: AreaProps) {}

  get id(): string {
    return this.props.id;
  }
  get nombre(): string {
    return this.props.nombre;
  }
  get codigo(): string {
    return this.props.codigo;
  }

  estaActiva(): boolean {
    return this.props.activa;
  }
}
