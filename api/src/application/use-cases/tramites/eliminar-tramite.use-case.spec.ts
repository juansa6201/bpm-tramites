import { EliminarTramiteUseCase } from './eliminar-tramite.use-case';
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
  SinPermisoParaEliminarTramiteError,
} from '../../../domain/tramites/errors/tramite.errors';
import { RequiereRolAdminError } from '../../../domain/shared/errors/authz.errors';

function tramite(over: Partial<TramiteProps> = {}): Tramite {
  return new Tramite({
    id: 't1',
    numero: 'INT-2026-00001',
    titulo: 'x',
    descripcion: 'y',
    origen: OrigenTramite.INTERNO_INTERNO,
    estado: EstadoTramite.BORRADOR,
    prioridad: PrioridadTramite.MEDIA,
    tipoTramiteId: 'tt1',
    areaActualId: 'areaA',
    usuarioAsignadoId: null,
    usuarioExternoId: null,
    creadoPorTipo: TipoUsuario.INTERNO,
    creadoPorId: 'int1',
    version: 0,
    fechaCreacion: new Date('2026-01-01'),
    fechaActualizacion: new Date('2026-01-02'),
    fechaCierre: null,
    ...over,
  });
}

class FakeRepo implements Partial<TramiteRepository> {
  hardDeleted?: string;
  softDeleted?: string;
  constructor(private current: Tramite | null) {}
  findById(): Promise<Tramite | null> {
    return Promise.resolve(this.current);
  }
  delete(id: string): Promise<void> {
    this.hardDeleted = id;
    return Promise.resolve();
  }
  softDelete(id: string): Promise<void> {
    this.softDeleted = id;
    return Promise.resolve();
  }
}

function build(t: Tramite | null) {
  const repo = new FakeRepo(t);
  return { uc: new EliminarTramiteUseCase(repo as unknown as TramiteRepository), repo };
}

const admin: Actor = {
  tipo: TipoUsuario.INTERNO,
  id: 'admin1',
  rol: RolInterno.ADMIN,
  areaId: 'areaA',
};
const operador: Actor = {
  tipo: TipoUsuario.INTERNO,
  id: 'op1',
  rol: RolInterno.OPERADOR,
  areaId: 'areaA',
};
const creador: Actor = {
  tipo: TipoUsuario.INTERNO,
  id: 'int1',
  rol: RolInterno.OPERADOR,
  areaId: 'areaA',
};

describe('EliminarTramiteUseCase', () => {
  it('404 si no existe', async () => {
    const { uc } = build(null);
    await expect(uc.execute({ tramiteId: 'x', actor: admin })).rejects.toBeInstanceOf(
      TramiteNoEncontradoError,
    );
  });

  it('BORRADOR: el creador hace hard delete', async () => {
    const { uc, repo } = build(tramite());
    await uc.execute({ tramiteId: 't1', actor: creador });
    expect(repo.hardDeleted).toBe('t1');
    expect(repo.softDeleted).toBeUndefined();
  });

  it('BORRADOR: un ADMIN hace hard delete', async () => {
    const { uc, repo } = build(tramite());
    await uc.execute({ tramiteId: 't1', actor: admin });
    expect(repo.hardDeleted).toBe('t1');
  });

  it('BORRADOR: un operador que no lo creó NO puede (403)', async () => {
    const { uc } = build(tramite());
    await expect(uc.execute({ tramiteId: 't1', actor: operador })).rejects.toBeInstanceOf(
      SinPermisoParaEliminarTramiteError,
    );
  });

  it('no-BORRADOR: un ADMIN hace soft delete', async () => {
    const { uc, repo } = build(tramite({ estado: EstadoTramite.EN_REVISION }));
    await uc.execute({ tramiteId: 't1', actor: admin });
    expect(repo.softDeleted).toBe('t1');
    expect(repo.hardDeleted).toBeUndefined();
  });

  it('no-BORRADOR: un no-admin NO puede (403)', async () => {
    const { uc } = build(tramite({ estado: EstadoTramite.EN_REVISION }));
    await expect(uc.execute({ tramiteId: 't1', actor: operador })).rejects.toBeInstanceOf(
      RequiereRolAdminError,
    );
  });
});
