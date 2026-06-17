import { TipoTramite } from '../tramites/entities/tipo-tramite.entity';

/** Puerto de persistencia de tipos de trámite (INTERFACE en el dominio). */
export interface TipoTramiteRepository {
  findById(id: string): Promise<TipoTramite | null>;
}
