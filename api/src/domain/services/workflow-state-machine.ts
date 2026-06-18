import { EstadoTramite } from '../tramites/enums/estado-tramite.enum';
import { OrigenTramite } from '../tramites/enums/origen-tramite.enum';
import { AccionMovimiento } from '../tramites/enums/accion-movimiento.enum';
import { TipoUsuario } from '../usuarios/enums/tipo-usuario.enum';
import { RolInterno } from '../usuarios/enums/rol-interno.enum';

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export interface TransitionInput {
  origen: OrigenTramite;
  estadoActual: EstadoTramite;
  accion: AccionMovimiento;
  tipoUsuario: TipoUsuario;
  /** Solo aplica cuando tipoUsuario === INTERNO. */
  rolUsuario?: RolInterno;
}

/** Input para consultar las acciones disponibles (TransitionInput sin la acción). */
export type AccionesPermitidasInput = Omit<TransitionInput, 'accion'>;

export type MotivoRechazo = 'ESTADO_INVALIDO' | 'TIPO_USUARIO_INVALIDO' | 'ROL_INVALIDO';

export interface TransitionResult {
  permitida: boolean;
  /** Presente solo si permitida === true. */
  estadoNuevo?: EstadoTramite;
  /** Presente solo si permitida === false. */
  motivo?: MotivoRechazo;
}

// ---------------------------------------------------------------------------
// Tabla de transiciones (declarativa)
// ---------------------------------------------------------------------------

interface TransitionRule {
  origen: OrigenTramite;
  desde: EstadoTramite;
  accion: AccionMovimiento;
  hacia: EstadoTramite;
  tipoUsuario: TipoUsuario;
  /** undefined = no se evalúa rol (caso de usuarios externos). */
  rolesPermitidos?: RolInterno[];
}

// Atajos para que la tabla se lea como el enunciado.
const { ADMIN, MESA_ENTRADA, OPERADOR, SUPERVISOR } = RolInterno;
const OPERATIVOS: RolInterno[] = [OPERADOR, SUPERVISOR, ADMIN];
const INGRESO: RolInterno[] = [MESA_ENTRADA, OPERADOR, SUPERVISOR, ADMIN];
const REASIGNADORES: RolInterno[] = [SUPERVISOR, ADMIN];

const I = TipoUsuario.INTERNO;
const E = TipoUsuario.EXTERNO;

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

const { INTERNO_INTERNO, INTERNO_EXTERNO, EXTERNO_INTERNO } = OrigenTramite;

// Workflow 1: EXTERNO → INTERNO
const REGLAS_EXTERNO_INTERNO: TransitionRule[] = [
  { origen: EXTERNO_INTERNO, desde: BORRADOR, accion: INGRESAR, hacia: INGRESADO, tipoUsuario: E },
  { origen: EXTERNO_INTERNO, desde: INGRESADO, accion: TOMAR, hacia: EN_REVISION, tipoUsuario: I, rolesPermitidos: INGRESO }, // prettier-ignore
  { origen: EXTERNO_INTERNO, desde: EN_REVISION, accion: OBSERVAR, hacia: OBSERVADO, tipoUsuario: I, rolesPermitidos: OPERATIVOS }, // prettier-ignore
  { origen: EXTERNO_INTERNO, desde: OBSERVADO, accion: RESPONDER_OBSERVACION, hacia: INGRESADO, tipoUsuario: E }, // prettier-ignore
  { origen: EXTERNO_INTERNO, desde: EN_REVISION, accion: APROBAR, hacia: APROBADO, tipoUsuario: I, rolesPermitidos: OPERATIVOS }, // prettier-ignore
  { origen: EXTERNO_INTERNO, desde: EN_REVISION, accion: RECHAZAR, hacia: RECHAZADO, tipoUsuario: I, rolesPermitidos: OPERATIVOS }, // prettier-ignore
];

