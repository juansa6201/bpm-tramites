/**
 * Reglas de negocio clave del enunciado, afirmadas como validaciones de dominio.
 *
 * - Reglas de transición (1, 2, 4, 5): las garantiza WorkflowStateMachine.
 * - Visibilidad (3): la garantiza TramiteVisibilidadPolicy.
 *
 * Este spec documenta cada regla por su nombre (complementa la cobertura
 * exhaustiva de workflow-state-machine.spec.ts).
 */
import { WorkflowStateMachine } from './workflow-state-machine';
import {
  TramiteVisibilidadPolicy,
  ActorVisibilidad,
} from '../tramites/services/tramite-visibilidad.service';
import { Tramite } from '../tramites/entities/tramite.entity';
import { EstadoTramite } from '../tramites/enums/estado-tramite.enum';
import { OrigenTramite } from '../tramites/enums/origen-tramite.enum';
import { AccionMovimiento } from '../tramites/enums/accion-movimiento.enum';
import { PrioridadTramite } from '../tramites/enums/prioridad-tramite.enum';
import { TipoUsuario } from '../usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../usuarios/enums/rol-interno.enum';

const sm = new WorkflowStateMachine();
const { INTERNO_INTERNO, EXTERNO_INTERNO } = OrigenTramite;

describe('Reglas de negocio (validaciones de dominio)', () => {
  describe('1) No se puede aprobar un trámite en BORRADOR', () => {
    it('APROBAR desde BORRADOR → ESTADO_INVALIDO', () => {
      const r = sm.evaluar({
        origen: EXTERNO_INTERNO,
        estadoActual: EstadoTramite.BORRADOR,
        accion: AccionMovimiento.APROBAR,
        tipoUsuario: TipoUsuario.INTERNO,
        rolUsuario: RolInterno.OPERADOR,
      });
      expect(r.permitida).toBe(false);
      expect(r.motivo).toBe('ESTADO_INVALIDO');
    });
  });

  describe('2) No se puede cerrar un trámite no aprobado/rechazado/cancelado', () => {
    it.each([EstadoTramite.EN_REVISION, EstadoTramite.INGRESADO, EstadoTramite.OBSERVADO])(
      'CERRAR desde %s → ESTADO_INVALIDO',
      (estado) => {
        const r = sm.evaluar({
          origen: EXTERNO_INTERNO,
          estadoActual: estado,
          accion: AccionMovimiento.CERRAR,
          tipoUsuario: TipoUsuario.INTERNO,
          rolUsuario: RolInterno.OPERADOR,
        });
        expect(r.permitida).toBe(false);
        expect(r.motivo).toBe('ESTADO_INVALIDO');
      },
    );

    it.each([EstadoTramite.APROBADO, EstadoTramite.RECHAZADO, EstadoTramite.CANCELADO])(
      'CERRAR desde %s → permitido',
      (estado) => {
        const r = sm.evaluar({
          origen: EXTERNO_INTERNO,
          estadoActual: estado,
          accion: AccionMovimiento.CERRAR,
          tipoUsuario: TipoUsuario.INTERNO,
          rolUsuario: RolInterno.OPERADOR,
        });
        expect(r.permitida).toBe(true);
        expect(r.estadoNuevo).toBe(EstadoTramite.CERRADO);
      },
    );
  });

  describe('4) Un externo no puede ejecutar acciones internas', () => {
    // Cada acción se prueba en un (origen, estado) donde SÍ existe para internos,
    // de modo que el rechazo sea por TIPO de usuario (no por estado inexistente).
    it.each([
      [EXTERNO_INTERNO, EstadoTramite.INGRESADO, AccionMovimiento.TOMAR],
      [EXTERNO_INTERNO, EstadoTramite.EN_REVISION, AccionMovimiento.APROBAR],
      [INTERNO_INTERNO, EstadoTramite.EN_REVISION, AccionMovimiento.DERIVAR],
    ])('externo intenta %s en %s → TIPO_USUARIO_INVALIDO', (origen, estado, accion) => {
      const r = sm.evaluar({
        origen,
        estadoActual: estado,
        accion,
        tipoUsuario: TipoUsuario.EXTERNO,
      });
      expect(r.permitida).toBe(false);
      expect(r.motivo).toBe('TIPO_USUARIO_INVALIDO');
    });
  });

  describe('5) Solo supervisor/admin pueden reasignar (DERIVAR/ASIGNAR)', () => {
    it.each([
      [AccionMovimiento.DERIVAR, RolInterno.OPERADOR],
      [AccionMovimiento.DERIVAR, RolInterno.MESA_ENTRADA],
      [AccionMovimiento.ASIGNAR, RolInterno.OPERADOR],
      [AccionMovimiento.ASIGNAR, RolInterno.AUDITOR],
    ])('%s con rol %s → ROL_INVALIDO', (accion, rol) => {
      const r = sm.evaluar({
        origen: INTERNO_INTERNO,
        estadoActual: EstadoTramite.EN_REVISION,
        accion,
        tipoUsuario: TipoUsuario.INTERNO,
        rolUsuario: rol,
      });
      expect(r.permitida).toBe(false);
      expect(r.motivo).toBe('ROL_INVALIDO');
    });

    it.each([RolInterno.SUPERVISOR, RolInterno.ADMIN])('%s SÍ puede DERIVAR', (rol) => {
      const r = sm.evaluar({
        origen: INTERNO_INTERNO,
        estadoActual: EstadoTramite.EN_REVISION,
        accion: AccionMovimiento.DERIVAR,
        tipoUsuario: TipoUsuario.INTERNO,
        rolUsuario: rol,
      });
      expect(r.permitida).toBe(true);
    });
  });

  describe('3) Un externo no ve trámites ajenos', () => {
    const tramiteDe = (externoId: string): Tramite =>
      new Tramite({
        id: 't1',
        numero: 'EXT-2026-00001',
        titulo: 'x',
        descripcion: 'x',
        origen: EXTERNO_INTERNO,
        estado: EstadoTramite.EN_REVISION,
        prioridad: PrioridadTramite.MEDIA,
        tipoTramiteId: 'tt1',
        areaActualId: 'areaA',
        usuarioAsignadoId: null,
        usuarioExternoId: externoId,
        creadoPorTipo: TipoUsuario.EXTERNO,
        creadoPorId: externoId,
        version: 0,
        fechaCreacion: new Date('2026-01-01'),
        fechaActualizacion: new Date('2026-01-01'),
        fechaCierre: null,
      });

    const externo = (id: string): ActorVisibilidad => ({ tipo: TipoUsuario.EXTERNO, id });

    it('el externo dueño SÍ ve su trámite', () => {
      expect(TramiteVisibilidadPolicy.puedeVer(tramiteDe('ext1'), externo('ext1'))).toBe(true);
    });

    it('un externo NO ve el trámite de otro externo', () => {
      expect(TramiteVisibilidadPolicy.puedeVer(tramiteDe('ext1'), externo('ext2'))).toBe(false);
    });
  });
});
