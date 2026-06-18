import { VerDashboardUseCase } from './ver-dashboard.use-case';
import {
  ConteoPorClave,
  DashboardRepository,
  DashboardScope,
} from '../../../domain/repositories/dashboard.repository';
import { MovimientoTramite } from '../../../domain/tramites/entities/movimiento-tramite.entity';
import { EstadoTramite } from '../../../domain/tramites/enums/estado-tramite.enum';
import { AccionMovimiento } from '../../../domain/tramites/enums/accion-movimiento.enum';
import { TipoUsuario } from '../../../domain/usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../../domain/usuarios/enums/rol-interno.enum';
import { Actor } from '../../dto/actor';
import { RequiereUsuarioInternoError } from '../../../domain/shared/errors/authz.errors';

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
    fecha: new Date('2026-03-01'),
  });
}

class FakeDashboardRepo implements DashboardRepository {
  scopes: DashboardScope[] = [];
  llamado = false;
  private record(s: DashboardScope) {
    this.scopes.push(s);
    this.llamado = true;
  }
  contarPorEstado(s: DashboardScope): Promise<ConteoPorClave[]> {
    this.record(s);
    return Promise.resolve([{ clave: 'EN_REVISION', cantidad: 3 }]);
  }
  contarPorOrigen(s: DashboardScope): Promise<ConteoPorClave[]> {
    this.record(s);
    return Promise.resolve([{ clave: 'INTERNO_INTERNO', cantidad: 2 }]);
  }
  contarPorArea(s: DashboardScope): Promise<ConteoPorClave[]> {
    this.record(s);
    return Promise.resolve([{ clave: 'areaA', cantidad: 5 }]);
  }
  contarVencidosSla(s: DashboardScope): Promise<number> {
    this.record(s);
    return Promise.resolve(1);
  }
  promedioResolucionHoras(s: DashboardScope): Promise<number | null> {
    this.record(s);
    return Promise.resolve(40.5);
  }
  ultimosMovimientos(s: DashboardScope): Promise<MovimientoTramite[]> {
    this.record(s);
    return Promise.resolve([movimiento()]);
  }
}

const admin: Actor = { tipo: TipoUsuario.INTERNO, id: 'i', rol: RolInterno.ADMIN, areaId: 'areaA' };
const auditor: Actor = {
  tipo: TipoUsuario.INTERNO,
  id: 'i',
  rol: RolInterno.AUDITOR,
  areaId: 'areaA',
};
const operador: Actor = {
  tipo: TipoUsuario.INTERNO,
  id: 'i',
  rol: RolInterno.OPERADOR,
  areaId: 'areaA',
};
const externo: Actor = { tipo: TipoUsuario.EXTERNO, id: 'e' };

describe('VerDashboardUseCase', () => {
  it('un externo no puede ver el dashboard (403)', async () => {
    await expect(
      new VerDashboardUseCase(new FakeDashboardRepo()).execute({ actor: externo }),
    ).rejects.toBeInstanceOf(RequiereUsuarioInternoError);
  });

  it('admin → alcance GLOBAL (scope.areaId null)', async () => {
    const repo = new FakeDashboardRepo();
    const res = await new VerDashboardUseCase(repo).execute({ actor: admin });
    expect(res.alcance).toBe('GLOBAL');
    expect(res.areaId).toBeNull();
    expect(repo.scopes.every((s) => s.areaId === null)).toBe(true);
  });

  it('auditor → también GLOBAL', async () => {
    const repo = new FakeDashboardRepo();
    const res = await new VerDashboardUseCase(repo).execute({ actor: auditor });
    expect(res.alcance).toBe('GLOBAL');
  });

  it('operador → alcance AREA con su areaId', async () => {
    const repo = new FakeDashboardRepo();
    const res = await new VerDashboardUseCase(repo).execute({ actor: operador });
    expect(res.alcance).toBe('AREA');
    expect(res.areaId).toBe('areaA');
    expect(repo.scopes.every((s) => s.areaId === 'areaA')).toBe(true);
  });

  it('ensambla las 6 métricas y serializa movimientos planos', async () => {
    const res = await new VerDashboardUseCase(new FakeDashboardRepo()).execute({ actor: admin });
    expect(res.porEstado).toEqual([{ clave: 'EN_REVISION', cantidad: 3 }]);
    expect(res.porOrigen).toEqual([{ clave: 'INTERNO_INTERNO', cantidad: 2 }]);
    expect(res.cantidadPorArea).toEqual([{ clave: 'areaA', cantidad: 5 }]);
    expect(res.vencidosPorSla).toBe(1);
    expect(res.promedioResolucionHoras).toBe(40.5);
    expect(res.ultimosMovimientos[0]).toMatchObject({ id: 'm1', accion: AccionMovimiento.TOMAR });
    expect(res.ultimosMovimientos[0]).not.toHaveProperty('props');
  });

  it('fail-closed: operativo SIN área → dashboard vacío sin consultar', async () => {
    const repo = new FakeDashboardRepo();
    const sinArea: Actor = {
      tipo: TipoUsuario.INTERNO,
      id: 'i',
      rol: RolInterno.OPERADOR,
      areaId: '',
    };
    const res = await new VerDashboardUseCase(repo).execute({ actor: sinArea });
    expect(repo.llamado).toBe(false);
    expect(res).toMatchObject({
      vencidosPorSla: 0,
      promedioResolucionHoras: null,
      porEstado: [],
      ultimosMovimientos: [],
    });
  });
});
