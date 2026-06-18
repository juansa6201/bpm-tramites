import { TipoTramiteRepository } from '../../../domain/repositories/tipo-tramite.repository';
import { TipoTramiteView, toTipoTramiteView } from '../../dto/config/tipo-tramite.view';

/**
 * Lista los tipos de trámite que un usuario externo puede iniciar: solo los
 * activos y con inicio externo habilitado. Alimenta el form de "crear trámite"
 * del portal externo.
 *
 * A diferencia de ListarTiposTramiteUseCase (catálogo completo, solo interno),
 * está disponible a cualquier usuario autenticado pero NO expone el catálogo
 * entero: acota a lo que el externo realmente puede iniciar.
 */
export class ListarTiposIniciablesExternoUseCase {
  constructor(private readonly tipos: TipoTramiteRepository) {}

  async execute(): Promise<TipoTramiteView[]> {
    const tipos = await this.tipos.list();
    return tipos.filter((t) => t.estaActivo() && t.permiteInicioExterno()).map(toTipoTramiteView);
  }
}
