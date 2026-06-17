import { Actor } from '../actor';

export interface DerivarTramiteInput {
  tramiteId: string;
  actor: Actor;
  /** Área destino de la derivación. */
  areaNuevaId: string;
  comentario?: string;
}
