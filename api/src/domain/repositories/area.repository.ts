import { Area } from '../tramites/entities/area.entity';

/** Datos para crear un área. */
export interface CrearAreaData {
  nombre: string;
  codigo: string;
  activa?: boolean;
}

/** Cambios parciales sobre un área (el codigo es inmutable). */
export interface ActualizarAreaData {
  nombre?: string;
  activa?: boolean;
}

/** Puerto de persistencia de áreas (INTERFACE en el dominio). */
export interface AreaRepository {
  findById(id: string): Promise<Area | null>;
  findByCodigo(codigo: string): Promise<Area | null>;
  list(): Promise<Area[]>;
  create(data: CrearAreaData): Promise<Area>;
  update(id: string, data: ActualizarAreaData): Promise<Area>;
}
