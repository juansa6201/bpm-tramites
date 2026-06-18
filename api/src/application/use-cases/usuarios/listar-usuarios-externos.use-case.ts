import { UsuarioExternoRepository } from '../../../domain/usuarios/repositories/usuario-externo.repository';
import { ListarUsuariosExternosInput } from '../../dto/usuarios/listar-usuarios-externos.input';
import { UsuarioExternoView, toUsuarioExternoView } from '../../dto/usuarios/usuario-externo.view';
import { requireInterno } from '../authz';

/**
 * Lista usuarios externos ACTIVOS (para designar el externo al crear un trámite
 * Interno→Externo). Solo usuarios internos pueden listarlos.
 */
export class ListarUsuariosExternosUseCase {
  constructor(private readonly usuarios: UsuarioExternoRepository) {}

  async execute(input: ListarUsuariosExternosInput): Promise<UsuarioExternoView[]> {
    requireInterno(input.actor);
    const usuarios = await this.usuarios.list({ soloActivos: true });
    return usuarios.map(toUsuarioExternoView);
  }
}
