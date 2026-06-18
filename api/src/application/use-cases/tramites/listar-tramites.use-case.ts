import { TramiteRepository, TramiteFilters } from '../../../domain/repositories/tramite.repository';
import { TipoTramiteRepository } from '../../../domain/repositories/tipo-tramite.repository';
import { PaginatedResult } from '../../../domain/shared/pagination';
import { Clock } from '../../ports/clock.port';
import { Actor } from '../../dto/actor';
import {
  ListarTramitesInput,
  ListarTramitesFiltros,
} from '../../dto/tramites/listar-tramites.input';
import { TramiteListItemView, toTramiteListItemView } from '../../dto/tramites/tramite.view';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../../domain/usuarios/enums/rol-interno.enum';

/**
 * Lista trámites (bandeja) con filtros y paginación.
 *
 * La visibilidad se aplica como FILTRO en el repositorio (WHERE en la base),
 * NO trayendo todo y descartando en memoria: así la paginación y el `total`
 * son correctos. Reglas (espejo de TramiteVisibilidadPolicy):
 *  - externo            → solo sus trámites (usuarioExternoId forzado).
 *  - interno admin/aud. → ven todo (filtros libres).
 *  - interno operativo  → solo su área (areaActualId forzado).
 *
 * Los filtros de seguridad SOBREESCRIBEN lo que pida el cliente: nunca pueden
 * ensanchar el alcance, solo los filtros "libres" lo angostan.
 */
export class ListarTramitesUseCase {
  constructor(
    private readonly tramites: TramiteRepository,
    private readonly tipos: TipoTramiteRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ListarTramitesInput): Promise<PaginatedResult<TramiteListItemView>> {
    const filtros = this.aplicarVisibilidad(input.actor, input.filtros);
    // Fail-closed: si la visibilidad no puede acotarse de forma segura, no se
    // consulta y se devuelve vacío (espejo del `!== undefined` de puedeVer).
    if (filtros === null) {
      return {
        items: [],
        total: 0,
        page: input.filtros.page ?? 1,
        pageSize: input.filtros.pageSize ?? 20,
      };
    }
    const page = await this.tramites.list(filtros);
    // SLA resuelto en el server: mapeamos tipoTramiteId → slaHoras (tabla chica
    // de config) y evaluamos vencimiento/vencido con un único `ahora`.
    const tipos = await this.tipos.list();
    const slaPorTipo = new Map(tipos.map((t) => [t.id, t.slaHoras]));
    const ahora = this.clock.now();
    return {
      ...page,
      items: page.items.map((t) =>
        toTramiteListItemView(t, slaPorTipo.get(t.tipoTramiteId), ahora),
      ),
    };
  }

  /** Devuelve los filtros efectivos, o `null` si el actor no puede ver nada. */
  private aplicarVisibilidad(actor: Actor, q: ListarTramitesFiltros): TramiteFilters | null {
    // Filtros que cualquier actor puede pedir libremente (solo angostan).
    const base: TramiteFilters = {
      estado: q.estado,
      origen: q.origen,
      prioridad: q.prioridad,
      usuarioAsignadoId: q.usuarioAsignadoId,
      creadoDesde: q.creadoDesde,
      creadoHasta: q.creadoHasta,
      page: q.page,
      pageSize: q.pageSize,
    };

    if (actor.tipo === TipoUsuario.EXTERNO) {
      // Se fuerza: el externo solo ve los suyos, ignorando cualquier filtro pedido.
      return { ...base, usuarioExternoId: actor.id };
    }

    if (actor.rol === RolInterno.ADMIN || actor.rol === RolInterno.AUDITOR) {
      // Ven todo: respetan los filtros de área/externo tal como los pidan.
      return { ...base, areaActualId: q.areaActualId, usuarioExternoId: q.usuarioExternoId };
    }

    // Interno operativo/mesa: se fuerza su área (ignora areaActualId pedida).
    // Sin área no hay alcance seguro → fail-closed (igual que puedeVer).
    if (!actor.areaId) return null;
    return { ...base, areaActualId: actor.areaId, usuarioExternoId: q.usuarioExternoId };
  }
}