// Workflow 2: INTERNO → INTERNO
const REGLAS_INTERNO_INTERNO: TransitionRule[] = [
  { origen: INTERNO_INTERNO, desde: BORRADOR, accion: INGRESAR, hacia: INGRESADO, tipoUsuario: I, rolesPermitidos: INGRESO }, // prettier-ignore
  { origen: INTERNO_INTERNO, desde: INGRESADO, accion: TOMAR, hacia: EN_REVISION, tipoUsuario: I, rolesPermitidos: OPERATIVOS }, // prettier-ignore
  { origen: INTERNO_INTERNO, desde: EN_REVISION, accion: DERIVAR, hacia: EN_REVISION, tipoUsuario: I, rolesPermitidos: REASIGNADORES }, // prettier-ignore
  { origen: INTERNO_INTERNO, desde: EN_REVISION, accion: ASIGNAR, hacia: EN_REVISION, tipoUsuario: I, rolesPermitidos: REASIGNADORES }, // prettier-ignore
  { origen: INTERNO_INTERNO, desde: EN_REVISION, accion: APROBAR, hacia: APROBADO, tipoUsuario: I, rolesPermitidos: OPERATIVOS }, // prettier-ignore
  { origen: INTERNO_INTERNO, desde: EN_REVISION, accion: RECHAZAR, hacia: RECHAZADO, tipoUsuario: I, rolesPermitidos: OPERATIVOS }, // prettier-ignore
];

// Workflow 3: INTERNO → EXTERNO
const REGLAS_INTERNO_EXTERNO: TransitionRule[] = [
  { origen: INTERNO_EXTERNO, desde: BORRADOR, accion: INGRESAR, hacia: INGRESADO, tipoUsuario: I, rolesPermitidos: INGRESO }, // prettier-ignore
  { origen: INTERNO_EXTERNO, desde: INGRESADO, accion: SOLICITAR_INTERVENCION_EXTERNA, hacia: ESPERANDO_EXTERNO, tipoUsuario: I, rolesPermitidos: OPERATIVOS }, // prettier-ignore
  { origen: INTERNO_EXTERNO, desde: ESPERANDO_EXTERNO, accion: RESPONDER_INTERVENCION_EXTERNA, hacia: ESPERANDO_INTERNO, tipoUsuario: E }, // prettier-ignore
  { origen: INTERNO_EXTERNO, desde: ESPERANDO_INTERNO, accion: TOMAR, hacia: EN_REVISION, tipoUsuario: I, rolesPermitidos: OPERATIVOS }, // prettier-ignore
  { origen: INTERNO_EXTERNO, desde: EN_REVISION, accion: APROBAR, hacia: APROBADO, tipoUsuario: I, rolesPermitidos: OPERATIVOS }, // prettier-ignore
  { origen: INTERNO_EXTERNO, desde: EN_REVISION, accion: RECHAZAR, hacia: RECHAZADO, tipoUsuario: I, rolesPermitidos: OPERATIVOS }, // prettier-ignore
];

// Estados desde los que un INTERNO puede CANCELAR, por origen.
// Nota EXTERNO_INTERNO: se excluye BORRADOR a propósito. En ese circuito el
// BORRADOR es propiedad del autor externo (solo el externo puede INGRESAR-lo o
// CANCELAR-lo); un interno todavía no debería poder cancelar un borrador que
// aún no ingresó. En los circuitos INTERNO_* el BORRADOR sí es del interno.
const CANCELABLES_INTERNO: Record<OrigenTramite, EstadoTramite[]> = {
  [EXTERNO_INTERNO]: [INGRESADO, EN_REVISION, OBSERVADO],
  [INTERNO_INTERNO]: [BORRADOR, INGRESADO, EN_REVISION],
  [INTERNO_EXTERNO]: [BORRADOR, INGRESADO, ESPERANDO_EXTERNO, ESPERANDO_INTERNO, EN_REVISION],
};

function reglasComunes(origen: OrigenTramite): TransitionRule[] {
  // CERRAR: solo desde resueltos (regla: no cerrar si no está aprobado/rechazado/cancelado).
  const cerrar: TransitionRule[] = [APROBADO, RECHAZADO, CANCELADO].map((desde) => ({
    origen,
    desde,
    accion: CERRAR,
    hacia: CERRADO,
    tipoUsuario: I,
    rolesPermitidos: OPERATIVOS,
  }));
  // CANCELAR por interno desde los estados activos del workflow.
  const cancelarInterno: TransitionRule[] = CANCELABLES_INTERNO[origen].map((desde) => ({
    origen,
    desde,
    accion: CANCELAR,
    hacia: CANCELADO,
    tipoUsuario: I,
    rolesPermitidos: OPERATIVOS,
  }));
  return [...cerrar, ...cancelarInterno];
}

