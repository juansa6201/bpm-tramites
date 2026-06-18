import { EstadoTramite } from '../enums/estado-tramite.enum';

/**
 * Política de SLA (servicio de dominio puro).
 *
 * Espejo EXACTO de la regla del dashboard (contarVencidosSla):
 *  - vencimiento = fechaCreacion + slaHoras.
 *  - vencido = estado ACTIVO (no resuelto/cerrado) y ahora > vencimiento.
 *
 * Mantener ambas definiciones acá evita que la bandeja y el dashboard diverjan.
 */
const ESTADOS_TERMINALES: readonly EstadoTramite[] = [
  EstadoTramite.APROBADO,
  EstadoTramite.RECHAZADO,
  EstadoTramite.CANCELADO,
  EstadoTramite.CERRADO,
];

const MS_POR_HORA = 3_600_000;

export class SlaPolicy {
  /** Fecha límite del SLA (función pura de creación + horas). */
  static fechaVencimiento(fechaCreacion: Date, slaHoras: number): Date {
    return new Date(fechaCreacion.getTime() + slaHoras * MS_POR_HORA);
  }

  /** Un trámite resuelto/cerrado nunca está vencido; el resto, si pasó la fecha límite. */
  static estaVencido(estado: EstadoTramite, fechaVencimiento: Date, ahora: Date): boolean {
    if (ESTADOS_TERMINALES.includes(estado)) return false;
    return ahora.getTime() > fechaVencimiento.getTime();
  }
}
