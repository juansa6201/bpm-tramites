import type { AccionMeta } from './acciones';
import type { AccionMovimiento } from '@/types/tramite';

/**
 * Acciones que el portal EXTERNO sabe ejecutar (las que el mapa interno omite a
 * propósito). Solo se dibujan si además vienen en `accionesPermitidas`, que el
 * backend calcula para el actor externo según estado y participación.
 */
export const ACCIONES_EXTERNO: Partial<Record<AccionMovimiento, AccionMeta>> = {
  INGRESAR: {
    label: 'Ingresar trámite',
    slug: 'ingresar',
    comentario: 'opcional',
    color: 'primary',
  },
  RESPONDER_OBSERVACION: {
    label: 'Responder observación',
    slug: 'responder-observacion',
    comentario: 'requerido',
    color: 'primary',
  },
  RESPONDER_INTERVENCION_EXTERNA: {
    label: 'Responder solicitud',
    slug: 'responder-intervencion-externa',
    comentario: 'requerido',
    color: 'primary',
  },
  CANCELAR: {
    label: 'Cancelar',
    slug: 'cancelar',
    comentario: 'requerido',
    critica: true,
    color: 'error',
  },
};
