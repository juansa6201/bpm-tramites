import { MovimientoTramite } from '../tramites/entities/movimiento-tramite.entity';

/**
 * Alcance de las métricas. `areaId === null` significa global (sin filtro de
 * área); un valor restringe todas las métricas a esa área.
 */
export interface DashboardScope {
  areaId: string | null;
}

/** Conteo genérico agrupado por una clave (estado, origen, área, ...). */
export interface ConteoPorClave {
  clave: string;
  cantidad: number;
}

/**
 * Puerto de lectura analítica para el dashboard (INTERFACE en el dominio).
 * Las agregaciones se resuelven en la base (groupBy / SQL), no en memoria.
 */
export interface DashboardRepository {
  contarPorEstado(scope: DashboardScope): Promise<ConteoPorClave[]>;
  contarPorOrigen(scope: DashboardScope): Promise<ConteoPorClave[]>;
  contarPorArea(scope: DashboardScope): Promise<ConteoPorClave[]>;
  /** Trámites activos cuyo SLA (slaHoras del tipo) ya venció. */
  contarVencidosSla(scope: DashboardScope): Promise<number>;
  /** Promedio en horas de (fechaCierre - fechaCreacion); null si no hay cierres. */
  promedioResolucionHoras(scope: DashboardScope): Promise<number | null>;
  /** Últimos movimientos (timeline global del alcance), más recientes primero. */
  ultimosMovimientos(scope: DashboardScope, limite: number): Promise<MovimientoTramite[]>;
}
