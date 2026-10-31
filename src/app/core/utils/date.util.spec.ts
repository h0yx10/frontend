import { daysBetweenIso } from './date.util';

describe('daysBetweenIso', () => {
  it('cuenta días de calendario, sin importar la hora', () => {
    expect(daysBetweenIso('2026-10-31', '2026-11-01T08:00')).toBe(1);
    expect(daysBetweenIso('2026-10-31', '2026-10-31T23:59')).toBe(0);
    expect(daysBetweenIso('2026-10-31', '2026-11-12')).toBe(12);
  });

  it('es negativo para fechas pasadas', () => {
    expect(daysBetweenIso('2026-10-31', '2026-10-21T18:00')).toBe(-10);
  });

  it('no se desfasa al cruzar cambios de mes ni de año', () => {
    expect(daysBetweenIso('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetweenIso('2026-03-01', '2026-02-28')).toBe(-1);
  });
});
