import { EstadoTramite } from '../../../domain/tramites/enums/estado-tramite.enum';

export interface CrearTramiteResult {
  id: string;
  numero: string;
  estado: EstadoTramite;
}
