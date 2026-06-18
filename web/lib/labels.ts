import type { EstadoTramite, OrigenTramite, PrioridadTramite } from '@/types/tramite';

export const ESTADO_LABEL: Record<EstadoTramite, string> = {
  BORRADOR: 'Borrador',
  INGRESADO: 'Ingresado',
  EN_REVISION: 'En revisión',
  OBSERVADO: 'Observado',
  ESPERANDO_EXTERNO: 'Esperando externo',
  ESPERANDO_INTERNO: 'Esperando interno',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  CANCELADO: 'Cancelado',
  CERRADO: 'Cerrado',
};

export const ORIGEN_LABEL: Record<OrigenTramite, string> = {
  INTERNO_INTERNO: 'Interno → Interno',
  INTERNO_EXTERNO: 'Interno → Externo',
  EXTERNO_INTERNO: 'Externo → Interno',
};

export const PRIORIDAD_LABEL: Record<PrioridadTramite, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export function estadoLabel(clave: string): string {
  return ESTADO_LABEL[clave as EstadoTramite] ?? clave;
}

export function origenLabel(clave: string): string {
  return ORIGEN_LABEL[clave as OrigenTramite] ?? clave;
}
