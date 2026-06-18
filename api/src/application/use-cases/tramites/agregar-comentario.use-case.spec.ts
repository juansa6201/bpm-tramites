import { AgregarComentarioUseCase } from './agregar-comentario.use-case';
import { TramiteRepository } from '../../../domain/repositories/tramite.repository';
import {
  ComentarioTramiteRepository,
  NuevoComentarioData,
} from '../../../domain/repositories/comentario-tramite.repository';
import { Tramite, TramiteProps } from '../../../domain/tramites/entities/tramite.entity';
import { ComentarioTramite } from '../../../domain/tramites/entities/comentario-tramite.entity';
import { EstadoTramite } from '../../../domain/tramites/enums/estado-tramite.enum';
import { OrigenTramite } from '../../../domain/tramites/enums/origen-tramite.enum';
import { PrioridadTramite } from '../../../domain/tramites/enums/prioridad-tramite.enum';
import { Visibilidad } from '../../../domain/tramites/enums/visibilidad.enum';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../../domain/usuarios/enums/rol-interno.enum';
import { Actor } from '../../dto/actor';
import {
  TramiteNoEncontradoError,
  ExternoNoParticipaError,
  SinPermisoSobreAreaError,
  VisibilidadNoPermitidaError,
} from '../../../domain/tramites/errors/tramite.errors';

function tramite(over: Partial<TramiteProps> = {}): Tramite {
  return new Tramite({
    id: 't1',
    numero: 'EXT-2026-00001',
    titulo: 'x',
    descripcion: 'y',
    origen: OrigenTramite.EXTERNO_INTERNO,
    estado: EstadoTramite.EN_REVISION,
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

class FakeComentarioRepo implements ComentarioTramiteRepository {
  ultimo?: NuevoComentarioData;
  create(data: NuevoComentarioData): Promise<ComentarioTramite> {
    this.ultimo = data;
    return Promise.resolve(
      new ComentarioTramite({
        id: 'c1',
        tramiteId: data.tramiteId,
        mensaje: data.mensaje,
        visibilidad: data.visibilidad,
        autorTipo: data.autorTipo,
        autorId: data.autorId,
        fecha: new Date('2026-02-01'),
      }),
    );
  }
  listByTramite(): Promise<ComentarioTramite[]> {
    throw new Error('no usado');
  }
}

function build(t: Tramite | null) {
  const comentarios = new FakeComentarioRepo();
  const tramites = { findById: () => Promise.resolve(t) } as unknown as TramiteRepository;
  return { uc: new AgregarComentarioUseCase(tramites, comentarios), comentarios };
}

const externo = (id: string): Actor => ({ tipo: TipoUsuario.EXTERNO, id });
const interno = (rol: RolInterno, areaId: string): Actor => ({
  tipo: TipoUsuario.INTERNO,
  id: 'int1',
  rol,
  areaId,
});

describe('AgregarComentarioUseCase', () => {
  it('lanza 404 si el trámite no existe', async () => {
    const { uc } = build(null);
    await expect(
      uc.execute({ tramiteId: 'x', actor: interno(RolInterno.ADMIN, 'a'), mensaje: 'hola' }),
    ).rejects.toBeInstanceOf(TramiteNoEncontradoError);
  });

  it('un externo ajeno no puede comentar (403)', async () => {
    const { uc } = build(tramite());
    await expect(
      uc.execute({ tramiteId: 't1', actor: externo('otro'), mensaje: 'hola' }),
    ).rejects.toBeInstanceOf(ExternoNoParticipaError);
  });

  it('un operativo de otra área no puede comentar (403)', async () => {
    const { uc } = build(tramite({ areaActualId: 'areaB' }));
    await expect(
      uc.execute({ tramiteId: 't1', actor: interno(RolInterno.OPERADOR, 'areaA'), mensaje: 'h' }),
    ).rejects.toBeInstanceOf(SinPermisoSobreAreaError);
  });

  it('default de visibilidad es TODOS', async () => {
    const { uc, comentarios } = build(tramite());
    const res = await uc.execute({ tramiteId: 't1', actor: externo('ext1'), mensaje: 'hola' });
    expect(comentarios.ultimo?.visibilidad).toBe(Visibilidad.TODOS);
    expect(res).toMatchObject({ id: 'c1', mensaje: 'hola', visibilidad: Visibilidad.TODOS });
    expect(res).not.toHaveProperty('props');
  });

  it('un externo NO puede marcar un comentario como INTERNA (403)', async () => {
    const { uc } = build(tramite());
    await expect(
      uc.execute({
        tramiteId: 't1',
        actor: externo('ext1'),
        mensaje: 'secreto',
        visibilidad: Visibilidad.INTERNA,
      }),
    ).rejects.toBeInstanceOf(VisibilidadNoPermitidaError);
  });

  it('un interno SÍ puede marcar un comentario como INTERNA', async () => {
    const { uc, comentarios } = build(tramite());
    await uc.execute({
      tramiteId: 't1',
      actor: interno(RolInterno.OPERADOR, 'areaA'),
      mensaje: 'nota interna',
      visibilidad: Visibilidad.INTERNA,
    });
    expect(comentarios.ultimo?.visibilidad).toBe(Visibilidad.INTERNA);
    expect(comentarios.ultimo?.autorTipo).toBe(TipoUsuario.INTERNO);
  });
});
