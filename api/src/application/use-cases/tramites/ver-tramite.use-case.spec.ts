import { VerTramiteUseCase } from './ver-tramite.use-case';
import { TramiteRepository } from '../../../domain/repositories/tramite.repository';
import { MovimientoTramiteRepository } from '../../../domain/repositories/movimiento-tramite.repository';
import { WorkflowStateMachine } from '../../../domain/services/workflow-state-machine';
import { Tramite, TramiteProps } from '../../../domain/tramites/entities/tramite.entity';
import { MovimientoTramite } from '../../../domain/tramites/entities/movimiento-tramite.entity';
import { EstadoTramite } from '../../../domain/tramites/enums/estado-tramite.enum';
import { OrigenTramite } from '../../../domain/tramites/enums/origen-tramite.enum';
import { PrioridadTramite } from '../../../domain/tramites/enums/prioridad-tramite.enum';
import { AccionMovimiento } from '../../../domain/tramites/enums/accion-movimiento.enum';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../../domain/usuarios/enums/rol-interno.enum';
import { Actor } from '../../dto/actor';
import {
  TramiteNoEncontradoError,
  ExternoNoParticipaError,
  SinPermisoSobreAreaError,
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

function movimiento(): MovimientoTramite {
  return new MovimientoTramite({
    id: 'm1',
    tramiteId: 't1',
    estadoAnterior: EstadoTramite.INGRESADO,
    estadoNuevo: EstadoTramite.EN_REVISION,
    areaAnteriorId: null,
    areaNuevaId: null,
    usuarioTipo: TipoUsuario.INTERNO,
    usuarioId: 'int1',
    accion: AccionMovimiento.TOMAR,
    comentario: null,
    fecha: new Date('2026-01-02'),
  });
}

class FakeTramiteRepo implements Partial<TramiteRepository> {
  constructor(private readonly t: Tramite | null) {}
  findById(): Promise<Tramite | null> {
    return Promise.resolve(this.t);
  }
}

class FakeMovimientoRepo implements Partial<MovimientoTramiteRepository> {
  llamadoCon?: string;
  constructor(private readonly movs: MovimientoTramite[]) {}
  listByTramite(tramiteId: string): Promise<MovimientoTramite[]> {
    this.llamadoCon = tramiteId;
    return Promise.resolve(this.movs);
  }
}

function build(t: Tramite | null, movs: MovimientoTramite[] = []) {
  const movRepo = new FakeMovimientoRepo(movs);
  const uc = new VerTramiteUseCase(
    new FakeTramiteRepo(t) as unknown as TramiteRepository,
    movRepo as unknown as MovimientoTramiteRepository,
    new WorkflowStateMachine(),
  );
  return { uc, movRepo };
}

const externo = (id: string): Actor => ({ tipo: TipoUsuario.EXTERNO, id });
const interno = (rol: RolInterno, areaId: string): Actor => ({
  tipo: TipoUsuario.INTERNO,
  id: 'int1',
  rol,
  areaId,
});

describe('VerTramiteUseCase', () => {
  it('lanza 404 si el trámite no existe', async () => {
    const { uc } = build(null);
    await expect(
      uc.execute({ tramiteId: 'nope', actor: interno(RolInterno.ADMIN, 'x') }),
    ).rejects.toBeInstanceOf(TramiteNoEncontradoError);
  });

  it('el externo participante ve el detalle con su timeline', async () => {
    const { uc, movRepo } = build(tramite(), [movimiento()]);
    const res = await uc.execute({ tramiteId: 't1', actor: externo('ext1') });
    expect(res.id).toBe('t1');
    expect(res.movimientos).toHaveLength(1);
    expect(res.movimientos[0]).toMatchObject({ accion: AccionMovimiento.TOMAR });
    expect(movRepo.llamadoCon).toBe('t1');
  });

  it('un externo ajeno recibe 403 (ExternoNoParticipa)', async () => {
    const { uc } = build(tramite());
    await expect(uc.execute({ tramiteId: 't1', actor: externo('otro') })).rejects.toBeInstanceOf(
      ExternoNoParticipaError,
    );
  });

  it('un operativo de otra área recibe 403 (SinPermisoSobreArea)', async () => {
    const { uc } = build(tramite({ areaActualId: 'areaB' }));
    await expect(
      uc.execute({ tramiteId: 't1', actor: interno(RolInterno.OPERADOR, 'areaA') }),
    ).rejects.toBeInstanceOf(SinPermisoSobreAreaError);
  });

  it('un admin ve cualquier trámite, sin importar el área', async () => {
    const { uc } = build(tramite({ areaActualId: 'otra' }), [movimiento()]);
    const res = await uc.execute({ tramiteId: 't1', actor: interno(RolInterno.ADMIN, 'areaA') });
    expect(res.id).toBe('t1');
  });

  it('incluye accionesPermitidas del actor (admin en EN_REVISION: observar/aprobar/rechazar/cancelar)', async () => {
    const { uc } = build(tramite(), [movimiento()]);
    const res = await uc.execute({ tramiteId: 't1', actor: interno(RolInterno.ADMIN, 'areaA') });
    expect(res.accionesPermitidas).toEqual(
      expect.arrayContaining([
        AccionMovimiento.OBSERVAR,
        AccionMovimiento.APROBAR,
        AccionMovimiento.RECHAZAR,
        AccionMovimiento.CANCELAR,
      ]),
    );
    // No filtra acciones externas ni de otros estados.
    expect(res.accionesPermitidas).not.toContain(AccionMovimiento.RESPONDER_OBSERVACION);
    expect(res.accionesPermitidas).not.toContain(AccionMovimiento.TOMAR);
  });

  it('un externo participante en EN_REVISION no tiene acciones (solo lectura)', async () => {
    const { uc } = build(tramite(), [movimiento()]);
    const res = await uc.execute({ tramiteId: 't1', actor: externo('ext1') });
    expect(res.accionesPermitidas).toEqual([]);
  });

  it('el detalle es un objeto plano (sin "props", serializable)', async () => {
    const { uc } = build(tramite(), [movimiento()]);
    const res = await uc.execute({ tramiteId: 't1', actor: interno(RolInterno.ADMIN, 'areaA') });
    expect(res).not.toHaveProperty('props');
    expect(res.movimientos[0]).not.toHaveProperty('props');
    const round = JSON.parse(JSON.stringify(res));
    expect(round).toMatchObject({ id: 't1', movimientos: [{ id: 'm1' }] });
  });
});
