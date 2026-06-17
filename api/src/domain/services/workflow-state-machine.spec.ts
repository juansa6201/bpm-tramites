import { MotivoRechazo, TransitionInput, WorkflowStateMachine } from './workflow-state-machine';
import { EstadoTramite } from '../tramites/enums/estado-tramite.enum';
import { OrigenTramite } from '../tramites/enums/origen-tramite.enum';
import { AccionMovimiento } from '../tramites/enums/accion-movimiento.enum';
import { TipoUsuario } from '../usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../usuarios/enums/rol-interno.enum';

const sm = new WorkflowStateMachine();

const { INTERNO_INTERNO, INTERNO_EXTERNO, EXTERNO_INTERNO } = OrigenTramite;
const {
  BORRADOR,
  INGRESADO,
  EN_REVISION,
  OBSERVADO,
  ESPERANDO_EXTERNO,
  ESPERANDO_INTERNO,
  APROBADO,
  RECHAZADO,
  CANCELADO,
  CERRADO,
} = EstadoTramite;
const {
  INGRESAR,
  TOMAR,
  ASIGNAR,
  DERIVAR,
  OBSERVAR,
  RESPONDER_OBSERVACION,
  SOLICITAR_INTERVENCION_EXTERNA,
  RESPONDER_INTERVENCION_EXTERNA,
  APROBAR,
  RECHAZAR,
  CANCELAR,
  CERRAR,
} = AccionMovimiento;
const I = TipoUsuario.INTERNO;
const E = TipoUsuario.EXTERNO;
const { ADMIN, MESA_ENTRADA, OPERADOR, SUPERVISOR, AUDITOR } = RolInterno;

