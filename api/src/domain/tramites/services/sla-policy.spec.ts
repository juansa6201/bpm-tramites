import { SlaPolicy } from './sla-policy';
import { EstadoTramite } from '../enums/estado-tramite.enum';

describe('SlaPolicy', () => {
  const creacion = new Date('2026-01-01T00:00:00.000Z');

  describe('fechaVencimiento', () => {
    it('suma slaHoras a la fecha de creación', () => {
      expect(SlaPolicy.fechaVencimiento(creacion, 48)).toEqual(
        new Date('2026-01-03T00:00:00.000Z'),
      );
    });

    it('slaHoras 0 vence en el instante de creación', () => {
      expect(SlaPolicy.fechaVencimiento(creacion, 0)).toEqual(creacion);
    });
  });

  describe('estaVencido', () => {
    const vencimiento = SlaPolicy.fechaVencimiento(creacion, 48); // 2026-01-03T00:00Z

    it('estado activo y ahora DESPUÉS del vencimiento → vencido', () => {
      const ahora = new Date('2026-01-03T00:00:00.001Z');
      expect(SlaPolicy.estaVencido(EstadoTramite.EN_REVISION, vencimiento, ahora)).toBe(true);
    });

    it('estado activo y ahora ANTES del vencimiento → no vencido', () => {
      const ahora = new Date('2026-01-02T23:59:59.999Z');
      expect(SlaPolicy.estaVencido(EstadoTramite.EN_REVISION, vencimiento, ahora)).toBe(false);
    });

    it('en el instante EXACTO del vencimiento → no vencido (estricto >)', () => {
      expect(SlaPolicy.estaVencido(EstadoTramite.EN_REVISION, vencimiento, vencimiento)).toBe(
        false,
      );
    });

    it.each([
      EstadoTramite.APROBADO,
      EstadoTramite.RECHAZADO,
      EstadoTramite.CANCELADO,
      EstadoTramite.CERRADO,
    ])('estado terminal %s nunca está vencido, aunque haya pasado la fecha', (estado) => {
      const ahora = new Date('2027-01-01T00:00:00.000Z');
      expect(SlaPolicy.estaVencido(estado, vencimiento, ahora)).toBe(false);
    });

    it.each([
      EstadoTramite.BORRADOR,
      EstadoTramite.INGRESADO,
      EstadoTramite.EN_REVISION,
      EstadoTramite.OBSERVADO,
      EstadoTramite.ESPERANDO_EXTERNO,
      EstadoTramite.ESPERANDO_INTERNO,
    ])('estado activo %s sí puede estar vencido', (estado) => {
      const ahora = new Date('2026-01-04T00:00:00.000Z');
      expect(SlaPolicy.estaVencido(estado, vencimiento, ahora)).toBe(true);
    });
  });
});
