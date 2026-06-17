import { Actor } from '../actor';

/** Input genérico de una acción de workflow (las que solo llevan comentario). */
export interface AccionTramiteInput {
  tramiteId: string;
  actor: Actor;
  comentario?: string;
}
