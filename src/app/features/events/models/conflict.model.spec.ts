import { planReduction } from './conflict.model';

describe('planReduction: horas sugeridas para resolver una sobrecarga', () => {
  it('sugiere lo máximo que cabe cuando ya es múltiplo de media hora', () => {
    expect(planReduction(5, 3)).toEqual({max:2, suggested:2, possible:true});
  });

  it('redondea hacia abajo a pasos de 0,5 h para que la sugerencia siempre quepa', () => {
    expect(planReduction(3, 1.25)).toEqual({max:1.75, suggested:1.5, possible:true});
  });

  it('si cabe menos de media hora, sugiere ese valor exacto', () => {
    expect(planReduction(1, 0.75)).toEqual({max:0.25, suggested:0.25, possible:true});
  });

  it('si el exceso iguala o supera la gestión, reducir no alcanza', () => {
    expect(planReduction(2, 2).possible).toBeFalse();
    expect(planReduction(2, 3).possible).toBeFalse();
  });
});
