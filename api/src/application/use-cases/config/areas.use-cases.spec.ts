import { ListarAreasUseCase } from './listar-areas.use-case';
import { CrearAreaUseCase } from './crear-area.use-case';
import { ActualizarAreaUseCase } from './actualizar-area.use-case';
import {
  ActualizarAreaData,
  AreaRepository,
  CrearAreaData,
} from '../../../domain/repositories/area.repository';
import { Area } from '../../../domain/tramites/entities/area.entity';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../../domain/usuarios/enums/rol-interno.enum';
import { Actor } from '../../dto/actor';
import {
  RequiereRolAdminError,
  RequiereUsuarioInternoError,
} from '../../../domain/shared/errors/authz.errors';
import { AreaNoEncontradaError } from '../../../domain/tramites/errors/config.errors';

const area = (
  over: Partial<{ id: string; nombre: string; codigo: string; activa: boolean }> = {},
) => new Area({ id: 'a1', nombre: 'Legal', codigo: 'LEGAL', activa: true, ...over });

class FakeAreaRepo implements AreaRepository {
  creada?: CrearAreaData;
  actualizada?: { id: string; data: ActualizarAreaData };
  existe: Area | null = area();
  findById(): Promise<Area | null> {
    return Promise.resolve(this.existe);
  }
  findByCodigo(): Promise<Area | null> {
    return Promise.resolve(null);
  }
  list(): Promise<Area[]> {
    return Promise.resolve([area(), area({ id: 'a2', codigo: 'MESA' })]);
  }
  create(data: CrearAreaData): Promise<Area> {
    this.creada = data;
    return Promise.resolve(area({ nombre: data.nombre, codigo: data.codigo }));
  }
  update(id: string, data: ActualizarAreaData): Promise<Area> {
    this.actualizada = { id, data };
    return Promise.resolve(area({ id, nombre: data.nombre ?? 'Legal' }));
  }
}

const admin: Actor = { tipo: TipoUsuario.INTERNO, id: 'i', rol: RolInterno.ADMIN, areaId: 'a1' };
const operador: Actor = {
  tipo: TipoUsuario.INTERNO,
  id: 'i',
  rol: RolInterno.OPERADOR,
  areaId: 'a1',
};
const externo: Actor = { tipo: TipoUsuario.EXTERNO, id: 'e' };

describe('Config Áreas - autorización', () => {
  it('listar: un externo no puede (403)', async () => {
    await expect(
      new ListarAreasUseCase(new FakeAreaRepo()).execute({ actor: externo }),
    ).rejects.toBeInstanceOf(RequiereUsuarioInternoError);
  });

  it('listar: un interno sí, y devuelve vistas planas', async () => {
    const res = await new ListarAreasUseCase(new FakeAreaRepo()).execute({ actor: operador });
    expect(res).toHaveLength(2);
    expect(res[0]).not.toHaveProperty('props');
    expect(res[0]).toMatchObject({ codigo: 'LEGAL', activa: true });
  });

  it('crear: un operador no-admin no puede (403)', async () => {
    await expect(
      new CrearAreaUseCase(new FakeAreaRepo()).execute({
        actor: operador,
        nombre: 'X',
        codigo: 'X',
      }),
    ).rejects.toBeInstanceOf(RequiereRolAdminError);
  });

  it('crear: un admin sí', async () => {
    const repo = new FakeAreaRepo();
    const res = await new CrearAreaUseCase(repo).execute({
      actor: admin,
      nombre: 'Compras',
      codigo: 'COMP',
    });
    expect(repo.creada).toMatchObject({ nombre: 'Compras', codigo: 'COMP' });
    expect(res).toMatchObject({ codigo: 'COMP' });
  });

  it('actualizar: 404 si el área no existe', async () => {
    const repo = new FakeAreaRepo();
    repo.existe = null;
    await expect(
      new ActualizarAreaUseCase(repo).execute({ actor: admin, id: 'nope', nombre: 'Z' }),
    ).rejects.toBeInstanceOf(AreaNoEncontradaError);
  });

  it('actualizar: admin puede cambiar nombre/activa', async () => {
    const repo = new FakeAreaRepo();
    await new ActualizarAreaUseCase(repo).execute({
      actor: admin,
      id: 'a1',
      nombre: 'Legal 2',
      activa: false,
    });
    expect(repo.actualizada).toEqual({ id: 'a1', data: { nombre: 'Legal 2', activa: false } });
  });
});
