import { Actor } from '../actor';
import { OrigenTramite } from '../../../domain/tramites/enums/origen-tramite.enum';
import { PrioridadTramite } from '../../../domain/tramites/enums/prioridad-tramite.enum';

export interface CrearTramiteInput {
  actor: Actor;
  tipoTramiteId: string;
  titulo: string;
  descripcion: string;
  origen: OrigenTramite;
  prioridad?: PrioridadTramite;
  /** Externo vinculado (requerido en INTERNO_EXTERNO; ignorado en otros). */
  usuarioExternoId?: string | null;
  /** Área inicial; si se omite, se usa la del tipo de trámite. */
  areaActualId?: string | null;
}
