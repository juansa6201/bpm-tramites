import { Actor } from '../actor';
import { Visibilidad } from '../../../domain/tramites/enums/visibilidad.enum';

export interface AgregarComentarioInput {
  tramiteId: string;
  actor: Actor;
  mensaje: string;
  /** Si se omite, el caso de uso usa TODOS. */
  visibilidad?: Visibilidad;
}
