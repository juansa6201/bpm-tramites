import { Area } from '../../../domain/tramites/entities/area.entity';

/** Vista de salida plana de un área. */
export interface AreaView {
  id: string;
  nombre: string;
  codigo: string;
  activa: boolean;
}

export function toAreaView(a: Area): AreaView {
  return { id: a.id, nombre: a.nombre, codigo: a.codigo, activa: a.estaActiva() };
}
