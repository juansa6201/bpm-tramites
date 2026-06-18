import { Clock } from '../../application/ports/clock.port';

/** Reloj real del sistema. */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
