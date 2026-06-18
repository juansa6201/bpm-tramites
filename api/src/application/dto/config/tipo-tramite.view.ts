import { TipoTramite } from '../../../domain/tramites/entities/tipo-tramite.entity';

/** Vista de salida plana de un tipo de trámite. */
export interface TipoTramiteView {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  requiereExterno: boolean;
  permiteInicioExterno: boolean;
  slaHoras: number;
  areaInicialId: string | null;
}

export function toTipoTramiteView(t: TipoTramite): TipoTramiteView {
  return {
    id: t.id,
    codigo: t.codigo,
    nombre: t.nombre,
    descripcion: t.descripcion,
    activo: t.estaActivo(),
    requiereExterno: t.requiereExterno(),
    permiteInicioExterno: t.permiteInicioExterno(),
    slaHoras: t.slaHoras,
    areaInicialId: t.areaInicialId,
  };
}
