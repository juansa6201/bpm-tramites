import { TramiteRepository } from '../../../domain/repositories/tramite.repository';
import { EditarTramiteInput } from '../../dto/tramites/editar-tramite.input';
import { TramiteView, toTramiteView } from '../../dto/tramites/tramite.view';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import {
  TramiteNoEncontradoError,
  TramiteNoEditableError,
  CamposSoloEditablesEnBorradorError,
} from '../../../domain/tramites/errors/tramite.errors';
import { RequiereUsuarioInternoError } from '../../../domain/shared/errors/authz.errors';
import { autorizarVisibilidad } from './workflow-helpers';

/**
 * Edita datos descriptivos de un trámite (no es transición: sin MovimientoTramite).
 *  - titulo/descripcion: solo mientras es BORRADOR.
 *  - prioridad: en cualquier estado no terminal, solo internos (ajuste operativo).
 * Persiste con bloqueo optimista (version).
 */
export class EditarTramiteUseCase {
  constructor(private readonly tramites: TramiteRepository) {}

  async execute(input: EditarTramiteInput): Promise<TramiteView> {
    const tramite = await this.tramites.findById(input.tramiteId);
    if (!tramite) throw new TramiteNoEncontradoError(input.tramiteId);

    autorizarVisibilidad(tramite, input.actor);

    // PUT sin campos: no-op. No se escribe (evita bumpear `version` y disparar
    // un 409 espurio en un editor concurrente legítimo).
    const hayEdicion =
      input.titulo !== undefined ||
      input.descripcion !== undefined ||
      input.prioridad !== undefined;
    if (!hayEdicion) return toTramiteView(tramite);

    if (tramite.esTerminal()) throw new TramiteNoEditableError();

    const editaTituloODescripcion = input.titulo !== undefined || input.descripcion !== undefined;
    if (editaTituloODescripcion && !tramite.esBorrador()) {
      throw new CamposSoloEditablesEnBorradorError();
    }
    if (input.prioridad !== undefined && input.actor.tipo !== TipoUsuario.INTERNO) {
      throw new RequiereUsuarioInternoError();
    }

    if (input.titulo !== undefined) tramite.editarTitulo(input.titulo);
    if (input.descripcion !== undefined) tramite.editarDescripcion(input.descripcion);
    if (input.prioridad !== undefined) tramite.cambiarPrioridad(input.prioridad);

    await this.tramites.update(tramite);

    // Re-lee para devolver el estado canónico (incluida la version incrementada).
    const actualizado = await this.tramites.findById(tramite.id);
    return toTramiteView(actualizado ?? tramite);
  }
}
