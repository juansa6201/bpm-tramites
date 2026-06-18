import { MovimientoView } from '../tramites/tramite.view';

export interface ConteoView {
  clave: string;
  cantidad: number;
}

/** Resultado del dashboard con las 6 métricas, ya acotado por visibilidad. */
export interface DashboardView {
  /** GLOBAL (admin/auditor) o AREA (resto de los internos). */
  alcance: 'GLOBAL' | 'AREA';
  areaId: string | null;
  porEstado: ConteoView[];
  porOrigen: ConteoView[];
  cantidadPorArea: ConteoView[];
  vencidosPorSla: number;
  promedioResolucionHoras: number | null;
  ultimosMovimientos: MovimientoView[];
}