const REGLAS: TransitionRule[] = [
  ...REGLAS_EXTERNO_INTERNO,
  ...REGLAS_INTERNO_INTERNO,
  ...REGLAS_INTERNO_EXTERNO,
  ...reglasComunes(EXTERNO_INTERNO),
  ...reglasComunes(INTERNO_INTERNO),
  ...reglasComunes(INTERNO_EXTERNO),
  // El externo puede cancelar su propio BORRADOR (solo circuito Externo→Interno).
  { origen: EXTERNO_INTERNO, desde: BORRADOR, accion: CANCELAR, hacia: CANCELADO, tipoUsuario: E },
];

// ---------------------------------------------------------------------------
// Servicio de dominio (puro: sin Nest, sin Prisma, sin estado mutable)
// ---------------------------------------------------------------------------

/**
 * Máquina de transiciones del workflow de trámites.
 *
 * Dado (origen, estadoActual, accion, tipoUsuario, rolUsuario) decide si la
 * transición es válida y cuál es el estado resultante.
 *
 * Alcance: SOLO valida estado + acción + origen + tipo/rol. NO valida datos
 * externos (área destino, vínculo con externo, tipo de trámite, concurrencia,
 * persistencia ni el MovimientoTramite): eso vive en los casos de uso.
 */
export class WorkflowStateMachine {
  evaluar(input: TransitionInput): TransitionResult {
    const candidatas = REGLAS.filter(
      (r) =>
        r.origen === input.origen && r.desde === input.estadoActual && r.accion === input.accion,
    );

    // No existe ninguna transición para (origen, estado, acción).
    if (candidatas.length === 0) {
      return { permitida: false, motivo: 'ESTADO_INVALIDO' };
    }

    // Existe la transición, pero no para este tipo de usuario.
    const porTipo = candidatas.filter((r) => r.tipoUsuario === input.tipoUsuario);
    if (porTipo.length === 0) {
      return { permitida: false, motivo: 'TIPO_USUARIO_INVALIDO' };
    }

    for (const regla of porTipo) {
      if (regla.tipoUsuario === TipoUsuario.EXTERNO) {
        // Los externos no tienen rol: la transición procede.
        return { permitida: true, estadoNuevo: regla.hacia };
      }
      // Internos: el rol debe estar dentro de los permitidos.
      if (
        regla.rolesPermitidos &&
        input.rolUsuario !== undefined &&
        regla.rolesPermitidos.includes(input.rolUsuario)
      ) {
        return { permitida: true, estadoNuevo: regla.hacia };
      }
    }

    // El tipo coincide pero el rol no está autorizado (o falta el rol).
    return { permitida: false, motivo: 'ROL_INVALIDO' };
  }

  /**
   * Acciones que el actor PUEDE ejecutar desde el estado actual (para mostrar
   * solo esos botones en la UI). Misma lógica que `evaluar` pero acumulando
   * todas las acciones válidas. El server igual revalida al ejecutar: esto es
   * una guía de UI, no la autorización real.
   */
  accionesPermitidas(input: AccionesPermitidasInput): AccionMovimiento[] {
    const acciones = new Set<AccionMovimiento>();
    for (const regla of REGLAS) {
      if (regla.origen !== input.origen || regla.desde !== input.estadoActual) continue;
      if (regla.tipoUsuario !== input.tipoUsuario) continue;
      if (regla.tipoUsuario === TipoUsuario.EXTERNO) {
        acciones.add(regla.accion);
        continue;
      }
      if (
        regla.rolesPermitidos &&
        input.rolUsuario !== undefined &&
        regla.rolesPermitidos.includes(input.rolUsuario)
      ) {
        acciones.add(regla.accion);
      }
    }
    return [...acciones];
  }
}
