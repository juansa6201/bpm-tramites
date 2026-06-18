import { EditarTramiteUseCase } from './editar-tramite.use-case';
import { TramiteRepository } from '../../../domain/repositories/tramite.repository';
import { Tramite, TramiteProps } from '../../../domain/tramites/entities/tramite.entity';
import { EstadoTramite } from '../../../domain/tramites/enums/estado-tramite.enum';
import { OrigenTramite } from '../../../domain/tramites/enums/origen-tramite.enum';
import { PrioridadTramite } from '../../../domain/tramites/enums/prioridad-tramite.enum';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../../domain/usuarios/enums/rol-interno.enum';
import { Actor } from '../../dto/actor';
import {
  TramiteNoEncontradoError,
  TramiteNoEditableError,
  CamposSoloEditablesEnBorradorError,
} from '../../../domain/tramites/errors/tramite.errors';
import { RequiereUsuarioInternoError } from '../../../domain/shared/errors/authz.errors';

function tramite(over: Partial<TramiteProps> = {}): Tramite {
  return new Tramite({
    id: 't1',
    numero: 'EXT-2026-00001',
    titulo: 'orig',
    descripcion: 'orig-desc',
    origen: OrigenTramite.EXTERNO_INTERNO,
    estado: EstadoTramite.BORRADOR,
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

class FakeTramiteRepo implements Partial<TramiteRepository> {
  actualizado?: Tramite;
  constructor(private current: Tramite | null) {}
  findById(): Promise<Tramite | null> {
    return Promise.resolve(this.current);
  }
  update(t: Tramite): Promise<void> {
    this.actualizado = t;
    this.current = t; // el re-fetch devuelve lo actualizado
    return Promise.resolve();
  }
}

function build(t: Tramite | null) {
  const repo = new FakeTramiteRepo(t);
  return { uc: new EditarTramiteUseCase(repo as unknown as TramiteRepository), repo };
}

const externo = (id: string): Actor => ({ tipo: TipoUsuario.EXTERNO, id });
const interno = (rol: RolInterno, areaId: string): Actor => ({
  tipo: TipoUsuario.INTERNO,
  id: 'int1',
  rol,
  areaId,
});

describe('EditarTramiteUseCase', () => {
  it('404 si no existe', async () => {
    const { uc } = build(null);
    await expect(
      uc.execute({ tramiteId: 'x', actor: interno(RolInterno.ADMIN, 'a'), titulo: 'z' }),
    ).rejects.toBeInstanceOf(TramiteNoEncontradoError);
  });

  it('no editable si está en estado terminal (422)', async () => {
    const { uc } = build(tramite({ estado: EstadoTramite.CERRADO }));
    await expect(
      uc.execute({
        tramiteId: 't1',
        actor: interno(RolInterno.ADMIN, 'areaA'),
        prioridad: PrioridadTramite.ALTA,
      }),
    ).rejects.toBeInstanceOf(TramiteNoEditableError);
  });

  it('titulo/descripcion fuera de BORRADOR → 422', async () => {
    const { uc } = build(tramite({ estado: EstadoTramite.EN_REVISION }));
    await expect(
      uc.execute({
        tramiteId: 't1',
        actor: interno(RolInterno.OPERADOR, 'areaA'),
        titulo: 'nuevo',
      }),
    ).rejects.toBeInstanceOf(CamposSoloEditablesEnBorradorError);
  });

  it('un externo no puede cambiar la prioridad (403)', async () => {
    const { uc } = build(tramite({ estado: EstadoTramite.EN_REVISION }));
    await expect(
      uc.execute({ tramiteId: 't1', actor: externo('ext1'), prioridad: PrioridadTramite.ALTA }),
    ).rejects.toBeInstanceOf(RequiereUsuarioInternoError);
  });

  it('un interno cambia la prioridad en EN_REVISION', async () => {
    const { uc, repo } = build(tramite({ estado: EstadoTramite.EN_REVISION }));
    const res = await uc.execute({
      tramiteId: 't1',
      actor: interno(RolInterno.OPERADOR, 'areaA'),
      prioridad: PrioridadTramite.ALTA,
    });
    expect(repo.actualizado?.prioridad).toBe(PrioridadTramite.ALTA);
    expect(res.prioridad).toBe(PrioridadTramite.ALTA);
    expect(res).not.toHaveProperty('props');
  });

  it('el creador externo edita titulo/descripcion de su BORRADOR', async () => {
    const { uc, repo } = build(tramite());
    await uc.execute({
      tramiteId: 't1',
      actor: externo('ext1'),
      titulo: 'nuevo',
      descripcion: 'nueva',
    });
    expect(repo.actualizado?.titulo).toBe('nuevo');
    expect(repo.actualizado?.descripcion).toBe('nueva');
  });

  it('PUT sin campos es no-op: no escribe ni bumpea version', async () => {
    const { uc, repo } = build(tramite({ estado: EstadoTramite.EN_REVISION }));
    const res = await uc.execute({ tramiteId: 't1', actor: interno(RolInterno.OPERADOR, 'areaA') });
    expect(repo.actualizado).toBeUndefined();
    expect(res).toMatchObject({ id: 't1' });
  });
});
