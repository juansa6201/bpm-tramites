import { ListarTramitesUseCase } from './listar-tramites.use-case';
import {
  CrearTramiteData,
  TramiteFilters,
  TramiteRepository,
} from '../../../domain/repositories/tramite.repository';
import { PaginatedResult } from '../../../domain/shared/pagination';
import { Tramite, TramiteProps } from '../../../domain/tramites/entities/tramite.entity';
import { EstadoTramite } from '../../../domain/tramites/enums/estado-tramite.enum';
import { OrigenTramite } from '../../../domain/tramites/enums/origen-tramite.enum';
import { PrioridadTramite } from '../../../domain/tramites/enums/prioridad-tramite.enum';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../../domain/usuarios/enums/rol-interno.enum';
import { Actor } from '../../dto/actor';

function tramite(over: Partial<TramiteProps> = {}): Tramite {
  return new Tramite({
    id: 't1',
    numero: 'EXT-2026-00001',
    titulo: 'x',
    descripcion: 'y',
    origen: OrigenTramite.EXTERNO_INTERNO,
    estado: EstadoTramite.INGRESADO,
    prioridad: PrioridadTramite.MEDIA,
    tipoTramiteId: 'tt1',
    areaActualId: 'areaA',
    usuarioAsignadoId: null,
    usuarioExternoId: 'ext1',
    creadoPorTipo: TipoUsuario.EXTERNO,
    creadoPorId: 'ext1',
    version: 0,
    fechaCreacion: new Date('2026-01-01'),
    fechaActualizacion: new Date('2026-01-02'),
    fechaCierre: null,
    ...over,
  });
}

/** Repo falso que captura los filtros recibidos y devuelve una página fija. */
class FakeTramiteRepository implements TramiteRepository {
  ultimosFiltros?: TramiteFilters;
  page: PaginatedResult<Tramite> = { items: [tramite()], total: 1, page: 3, pageSize: 7 };

  list(filters: TramiteFilters): Promise<PaginatedResult<Tramite>> {
    this.ultimosFiltros = filters;
    return Promise.resolve(this.page);
  }
  findById(): Promise<Tramite | null> {
    throw new Error('no usado');
  }
  findByNumero(): Promise<Tramite | null> {
    throw new Error('no usado');
  }
  create(_d: CrearTramiteData): Promise<Tramite> {
    throw new Error('no usado');
  }
  ultimoNumeroConPrefijo(): Promise<string | null> {
    throw new Error('no usado');
  }
  delete(): Promise<void> {
    throw new Error('no usado');
  }
  softDelete(): Promise<void> {
    throw new Error('no usado');
  }
  update(): Promise<void> {
    throw new Error('no usado');
  }
  tomarAtomico(): Promise<boolean> {
    throw new Error('no usado');
  }
}

const externo = (id: string): Actor => ({ tipo: TipoUsuario.EXTERNO, id });
const interno = (rol: RolInterno, areaId: string): Actor => ({
  tipo: TipoUsuario.INTERNO,
  id: 'int1',
  rol,
  areaId,
});

describe('ListarTramitesUseCase', () => {
  let repo: FakeTramiteRepository;
  let uc: ListarTramitesUseCase;

  beforeEach(() => {
    repo = new FakeTramiteRepository();
    uc = new ListarTramitesUseCase(repo);
  });

  it('un externo solo ve los suyos: fuerza usuarioExternoId aunque pida otro', async () => {
    await uc.execute({ actor: externo('ext1'), filtros: { usuarioExternoId: 'otro' } });
    expect(repo.ultimosFiltros?.usuarioExternoId).toBe('ext1');
  });

  it('un operativo se restringe a SU área aunque pida otra', async () => {
    await uc.execute({
      actor: interno(RolInterno.OPERADOR, 'areaA'),
      filtros: { areaActualId: 'areaB' },
    });
    expect(repo.ultimosFiltros?.areaActualId).toBe('areaA');
  });

  it('un admin no tiene área forzada: respeta el filtro pedido', async () => {
    await uc.execute({
      actor: interno(RolInterno.ADMIN, 'areaA'),
      filtros: { areaActualId: 'areaB' },
    });
    expect(repo.ultimosFiltros?.areaActualId).toBe('areaB');
  });

  it('un auditor sin filtro de área no fuerza ninguna (ve todo)', async () => {
    await uc.execute({ actor: interno(RolInterno.AUDITOR, 'areaA'), filtros: {} });
    expect(repo.ultimosFiltros?.areaActualId).toBeUndefined();
  });

  it('fail-closed: un operativo SIN área no consulta y devuelve vacío', async () => {
    const res = await uc.execute({
      actor: { tipo: TipoUsuario.INTERNO, id: 'int1', rol: RolInterno.OPERADOR, areaId: '' },
      filtros: { page: 2, pageSize: 10 },
    });
    expect(res).toEqual({ items: [], total: 0, page: 2, pageSize: 10 });
    expect(repo.ultimosFiltros).toBeUndefined(); // nunca le pegó al repo
  });

  it('los filtros libres (estado/origen/prioridad/paginado) se pasan tal cual al repo', async () => {
    await uc.execute({
      actor: interno(RolInterno.ADMIN, 'areaA'),
      filtros: {
        estado: EstadoTramite.EN_REVISION,
        origen: OrigenTramite.INTERNO_INTERNO,
        prioridad: PrioridadTramite.ALTA,
        page: 2,
        pageSize: 50,
      },
    });
    expect(repo.ultimosFiltros).toMatchObject({
      estado: EstadoTramite.EN_REVISION,
      origen: OrigenTramite.INTERNO_INTERNO,
      prioridad: PrioridadTramite.ALTA,
      page: 2,
      pageSize: 50,
    });
  });

  it('delega total/page/pageSize al repo (no pagina en memoria)', async () => {
    const res = await uc.execute({ actor: interno(RolInterno.ADMIN, 'areaA'), filtros: {} });
    expect(res).toMatchObject({ total: 1, page: 3, pageSize: 7 });
  });

  it('serializa cada item como objeto plano (sin "props", con getters resueltos)', async () => {
    const res = await uc.execute({ actor: interno(RolInterno.ADMIN, 'areaA'), filtros: {} });
    const item = res.items[0];
    expect(item).not.toHaveProperty('props');
    expect(item).toMatchObject({
      id: 't1',
      numero: 'EXT-2026-00001',
      estado: EstadoTramite.INGRESADO,
    });
    expect(JSON.parse(JSON.stringify(item))).toMatchObject({ id: 't1', numero: 'EXT-2026-00001' });
  });
});
