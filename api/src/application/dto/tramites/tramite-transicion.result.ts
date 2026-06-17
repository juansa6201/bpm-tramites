import { EstadoTramite } from '../../../domain/tramites/enums/estado-tramite.enum';

/** Resultado común de una acción de workflow. */
export interface TramiteTransicionResult {
  id: string;
  numero: string;
  estadoAnterior: EstadoTramite;
  estadoNuevo: EstadoTramite;
}
