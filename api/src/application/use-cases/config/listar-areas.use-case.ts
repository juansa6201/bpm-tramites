import { AreaRepository } from '../../../domain/repositories/area.repository';
import { ListarAreasInput } from '../../dto/config/area.input';
import { AreaView, toAreaView } from '../../dto/config/area.view';
import { requireInterno } from '../authz';

/** Lista todas las áreas. Solo para usuarios internos. */
export class ListarAreasUseCase {
  constructor(private readonly areas: AreaRepository) {}

  async execute(input: ListarAreasInput): Promise<AreaView[]> {
    requireInterno(input.actor);
    const areas = await this.areas.list();
    return areas.map(toAreaView);
  }
}
