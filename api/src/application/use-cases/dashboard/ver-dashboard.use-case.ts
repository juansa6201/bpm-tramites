import {
  DashboardRepository,
  DashboardScope,
} from '../../../domain/repositories/dashboard.repository';
import { Actor } from '../../dto/actor';
import { VerDashboardInput } from '../../dto/dashboard/dashboard.input';
import { DashboardView } from '../../dto/dashboard/dashboard.view';
import { toMovimientoView } from '../../dto/tramites/tramite.view';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../../domain/usuarios/enums/rol-interno.enum';
import { requireInterno } from '../authz';

const ULTIMOS_MOVIMIENTOS = 10;

/**
 * Arma el dashboard con las 6 métricas, acotado por visibilidad:
 *  - ADMIN / AUDITOR → global (todas las áreas).
 *  - resto de internos → solo su área.
 *  - externos → 403.
 * Un operativo sin área no tiene alcance seguro → dashboard vacío (fail-closed).
 */
export class VerDashboardUseCase {
  constructor(private readonly dashboard: DashboardRepository) {}

  async execute(input: VerDashboardInput): Promise<DashboardView> {
    requireInterno(input.actor);
    const areaId = this.areaScope(input.actor);

    // Interno operativo sin área asignada: no se consulta nada.
    if (areaId === undefined) {
      return this.vacio(input.actor);
    }

    const scope: DashboardScope = { areaId };
    const [
      porEstado,
      porOrigen,
      cantidadPorArea,
      vencidosPorSla,
      promedioResolucionHoras,
      movimientos,
    ] = await Promise.all([
      this.dashboard.contarPorEstado(scope),
      this.dashboard.contarPorOrigen(scope),
      this.dashboard.contarPorArea(scope),
      this.dashboard.contarVencidosSla(scope),
      this.dashboard.promedioResolucionHoras(scope),
      this.dashboard.ultimosMovimientos(scope, ULTIMOS_MOVIMIENTOS),
    ]);

    return {
      alcance: areaId === null ? 'GLOBAL' : 'AREA',
      areaId,
      porEstado,
      porOrigen,
      cantidadPorArea,
      vencidosPorSla,
      promedioResolucionHoras,
      ultimosMovimientos: movimientos.map(toMovimientoView),
    };
  }

  /**
   * Devuelve el área de alcance: `null` para global (admin/auditor), el área
   * del actor para el resto, o `undefined` si es operativo sin área (fail-closed).
   */
  private areaScope(actor: Actor): string | null | undefined {
    if (actor.tipo !== TipoUsuario.INTERNO) return undefined;
    if (actor.rol === RolInterno.ADMIN || actor.rol === RolInterno.AUDITOR) return null;
    return actor.areaId || undefined;
  }

  private vacio(actor: Actor): DashboardView {
    return {
      alcance: 'AREA',
      areaId: actor.tipo === TipoUsuario.INTERNO ? actor.areaId || null : null,
      porEstado: [],
      porOrigen: [],
      cantidadPorArea: [],
      vencidosPorSla: 0,
      promedioResolucionHoras: null,
      ultimosMovimientos: [],
    };
  }
}
