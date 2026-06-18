import { AreaRepository } from '../../../domain/repositories/area.repository';
import { CrearAreaInput } from '../../dto/config/area.input';
import { AreaView, toAreaView } from '../../dto/config/area.view';
import { requireAdmin } from '../authz';

/** Crea un área. Solo ADMIN. El código duplicado lo rechaza el repositorio (422). */
export class CrearAreaUseCase {
  constructor(private readonly areas: AreaRepository) {}

  async execute(input: CrearAreaInput): Promise<AreaView> {
    requireAdmin(input.actor);
    const area = await this.areas.create({
      nombre: input.nombre,
      codigo: input.codigo,
      activa: input.activa,
    });
    return toAreaView(area);
  }
}
