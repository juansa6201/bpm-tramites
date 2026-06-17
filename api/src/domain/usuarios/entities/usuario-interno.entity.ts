import { RolInterno } from '../enums/rol-interno.enum';

export interface UsuarioInternoProps {
  id: string;
  nombre: string;
  email: string;
  azureObjectId: string;
  rol: RolInterno;
  areaId: string;
  activo: boolean;
}

/**
 * Entidad de dominio: empleado interno de la organización.
 * No conoce Nest, Prisma ni HTTP. Solo estado + reglas de negocio propias.
 */
export class UsuarioInterno {
  constructor(private readonly props: UsuarioInternoProps) {}

  get id(): string {
    return this.props.id;
  }
  get nombre(): string {
    return this.props.nombre;
  }
  get email(): string {
    return this.props.email;
  }
  get azureObjectId(): string {
    return this.props.azureObjectId;
  }
  get rol(): RolInterno {
    return this.props.rol;
  }
  get areaId(): string {
    return this.props.areaId;
  }
  get activo(): boolean {
    return this.props.activo;
  }

  estaActivo(): boolean {
    return this.props.activo;
  }

  /** True si el usuario tiene alguno de los roles indicados. */
  tieneRol(...roles: RolInterno[]): boolean {
    return roles.includes(this.props.rol);
  }

  esAdmin(): boolean {
    return this.props.rol === RolInterno.ADMIN;
  }
  esAuditor(): boolean {
    return this.props.rol === RolInterno.AUDITOR;
  }
}
