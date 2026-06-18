import { ListarComentariosUseCase } from './listar-comentarios.use-case';
import { TramiteRepository } from '../../../domain/repositories/tramite.repository';
import { ComentarioTramiteRepository } from '../../../domain/repositories/comentario-tramite.repository';
import { Tramite, TramiteProps } from '../../../domain/tramites/entities/tramite.entity';
import { ComentarioTramite } from '../../../domain/tramites/entities/comentario-tramite.entity';
import { EstadoTramite } from '../../../domain/tramites/enums/estado-tramite.enum';
import { OrigenTramite } from '../../../domain/tramites/enums/origen-tramite.enum';
import { PrioridadTramite } from '../../../domain/tramites/enums/prioridad-tramite.enum';
import { Visibilidad } from '../../../domain/tramites/enums/visibilidad.enum';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../../domain/usuarios/enums/rol-interno.enum';
import { Actor } from '../../dto/actor';
import { TramiteNoEncontradoError } from '../../../domain/tramites/errors/tramite.errors';

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

function comentario(id: string, visibilidad: Visibilidad): ComentarioTramite {
  return new ComentarioTramite({
    id,
    tramiteId: 't1',
    mensaje: `msg-${id}`,
    visibilidad,
    autorTipo: TipoUsuario.INTERNO,
    autorId: 'int1',
    fecha: new Date('2026-02-01'),
  });
}

function build(t: Tramite | null, comentarios: ComentarioTramite[]) {
  const tramites = { findById: () => Promise.resolve(t) } as unknown as TramiteRepository;
  const comentarioRepo = {
    listByTramite: () => Promise.resolve(comentarios),
  } as unknown as ComentarioTramiteRepository;
  return new ListarComentariosUseCase(tramites, comentarioRepo);
}

const externo = (id: string): Actor => ({ tipo: TipoUsuario.EXTERNO, id });
const interno = (rol: RolInterno, areaId: string): Actor => ({
  tipo: TipoUsuario.INTERNO,
  id: 'int1',
  rol,
  areaId,
});

describe('ListarComentariosUseCase', () => {
  it('lanza 404 si el trámite no existe', async () => {
    const uc = build(null, []);
    await expect(
      uc.execute({ tramiteId: 'x', actor: interno(RolInterno.ADMIN, 'a') }),
    ).rejects.toBeInstanceOf(TramiteNoEncontradoError);
  });

  it('un externo participante NO ve los comentarios INTERNA', async () => {
    const uc = build(tramite(), [
      comentario('c1', Visibilidad.TODOS),
      comentario('c2', Visibilidad.INTERNA),
      comentario('c3', Visibilidad.EXTERNA),
    ]);
    const res = await uc.execute({ tramiteId: 't1', actor: externo('ext1') });
    expect(res.map((c) => c.id)).toEqual(['c1', 'c3']);
  });

  it('un interno ve TODOS los comentarios, incluidos los INTERNA', async () => {
    const uc = build(tramite(), [
      comentario('c1', Visibilidad.TODOS),
      comentario('c2', Visibilidad.INTERNA),
    ]);
    const res = await uc.execute({ tramiteId: 't1', actor: interno(RolInterno.OPERADOR, 'areaA') });
    expect(res.map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(res[0]).not.toHaveProperty('props');
  });
});
