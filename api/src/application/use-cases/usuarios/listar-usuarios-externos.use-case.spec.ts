import { ListarUsuariosExternosUseCase } from './listar-usuarios-externos.use-case';
import {
  ListarUsuariosExternosFiltros,
  UsuarioExternoRepository,
} from '../../../domain/usuarios/repositories/usuario-externo.repository';
import { UsuarioExterno } from '../../../domain/usuarios/entities/usuario-externo.entity';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../../domain/usuarios/enums/rol-interno.enum';
import { RequiereUsuarioInternoError } from '../../../domain/shared/errors/authz.errors';
import { Actor } from '../../dto/actor';

class FakeUsuarioExternoRepo implements Partial<UsuarioExternoRepository> {
  ultimosFiltros?: ListarUsuariosExternosFiltros;
  lista: UsuarioExterno[] = [
    {
      id: 'ext1',
      nombre: 'Juana Pérez',
      email: 'juana@x.com',
      documento: 'DOC-1',
      organizacion: null,
      estado: 'ACTIVO',
    } as unknown as UsuarioExterno,
  ];

  list(filtros?: ListarUsuariosExternosFiltros): Promise<UsuarioExterno[]> {
    this.ultimosFiltros = filtros;
    return Promise.resolve(this.lista);
  }
}

const interno: Actor = {
  tipo: TipoUsuario.INTERNO,
  id: 'int1',
  rol: RolInterno.OPERADOR,
  areaId: 'a1',
};
const externo: Actor = { tipo: TipoUsuario.EXTERNO, id: 'ext1' };

function build() {
  const repo = new FakeUsuarioExternoRepo();
  const uc = new ListarUsuariosExternosUseCase(repo as unknown as UsuarioExternoRepository);
  return { repo, uc };
}

describe('ListarUsuariosExternosUseCase', () => {
  it('un externo NO puede listar (403)', async () => {
    const { uc } = build();
    await expect(uc.execute({ actor: externo })).rejects.toBeInstanceOf(
      RequiereUsuarioInternoError,
    );
  });

  it('un interno lista solo activos y recibe la vista plana', async () => {
    const { uc, repo } = build();
    const res = await uc.execute({ actor: interno });
    expect(repo.ultimosFiltros).toEqual({ soloActivos: true });
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ id: 'ext1', nombre: 'Juana Pérez', email: 'juana@x.com' });
    expect(res[0]).not.toHaveProperty('props');
  });
});
