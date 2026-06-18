/**
 * Puerto de reloj. Aísla el "ahora" del sistema para que los casos de uso que
 * dependen del tiempo (ej: SLA vencido) sean deterministas en los tests.
 * Implementado en infrastructure (SystemClock).
 */
export interface Clock {
  now(): Date;
}
