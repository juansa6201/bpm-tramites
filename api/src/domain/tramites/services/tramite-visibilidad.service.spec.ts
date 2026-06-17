import { ActorVisibilidad, TramiteVisibilidadPolicy } from './tramite-visibilidad.service';
import { Tramite, TramiteProps } from '../entities/tramite.entity';
import { EstadoTramite } from '../enums/estado-tramite.enum';
import { OrigenTramite } from '../enums/origen-tramite.enum';
import { PrioridadTramite } from '../enums/prioridad-tramite.enum';
import { TipoUsuario } from '../../usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../../usuarios/enums/rol-interno.enum';

function tramite(over: Partial<TramiteProps> = {}): Tramite {
  return new Tramite({
    id: 't1',
    numero: 'EXT-2026-00001',
    titulo: 'x',
    descripcion: 'x',
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
    fechaActualizacion: new Date('2026-01-01'),
    fechaCierre: null,
    ...over,
  });
}

const externo = (id: string): ActorVisibilidad => ({ tipo: TipoUsuario.EXTERNO, id });
const interno = (rol: RolInterno, areaId?: string): ActorVisibilidad => ({
  tipo: TipoUsuario.INTERNO,
  id: 'int1',
  rol,
  areaId,
});

describe('TramiteVisibilidadPolicy.puedeVer', () => {
  it('el externo participante SÍ ve su trámite', () => {
    expect(TramiteVisibilidadPolicy.puedeVer(tramite(), externo('ext1'))).toBe(true);
  });

  it('un externo NO ve un trámite ajeno', () => {
    expect(TramiteVisibilidadPolicy.puedeVer(tramite(), externo('ext2'))).toBe(false);
  });

  it('ADMIN ve cualquier trámite', () => {
    expect(
      TramiteVisibilidadPolicy.puedeVer(
        tramite({ areaActualId: 'otra' }),
        interno(RolInterno.ADMIN, 'areaA'),
      ),
    ).toBe(true);
  });

  it('AUDITOR ve cualquier trámite', () => {
    expect(
      TramiteVisibilidadPolicy.puedeVer(
        tramite({ areaActualId: 'otra' }),
        interno(RolInterno.AUDITOR, 'areaA'),
      ),
    ).toBe(true);
  });

  it('un OPERADOR ve trámites de SU área', () => {
    expect(
      TramiteVisibilidadPolicy.puedeVer(
        tramite({ areaActualId: 'areaA' }),
        interno(RolInterno.OPERADOR, 'areaA'),
      ),
    ).toBe(true);
  });

  it('un OPERADOR NO ve trámites de otra área', () => {
    expect(
      TramiteVisibilidadPolicy.puedeVer(
        tramite({ areaActualId: 'areaB' }),
        interno(RolInterno.OPERADOR, 'areaA'),
      ),
    ).toBe(false);
  });

  it('un interno sin área no ve trámites de área', () => {
    expect(
      TramiteVisibilidadPolicy.puedeVer(tramite(), interno(RolInterno.OPERADOR, undefined)),
    ).toBe(false);
  });
});
