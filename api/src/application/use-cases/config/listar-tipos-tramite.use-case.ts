import { TipoTramiteRepository } from '../../../domain/repositories/tipo-tramite.repository';
import { ListarTiposTramiteInput } from '../../dto/config/tipo-tramite.input';
import { TipoTramiteView, toTipoTramiteView } from '../../dto/config/tipo-tramite.view';
import { requireInterno } from '../authz';

/** Lista todos los tipos de trámite. Solo para usuarios internos. */
export class ListarTiposTramiteUseCase {
  constructor(private readonly tipos: TipoTramiteRepository) {}

  async execute(input: ListarTiposTramiteInput): Promise<TipoTramiteView[]> {
    requireInterno(input.actor);
    const tipos = await this.tipos.list();
    return tipos.map(toTipoTramiteView);
  }
}
