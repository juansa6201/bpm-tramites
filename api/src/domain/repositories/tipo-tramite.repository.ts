import { TipoTramite } from '../tramites/entities/tipo-tramite.entity';

/** Datos para crear un tipo de trámite (el codigo es único). */
export interface CrearTipoTramiteData {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
  requiereExterno?: boolean;
  permiteInicioExterno?: boolean;
  slaHoras: number;
  areaInicialId?: string | null;
}

/** Cambios parciales sobre un tipo de trámite (el codigo es inmutable). */
export interface ActualizarTipoTramiteData {
  nombre?: string;
  descripcion?: string | null;
  activo?: boolean;
  requiereExterno?: boolean;
  permiteInicioExterno?: boolean;
  slaHoras?: number;
  areaInicialId?: string | null;
}

/** Puerto de persistencia de tipos de trámite (INTERFACE en el dominio). */
export interface TipoTramiteRepository {
  findById(id: string): Promise<TipoTramite | null>;
  findByCodigo(codigo: string): Promise<TipoTramite | null>;
  list(): Promise<TipoTramite[]>;
  create(data: CrearTipoTramiteData): Promise<TipoTramite>;
  update(id: string, data: ActualizarTipoTramiteData): Promise<TipoTramite>;
}
