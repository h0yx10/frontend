import { subtaskDateBounds, validateSubtaskDate } from './subtask-date';

describe('Plazo de subtareas', () => {
  const today = '2026-10-31';

  it('sin evento definido sólo exige que no sea un día pasado', () => {
    const bounds = subtaskDateBounds(today);
    expect(bounds).toEqual({ min: today, max: '', start: '' });
    expect(validateSubtaskDate('2026-10-30', bounds)).toBe('El plazo no puede ser un día pasado.');
    expect(validateSubtaskDate(today, bounds)).toBe('');
    expect(validateSubtaskDate('2030-01-01', bounds)).toBe('');
  });

  it('no puede ser antes de la fecha de inicio ni después de la fecha límite', () => {
    const bounds = subtaskDateBounds(today, '2026-11-10T18:00', '2026-11-20');
    expect(bounds).toEqual({ min: '2026-11-10', max: '2026-11-20', start: '2026-11-10' });
    expect(validateSubtaskDate('2026-11-05', bounds)).toContain('anterior a la fecha de inicio');
    expect(validateSubtaskDate('2026-11-21', bounds)).toContain('posterior a la fecha límite');
    expect(validateSubtaskDate('2026-11-10', bounds)).toBe('');
    expect(validateSubtaskDate('2026-11-20', bounds)).toBe('');
  });

  it('si el evento empezó en el pasado, el mínimo sigue siendo hoy', () => {
    const bounds = subtaskDateBounds(today, '2026-10-01T10:00');
    expect(bounds.min).toBe(today);
    expect(validateSubtaskDate('2026-10-15', bounds)).toBe('El plazo no puede ser un día pasado.');
  });
});
