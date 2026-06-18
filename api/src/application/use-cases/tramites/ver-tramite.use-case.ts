import { TramiteRepository } from '../../../domain/repositories/tramite.repository';
import { MovimientoTramiteRepository } from '../../../domain/repositories/movimiento-tramite.repository';
import { VerTramiteInput } from '../../dto/tramites/ver-tramite.input';
import { TramiteDetalleView, toTramiteDetalleView } from '../../dto/tramites/tramite.view';
import { TramiteNoEncontradoError } from '../../../domain/tramites/errors/tramite.errors';
import { autorizarVisibilidad } from './workflow-helpers';

/**
 * Devuelve el detalle de un trámite con su timeline de movimientos embebida.
 *
 * Autorización: 404 si no existe, 403 si el actor no puede verlo (la decisión
 * la toma TramiteVisibilidadPolicy, el mismo servicio de dominio que usa la
 * bandeja). La timeline se trae ya ordenada por la base, sin filtrar en memoria.
 */
export class VerTramiteUseCase {
  constructor(
    private readonly tramites: TramiteRepository,
    private readonly movimientos: MovimientoTramiteRepository,
  ) {}

  async execute(input: VerTramiteInput): Promise<TramiteDetalleView> {
    const tramite = await this.tramites.findById(input.tramiteId);
    if (!tramite) throw new TramiteNoEncontradoError(input.tramiteId);

    autorizarVisibilidad(tramite, input.actor);

    const movimientos = await this.movimientos.listByTramite(tramite.id);
    return toTramiteDetalleView(tramite, movimientos);
  }
}
