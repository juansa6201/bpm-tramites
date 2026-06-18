import { AreaRepository } from '../../../domain/repositories/area.repository';
import { ActualizarAreaInput } from '../../dto/config/area.input';
import { AreaView, toAreaView } from '../../dto/config/area.view';
import { AreaNoEncontradaError } from '../../../domain/tramites/errors/config.errors';
import { requireAdmin } from '../authz';

/** Actualiza nombre/activa de un área (el codigo es inmutable). Solo ADMIN. */
export class ActualizarAreaUseCase {
  constructor(private readonly areas: AreaRepository) {}

  async execute(input: ActualizarAreaInput): Promise<AreaView> {
    requireAdmin(input.actor);
    const existente = await this.areas.findById(input.id);
    if (!existente) throw new AreaNoEncontradaError(input.id);

    const area = await this.areas.update(input.id, {
      nombre: input.nombre,
      activa: input.activa,
    });
    return toAreaView(area);
  }
}
