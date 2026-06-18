import type { MovimientoTramite } from './tramite';

export interface Conteo {
  clave: string;
  cantidad: number;
}

/** Respuesta de GET /dashboard (6 métricas, ya acotadas por visibilidad). */
export interface Dashboard {
  alcance: 'GLOBAL' | 'AREA';
  areaId: string | null;
  porEstado: Conteo[];
  porOrigen: Conteo[];
  cantidadPorArea: Conteo[];
  vencidosPorSla: number;
  promedioResolucionHoras: number | null;
  ultimosMovimientos: MovimientoTramite[];
}
