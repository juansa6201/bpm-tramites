import { TipoTramiteRepository } from '../../../domain/repositories/tipo-tramite.repository';
import { AreaRepository } from '../../../domain/repositories/area.repository';
import { ActualizarTipoTramiteInput } from '../../dto/config/tipo-tramite.input';
import { TipoTramiteView, toTipoTramiteView } from '../../dto/config/tipo-tramite.view';
import { AreaNoEncontradaError } from '../../../domain/tramites/errors/config.errors';
import { TipoTramiteNoEncontradoError } from '../../../domain/tramites/errors/tramite.errors';
import { requireAdmin } from '../authz';

/**
 * Actualiza un tipo de trámite (el codigo es inmutable). Solo ADMIN.
 * Si se cambia areaInicialId, se valida que el área exista (404).
 */
export class ActualizarTipoTramiteUseCase {
  constructor(
    private readonly tipos: TipoTramiteRepository,
    private readonly areas: AreaRepository,
  ) {}

  async execute(input: ActualizarTipoTramiteInput): Promise<TipoTramiteView> {
    requireAdmin(input.actor);

    const existente = await this.tipos.findById(input.id);
    if (!existente) throw new TipoTramiteNoEncontradoError(input.id);

    if (input.areaInicialId) {
      const area = await this.areas.findById(input.areaInicialId);
      if (!area) throw new AreaNoEncontradaError(input.areaInicialId);
    }

    const tipo = await this.tipos.update(input.id, {
      nombre: input.nombre,
      descripcion: input.descripcion,
      activo: input.activo,
      requiereExterno: input.requiereExterno,
      permiteInicioExterno: input.permiteInicioExterno,
      slaHoras: input.slaHoras,
      areaInicialId: input.areaInicialId,
    });
    return toTipoTramiteView(tipo);
  }
}
