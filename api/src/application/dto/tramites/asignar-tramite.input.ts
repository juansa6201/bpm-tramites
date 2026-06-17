import { Actor } from '../actor';

export interface AsignarTramiteInput {
  tramiteId: string;
  actor: Actor;
  /** Interno destino al que se asigna el trámite. */
  usuarioAsignadoId: string;
  comentario?: string;
}
