import { EstadoUsuarioExterno } from '../enums/estado-usuario-externo.enum';

export interface UsuarioExternoProps {
  id: string;
  nombre: string;
  email: string;
  documento: string;
  organizacion: string | null;
  estado: EstadoUsuarioExterno;
  fechaAlta: Date;
  passwordHash: string | null;
}

/**
 * Entidad de dominio: usuario externo a la organización.
 * No conoce Nest, Prisma ni HTTP. Solo estado + reglas de negocio propias.
 */
export class UsuarioExterno {
  constructor(private readonly props: UsuarioExternoProps) {}

  get id(): string {
    return this.props.id;
  }
  get nombre(): string {
    return this.props.nombre;
  }
  get email(): string {
    return this.props.email;
  }
  get documento(): string {
    return this.props.documento;
  }
  get organizacion(): string | null {
    return this.props.organizacion;
  }
  get estado(): EstadoUsuarioExterno {
    return this.props.estado;
  }
  get fechaAlta(): Date {
    return this.props.fechaAlta;
  }
  get passwordHash(): string | null {
    return this.props.passwordHash;
  }

  estaActivo(): boolean {
    return this.props.estado === EstadoUsuarioExterno.ACTIVO;
  }
  estaBloqueado(): boolean {
    return this.props.estado === EstadoUsuarioExterno.BLOQUEADO;
  }
  estaPendienteDeVerificacion(): boolean {
    return this.props.estado === EstadoUsuarioExterno.PENDIENTE_VERIFICACION;
  }

  /** Regla de negocio: solo un externo ACTIVO puede autenticarse. */
  puedeAutenticarse(): boolean {
    return this.estaActivo();
  }
}