describe('WorkflowStateMachine', () => {
  // ----------------------------- VÁLIDAS -----------------------------
  const validas: Array<[string, TransitionInput, EstadoTramite]> = [
    // Workflow 1: EXTERNO → INTERNO
    [
      'EXT→INT: externo INGRESA',
      { origen: EXTERNO_INTERNO, estadoActual: BORRADOR, accion: INGRESAR, tipoUsuario: E },
      INGRESADO,
    ],
    [
      'EXT→INT: mesa TOMA',
      {
        origen: EXTERNO_INTERNO,
        estadoActual: INGRESADO,
        accion: TOMAR,
        tipoUsuario: I,
        rolUsuario: MESA_ENTRADA,
      },
      EN_REVISION,
    ],
    [
      'EXT→INT: operador OBSERVA',
      {
        origen: EXTERNO_INTERNO,
        estadoActual: EN_REVISION,
        accion: OBSERVAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      OBSERVADO,
    ],
    [
      'EXT→INT: externo RESPONDE observación',
      {
        origen: EXTERNO_INTERNO,
        estadoActual: OBSERVADO,
        accion: RESPONDER_OBSERVACION,
        tipoUsuario: E,
      },
      INGRESADO,
    ],
    [
      'EXT→INT: operador APRUEBA',
      {
        origen: EXTERNO_INTERNO,
        estadoActual: EN_REVISION,
        accion: APROBAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      APROBADO,
    ],
    [
      'EXT→INT: operador RECHAZA',
      {
        origen: EXTERNO_INTERNO,
        estadoActual: EN_REVISION,
        accion: RECHAZAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      RECHAZADO,
    ],
    [
      'EXT→INT: externo CANCELA su borrador',
      { origen: EXTERNO_INTERNO, estadoActual: BORRADOR, accion: CANCELAR, tipoUsuario: E },
      CANCELADO,
    ],
    [
      'EXT→INT: interno CANCELA ingresado',
      {
        origen: EXTERNO_INTERNO,
        estadoActual: INGRESADO,
        accion: CANCELAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      CANCELADO,
    ],
    [
      'EXT→INT: CIERRA aprobado',
      {
        origen: EXTERNO_INTERNO,
        estadoActual: APROBADO,
        accion: CERRAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      CERRADO,
    ],
    [
      'EXT→INT: CIERRA rechazado',
      {
        origen: EXTERNO_INTERNO,
        estadoActual: RECHAZADO,
        accion: CERRAR,
        tipoUsuario: I,
        rolUsuario: SUPERVISOR,
      },
      CERRADO,
    ],
    [
      'EXT→INT: CIERRA cancelado',
      {
        origen: EXTERNO_INTERNO,
        estadoActual: CANCELADO,
        accion: CERRAR,
        tipoUsuario: I,
        rolUsuario: ADMIN,
      },
      CERRADO,
    ],

    // Workflow 2: INTERNO → INTERNO
    [
      'INT→INT: mesa INGRESA',
      {
        origen: INTERNO_INTERNO,
        estadoActual: BORRADOR,
        accion: INGRESAR,
        tipoUsuario: I,
        rolUsuario: MESA_ENTRADA,
      },
      INGRESADO,
    ],
    [
      'INT→INT: operador TOMA',
      {
        origen: INTERNO_INTERNO,
        estadoActual: INGRESADO,
        accion: TOMAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      EN_REVISION,
    ],
    [
      'INT→INT: supervisor DERIVA (mismo estado)',
      {
        origen: INTERNO_INTERNO,
        estadoActual: EN_REVISION,
        accion: DERIVAR,
        tipoUsuario: I,
        rolUsuario: SUPERVISOR,
      },
      EN_REVISION,
    ],
    [
      'INT→INT: supervisor ASIGNA (mismo estado)',
      {
        origen: INTERNO_INTERNO,
        estadoActual: EN_REVISION,
        accion: ASIGNAR,
        tipoUsuario: I,
        rolUsuario: SUPERVISOR,
      },
      EN_REVISION,
    ],
    [
      'INT→INT: admin APRUEBA',
      {
        origen: INTERNO_INTERNO,
        estadoActual: EN_REVISION,
        accion: APROBAR,
        tipoUsuario: I,
        rolUsuario: ADMIN,
      },
      APROBADO,
    ],
    [
      'INT→INT: operador RECHAZA',
      {
        origen: INTERNO_INTERNO,
        estadoActual: EN_REVISION,
        accion: RECHAZAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      RECHAZADO,
    ],
    [
      'INT→INT: interno CANCELA borrador',
      {
        origen: INTERNO_INTERNO,
        estadoActual: BORRADOR,
        accion: CANCELAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      CANCELADO,
    ],

    // Workflow 3: INTERNO → EXTERNO
    [
      'INT→EXT: mesa INGRESA',
      {
        origen: INTERNO_EXTERNO,
        estadoActual: BORRADOR,
        accion: INGRESAR,
        tipoUsuario: I,
        rolUsuario: MESA_ENTRADA,
      },
      INGRESADO,
    ],
    [
      'INT→EXT: operador SOLICITA intervención externa',
      {
        origen: INTERNO_EXTERNO,
        estadoActual: INGRESADO,
        accion: SOLICITAR_INTERVENCION_EXTERNA,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      ESPERANDO_EXTERNO,
    ],
    [
      'INT→EXT: externo RESPONDE intervención',
      {
        origen: INTERNO_EXTERNO,
        estadoActual: ESPERANDO_EXTERNO,
        accion: RESPONDER_INTERVENCION_EXTERNA,
        tipoUsuario: E,
      },
      ESPERANDO_INTERNO,
    ],
    [
      'INT→EXT: operador TOMA de vuelta',
      {
        origen: INTERNO_EXTERNO,
        estadoActual: ESPERANDO_INTERNO,
        accion: TOMAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      EN_REVISION,
    ],
    [
      'INT→EXT: operador APRUEBA',
      {
        origen: INTERNO_EXTERNO,
        estadoActual: EN_REVISION,
        accion: APROBAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      APROBADO,
    ],
    [
      'INT→EXT: operador RECHAZA',
      {
        origen: INTERNO_EXTERNO,
        estadoActual: EN_REVISION,
        accion: RECHAZAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      RECHAZADO,
    ],
    [
      'INT→EXT: interno CANCELA esperando externo',
      {
        origen: INTERNO_EXTERNO,
        estadoActual: ESPERANDO_EXTERNO,
        accion: CANCELAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      CANCELADO,
    ],

    // CERRAR común a los otros dos orígenes (desde APROBADO/RECHAZADO/CANCELADO)
    [
      'INT→INT: CIERRA aprobado',
      {
        origen: INTERNO_INTERNO,
        estadoActual: APROBADO,
        accion: CERRAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      CERRADO,
    ],
    [
      'INT→INT: CIERRA rechazado',
      {
        origen: INTERNO_INTERNO,
        estadoActual: RECHAZADO,
        accion: CERRAR,
        tipoUsuario: I,
        rolUsuario: SUPERVISOR,
      },
      CERRADO,
    ],
    [
      'INT→INT: CIERRA cancelado',
      {
        origen: INTERNO_INTERNO,
        estadoActual: CANCELADO,
        accion: CERRAR,
        tipoUsuario: I,
        rolUsuario: ADMIN,
      },
      CERRADO,
    ],
    [
      'INT→EXT: CIERRA aprobado',
      {
        origen: INTERNO_EXTERNO,
        estadoActual: APROBADO,
        accion: CERRAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      CERRADO,
    ],
    [
      'INT→EXT: CIERRA rechazado',
      {
        origen: INTERNO_EXTERNO,
        estadoActual: RECHAZADO,
        accion: CERRAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      CERRADO,
    ],
    [
      'INT→EXT: CIERRA cancelado',
      {
        origen: INTERNO_EXTERNO,
        estadoActual: CANCELADO,
        accion: CERRAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      CERRADO,
    ],

    // CANCELAR por interno desde el resto de estados activos (cobertura completa)
    [
      'EXT→INT: interno CANCELA en revisión',
      {
        origen: EXTERNO_INTERNO,
        estadoActual: EN_REVISION,
        accion: CANCELAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      CANCELADO,
    ],
    [
      'EXT→INT: interno CANCELA observado',
      {
        origen: EXTERNO_INTERNO,
        estadoActual: OBSERVADO,
        accion: CANCELAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      CANCELADO,
    ],
    [
      'INT→INT: interno CANCELA ingresado',
      {
        origen: INTERNO_INTERNO,
        estadoActual: INGRESADO,
        accion: CANCELAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      CANCELADO,
    ],
    [
      'INT→INT: interno CANCELA en revisión',
      {
        origen: INTERNO_INTERNO,
        estadoActual: EN_REVISION,
        accion: CANCELAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      CANCELADO,
    ],
    [
      'INT→EXT: interno CANCELA borrador',
      {
        origen: INTERNO_EXTERNO,
        estadoActual: BORRADOR,
        accion: CANCELAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      CANCELADO,
    ],
    [
      'INT→EXT: interno CANCELA ingresado',
      {
        origen: INTERNO_EXTERNO,
        estadoActual: INGRESADO,
        accion: CANCELAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      CANCELADO,
    ],
    [
      'INT→EXT: interno CANCELA esperando interno',
      {
        origen: INTERNO_EXTERNO,
        estadoActual: ESPERANDO_INTERNO,
        accion: CANCELAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      CANCELADO,
    ],
    [
      'INT→EXT: interno CANCELA en revisión',
      {
        origen: INTERNO_EXTERNO,
        estadoActual: EN_REVISION,
        accion: CANCELAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      CANCELADO,
    ],
  ];

  it.each(validas)('TRANSICIÓN VÁLIDA → %s', (_label, input, esperado) => {
    const r = sm.evaluar(input);
    expect(r.permitida).toBe(true);
    expect(r.estadoNuevo).toBe(esperado);
    expect(r.motivo).toBeUndefined();
  });

  // ----------------------------- INVÁLIDAS -----------------------------
  const invalidas: Array<[string, TransitionInput, MotivoRechazo]> = [
    // Estado inválido (regla de negocio → 422)
    [
      'no se puede APROBAR en BORRADOR',
      {
        origen: EXTERNO_INTERNO,
        estadoActual: BORRADOR,
        accion: APROBAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      'ESTADO_INVALIDO',
    ],
    [
      'no se puede CERRAR desde EN_REVISION',
      {
        origen: EXTERNO_INTERNO,
        estadoActual: EN_REVISION,
        accion: CERRAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      'ESTADO_INVALIDO',
    ],
    [
      'no se puede INGRESAR un APROBADO',
      { origen: EXTERNO_INTERNO, estadoActual: APROBADO, accion: INGRESAR, tipoUsuario: E },
      'ESTADO_INVALIDO',
    ],
    [
      'acción de otro workflow (intervención externa en EXT→INT)',
      {
        origen: EXTERNO_INTERNO,
        estadoActual: INGRESADO,
        accion: SOLICITAR_INTERVENCION_EXTERNA,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      'ESTADO_INVALIDO',
    ],
    [
      'no hay transiciones desde CERRADO',
      {
        origen: INTERNO_INTERNO,
        estadoActual: CERRADO,
        accion: TOMAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      'ESTADO_INVALIDO',
    ],

    // Tipo de usuario inválido (→ 403)
    [
      'un externo no puede APROBAR',
      { origen: EXTERNO_INTERNO, estadoActual: EN_REVISION, accion: APROBAR, tipoUsuario: E },
      'TIPO_USUARIO_INVALIDO',
    ],
    [
      'un interno no puede RESPONDER como externo',
      {
        origen: EXTERNO_INTERNO,
        estadoActual: OBSERVADO,
        accion: RESPONDER_OBSERVACION,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      'TIPO_USUARIO_INVALIDO',
    ],

    // Rol inválido (→ 403)
    [
      'AUDITOR no puede TOMAR',
      {
        origen: EXTERNO_INTERNO,
        estadoActual: INGRESADO,
        accion: TOMAR,
        tipoUsuario: I,
        rolUsuario: AUDITOR,
      },
      'ROL_INVALIDO',
    ],
    [
      'OPERADOR no puede DERIVAR (solo supervisor/admin)',
      {
        origen: INTERNO_INTERNO,
        estadoActual: EN_REVISION,
        accion: DERIVAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      'ROL_INVALIDO',
    ],
    [
      'interno sin rol no puede APROBAR',
      { origen: EXTERNO_INTERNO, estadoActual: EN_REVISION, accion: APROBAR, tipoUsuario: I },
      'ROL_INVALIDO',
    ],
    [
      'OPERADOR no puede ASIGNAR (solo supervisor/admin)',
      {
        origen: INTERNO_INTERNO,
        estadoActual: EN_REVISION,
        accion: ASIGNAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      'ROL_INVALIDO',
    ],
    [
      'MESA_ENTRADA no puede TOMAR en INT→INT',
      {
        origen: INTERNO_INTERNO,
        estadoActual: INGRESADO,
        accion: TOMAR,
        tipoUsuario: I,
        rolUsuario: MESA_ENTRADA,
      },
      'ROL_INVALIDO',
    ],
    [
      'MESA_ENTRADA no puede TOMAR en INT→EXT',
      {
        origen: INTERNO_EXTERNO,
        estadoActual: ESPERANDO_INTERNO,
        accion: TOMAR,
        tipoUsuario: I,
        rolUsuario: MESA_ENTRADA,
      },
      'ROL_INVALIDO',
    ],
    [
      'AUDITOR no puede INGRESAR',
      {
        origen: INTERNO_INTERNO,
        estadoActual: BORRADOR,
        accion: INGRESAR,
        tipoUsuario: I,
        rolUsuario: AUDITOR,
      },
      'ROL_INVALIDO',
    ],
    // Asimetría intencional: el BORRADOR de EXT→INT es del autor externo. La acción
    // CANCELAR existe en esa coordenada pero SOLO para el externo, así que un interno
    // recibe TIPO_USUARIO_INVALIDO (no ESTADO_INVALIDO).
    [
      'interno NO puede CANCELAR el BORRADOR externo',
      {
        origen: EXTERNO_INTERNO,
        estadoActual: BORRADOR,
        accion: CANCELAR,
        tipoUsuario: I,
        rolUsuario: OPERADOR,
      },
      'TIPO_USUARIO_INVALIDO',
    ],
  ];

  it.each(invalidas)('TRANSICIÓN INVÁLIDA → %s', (_label, input, motivo) => {
    const r = sm.evaluar(input);
    expect(r.permitida).toBe(false);
    expect(r.estadoNuevo).toBeUndefined();
    expect(r.motivo).toBe(motivo);
  });
});
