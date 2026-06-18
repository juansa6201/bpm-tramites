import { ListarTiposTramiteUseCase } from './listar-tipos-tramite.use-case';
import { CrearTipoTramiteUseCase } from './crear-tipo-tramite.use-case';
import { ActualizarTipoTramiteUseCase } from './actualizar-tipo-tramite.use-case';
import {
  ActualizarTipoTramiteData,
  CrearTipoTramiteData,
  TipoTramiteRepository,
} from '../../../domain/repositories/tipo-tramite.repository';
import { AreaRepository } from '../../../domain/repositories/area.repository';
import { TipoTramite } from '../../../domain/tramites/entities/tipo-tramite.entity';
import { Area } from '../../../domain/tramites/entities/area.entity';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../../domain/usuarios/enums/rol-interno.enum';
import { Actor } from '../../dto/actor';
import {
  RequiereRolAdminError,
  RequiereUsuarioInternoError,
} from '../../../domain/shared/errors/authz.errors';
import { AreaNoEncontradaError } from '../../../domain/tramites/errors/config.errors';
import { TipoTramiteNoEncontradoError } from '../../../domain/tramites/errors/tramite.errors';

function tipo(over: Partial<CrearTipoTramiteData> & { id?: string } = {}): TipoTramite {
  return new TipoTramite({
    id: over.id ?? 'tt1',
    codigo: over.codigo ?? 'ALTA',
    nombre: over.nombre ?? 'Alta proveedor',
    descripcion: over.descripcion ?? null,
    activo: over.activo ?? true,
    requiereExterno: over.requiereExterno ?? false,
    permiteInicioExterno: over.permiteInicioExterno ?? false,
    slaHoras: over.slaHoras ?? 48,
    areaInicialId: over.areaInicialId ?? null,
  });
}

class FakeTipoRepo implements TipoTramiteRepository {
  creado?: CrearTipoTramiteData;
  actualizado?: { id: string; data: ActualizarTipoTramiteData };
  existe: TipoTramite | null = tipo();
  findById(): Promise<TipoTramite | null> {
    return Promise.resolve(this.existe);
  }
  findByCodigo(): Promise<TipoTramite | null> {
    return Promise.resolve(null);
  }
  list(): Promise<TipoTramite[]> {
    return Promise.resolve([tipo()]);
  }
  create(data: CrearTipoTramiteData): Promise<TipoTramite> {
    this.creado = data;
    return Promise.resolve(tipo(data));
  }
  update(id: string, data: ActualizarTipoTramiteData): Promise<TipoTramite> {
    this.actualizado = { id, data };
    return Promise.resolve(tipo({ id }));
  }
}

class FakeAreaRepo implements Partial<AreaRepository> {
  constructor(private readonly area: Area | null) {}
  findById(): Promise<Area | null> {
    return Promise.resolve(this.area);
  }
}

const areaOk = new Area({ id: 'a1', nombre: 'Legal', codigo: 'LEGAL', activa: true });
const areas = (a: Area | null) => new FakeAreaRepo(a) as unknown as AreaRepository;

const admin: Actor = { tipo: TipoUsuario.INTERNO, id: 'i', rol: RolInterno.ADMIN, areaId: 'a1' };
const operador: Actor = {
  tipo: TipoUsuario.INTERNO,
  id: 'i',
  rol: RolInterno.OPERADOR,
  areaId: 'a1',
};
const externo: Actor = { tipo: TipoUsuario.EXTERNO, id: 'e' };

describe('Config Tipos de trámite - autorización y validaciones', () => {
  it('listar: un externo no puede (403)', async () => {
    await expect(
      new ListarTiposTramiteUseCase(new FakeTipoRepo()).execute({ actor: externo }),
    ).rejects.toBeInstanceOf(RequiereUsuarioInternoError);
  });

  it('listar: un interno recibe vistas planas con flags resueltas', async () => {
    const res = await new ListarTiposTramiteUseCase(new FakeTipoRepo()).execute({
      actor: operador,
    });
    expect(res[0]).not.toHaveProperty('props');
    expect(res[0]).toMatchObject({
      codigo: 'ALTA',
      activo: true,
      requiereExterno: false,
      slaHoras: 48,
    });
  });

  it('crear: no-admin no puede (403)', async () => {
    await expect(
      new CrearTipoTramiteUseCase(new FakeTipoRepo(), areas(areaOk)).execute({
        actor: operador,
        codigo: 'X',
        nombre: 'X',
        slaHoras: 24,
      }),
    ).rejects.toBeInstanceOf(RequiereRolAdminError);
  });

  it('crear: si areaInicialId no existe → 404', async () => {
    await expect(
      new CrearTipoTramiteUseCase(new FakeTipoRepo(), areas(null)).execute({
        actor: admin,
        codigo: 'X',
        nombre: 'X',
        slaHoras: 24,
        areaInicialId: 'no-existe',
      }),
    ).rejects.toBeInstanceOf(AreaNoEncontradaError);
  });

  it('crear: admin con área válida persiste los datos', async () => {
    const repo = new FakeTipoRepo();
    await new CrearTipoTramiteUseCase(repo, areas(areaOk)).execute({
      actor: admin,
      codigo: 'REV',
      nombre: 'Revisión',
      slaHoras: 72,
      areaInicialId: 'a1',
    });
    expect(repo.creado).toMatchObject({ codigo: 'REV', slaHoras: 72, areaInicialId: 'a1' });
  });

  it('actualizar: 404 si el tipo no existe', async () => {
    const repo = new FakeTipoRepo();
    repo.existe = null;
    await expect(
      new ActualizarTipoTramiteUseCase(repo, areas(areaOk)).execute({
        actor: admin,
        id: 'nope',
        nombre: 'Z',
      }),
    ).rejects.toBeInstanceOf(TipoTramiteNoEncontradoError);
  });

  it('actualizar: admin cambia campos sin tocar codigo', async () => {
    const repo = new FakeTipoRepo();
    await new ActualizarTipoTramiteUseCase(repo, areas(areaOk)).execute({
      actor: admin,
      id: 'tt1',
      slaHoras: 12,
      activo: false,
    });
    expect(repo.actualizado).toEqual({
      id: 'tt1',
      data: expect.objectContaining({ slaHoras: 12, activo: false }),
    });
  });
});
