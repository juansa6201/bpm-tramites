import { TipoTramiteRepository } from '../../../domain/repositories/tipo-tramite.repository';
import { AreaRepository } from '../../../domain/repositories/area.repository';
import { CrearTipoTramiteInput } from '../../dto/config/tipo-tramite.input';
import { TipoTramiteView, toTipoTramiteView } from '../../dto/config/tipo-tramite.view';
import { AreaNoEncontradaError } from '../../../domain/tramites/errors/config.errors';
import { requireAdmin } from '../authz';

/**
 * Crea un tipo de trámite. Solo ADMIN. Si se indica areaInicialId, se valida
 * que el área exista (404). El código duplicado lo rechaza el repositorio (422).
 */
export class CrearTipoTramiteUseCase {
  constructor(
    private readonly tipos: TipoTramiteRepository,
    private readonly areas: AreaRepository,
  ) {}

  async execute(input: CrearTipoTramiteInput): Promise<TipoTramiteView> {
    requireAdmin(input.actor);

    if (input.areaInicialId) {
      const area = await this.areas.findById(input.areaInicialId);
      if (!area) throw new AreaNoEncontradaError(input.areaInicialId);
    }

    const tipo = await this.tipos.create({
      codigo: input.codigo,
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
