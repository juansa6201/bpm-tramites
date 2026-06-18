import { EstadoTramite } from '../enums/estado-tramite.enum';
import { OrigenTramite } from '../enums/origen-tramite.enum';
import { PrioridadTramite } from '../enums/prioridad-tramite.enum';
import { TipoUsuario } from '../../usuarios/enums/tipo-usuario.enum';

export interface TramiteProps {
  id: string;
  numero: string;
  titulo: string;
  descripcion: string;
  origen: OrigenTramite;
  estado: EstadoTramite;
  prioridad: PrioridadTramite;
  tipoTramiteId: string;
  areaActualId: string | null;
  usuarioAsignadoId: string | null;
  usuarioExternoId: string | null;
  creadoPorTipo: TipoUsuario;
  creadoPorId: string;
  version: number;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  fechaCierre: Date | null;
}

/**
 * Raíz de agregado del workflow. No conoce Nest ni Prisma.
 * El cálculo de la transición vive en WorkflowStateMachine; esta entidad
 * solo aplica el resultado y expone reglas de pertenencia/estado.
 */
export class Tramite {
  constructor(private readonly props: TramiteProps) {}

  get id(): string {
    return this.props.id;
  }
  get numero(): string {
    return this.props.numero;
  }
  get titulo(): string {
    return this.props.titulo;
  }
  get descripcion(): string {
    return this.props.descripcion;
  }
  get origen(): OrigenTramite {
    return this.props.origen;
  }
  get estado(): EstadoTramite {
    return this.props.estado;
  }
  get prioridad(): PrioridadTramite {
    return this.props.prioridad;
  }
  get tipoTramiteId(): string {
    return this.props.tipoTramiteId;
  }
  get areaActualId(): string | null {
    return this.props.areaActualId;
  }
  get usuarioAsignadoId(): string | null {
    return this.props.usuarioAsignadoId;
  }
  get usuarioExternoId(): string | null {
    return this.props.usuarioExternoId;
  }
  get creadoPorTipo(): TipoUsuario {
    return this.props.creadoPorTipo;
  }
  get creadoPorId(): string {
    return this.props.creadoPorId;
  }
  get version(): number {
    return this.props.version;
  }
  get fechaCreacion(): Date {
    return this.props.fechaCreacion;
  }
  get fechaActualizacion(): Date {
    return this.props.fechaActualizacion;
  }
  get fechaCierre(): Date | null {
    return this.props.fechaCierre;
  }

  // --------------------------- Reglas de lectura ---------------------------

  esBorrador(): boolean {
    return this.props.estado === EstadoTramite.BORRADOR;
  }

  /** Estados finales: ya no admiten más transiciones de avance. */
  esTerminal(): boolean {
    return (
      this.props.estado === EstadoTramite.CERRADO || this.props.estado === EstadoTramite.CANCELADO
    );
  }

  /** Para autorización: un externo solo puede ver trámites donde participa. */
  participaElExterno(usuarioExternoId: string): boolean {
    return this.props.usuarioExternoId === usuarioExternoId;
  }

  /** Para autorización: un operador solo opera trámites de su área. */
  perteneceAlArea(areaId: string): boolean {
    return this.props.areaActualId === areaId;
  }

  /** ¿Lo creó este actor? (para permisos de edición/borrado del borrador). */
  fueCreadoPor(tipo: TipoUsuario, usuarioId: string): boolean {
    return this.props.creadoPorTipo === tipo && this.props.creadoPorId === usuarioId;
  }

  // ------------------------- Mutaciones controladas -------------------------
  // Las usan los casos de uso de workflow tras validar la transición.

  cambiarEstado(nuevo: EstadoTramite): void {
    this.props.estado = nuevo;
  }

  asignarA(usuarioInternoId: string): void {
    this.props.usuarioAsignadoId = usuarioInternoId;
  }

  moverAArea(areaId: string): void {
    this.props.areaActualId = areaId;
  }

  vincularExterno(usuarioExternoId: string): void {
    this.props.usuarioExternoId = usuarioExternoId;
  }

  registrarCierre(fecha: Date): void {
    this.props.fechaCierre = fecha;
  }

  // ----------------------- Edición de datos (PUT) ---------------------------
  // Solo cambian datos descriptivos, no el estado del workflow.

  editarTitulo(titulo: string): void {
    this.props.titulo = titulo;
  }

  editarDescripcion(descripcion: string): void {
    this.props.descripcion = descripcion;
  }

  cambiarPrioridad(prioridad: PrioridadTramite): void {
    this.props.prioridad = prioridad;
  }
}
