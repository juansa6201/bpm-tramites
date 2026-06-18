import { Actor } from '../actor';
import { PrioridadTramite } from '../../../domain/tramites/enums/prioridad-tramite.enum';

export interface EditarTramiteInput {
  tramiteId: string;
  actor: Actor;
  /** Solo editable en BORRADOR. */
  titulo?: string;
  /** Solo editable en BORRADOR. */
  descripcion?: string;
  /** Editable en cualquier estado no terminal, solo por internos. */
  prioridad?: PrioridadTramite;
}

export interface EliminarTramiteInput {
  tramiteId: string;
  actor: Actor;
}
