import type { AccionMovimiento } from '@/types/tramite';

export type ComentarioReq = 'requerido' | 'opcional';

export interface AccionMeta {
  label: string;
  /** Segmento del endpoint: POST /tramites/:id/<slug>. */
  slug: string;
  comentario: ComentarioReq;
  /** derivar pide área destino. */
  requiereArea?: boolean;
  /** Acciones irreversibles/terminales → confirmación enfática en el dialog. */
  critica?: boolean;
  color: 'primary' | 'success' | 'error' | 'warning' | 'inherit';
}

/**
 * Acciones que el portal interno sabe ejecutar. Las que NO están acá (asignar,
 * y las del externo: responder-observacion / responder-intervencion) no se
 * dibujan aunque el backend las devuelva en accionesPermitidas.
 */
export const ACCIONES: Partial<Record<AccionMovimiento, AccionMeta>> = {
  INGRESAR: { label: 'Ingresar', slug: 'ingresar', comentario: 'opcional', color: 'primary' },
  TOMAR: { label: 'Tomar', slug: 'tomar', comentario: 'opcional', color: 'primary' },
  DERIVAR: {
    label: 'Derivar',
    slug: 'derivar',
    comentario: 'opcional',
    requiereArea: true,
    color: 'inherit',
  },
  OBSERVAR: { label: 'Observar', slug: 'observar', comentario: 'requerido', color: 'warning' },
  SOLICITAR_INTERVENCION_EXTERNA: {
    label: 'Solicitar intervención externa',
    slug: 'solicitar-intervencion-externa',
    comentario: 'requerido',
    color: 'inherit',
  },
  APROBAR: {
    label: 'Aprobar',
    slug: 'aprobar',
    comentario: 'opcional',
    critica: true,
    color: 'success',
  },
  RECHAZAR: {
    label: 'Rechazar',
    slug: 'rechazar',
    comentario: 'requerido',
    critica: true,
    color: 'error',
  },
  CANCELAR: {
    label: 'Cancelar',
    slug: 'cancelar',
    comentario: 'requerido',
    critica: true,
    color: 'error',
  },
  CERRAR: {
    label: 'Cerrar',
    slug: 'cerrar',
    comentario: 'opcional',
    critica: true,
    color: 'inherit',
  },
};

/** Etiquetas legibles de TODAS las acciones (para la timeline, incluye externas y CREAR). */
export const ACCION_LABEL: Record<AccionMovimiento, string> = {
  CREAR: 'Creación',
  INGRESAR: 'Ingreso',
  TOMAR: 'Tomado',
  ASIGNAR: 'Asignación',
  DERIVAR: 'Derivación',
  OBSERVAR: 'Observación',
  RESPONDER_OBSERVACION: 'Respuesta a observación',
  SOLICITAR_INTERVENCION_EXTERNA: 'Solicitud de intervención externa',
  RESPONDER_INTERVENCION_EXTERNA: 'Respuesta de intervención externa',
  APROBAR: 'Aprobación',
  RECHAZAR: 'Rechazo',
  CANCELAR: 'Cancelación',
  CERRAR: 'Cierre',
};
