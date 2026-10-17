export interface OverloadCheckPayload {
  targetDate: string;
  estimatedHours: number;
}

export interface OverloadCheckResult {
  exceeds: boolean;
  plannedHours: number;
  limitHours: number;
  exceedsBy: number;
}

/** Cómo resolver una sobrecarga reduciendo las horas de la gestión que la causa. */
export interface ReductionPlan {
  /** Horas máximas con las que la gestión cabe en el día (sus horas menos el exceso). */
  max: number;
  /** Valor que se deja escrito en el campo: el máximo redondeado hacia abajo a pasos de 0,5 h. */
  suggested: number;
  /** Falso si el exceso iguala o supera las horas de la gestión: reducir no alcanza, hay que moverla. */
  possible: boolean;
}

export function planReduction(currentHours: number, exceedsBy: number): ReductionPlan {
  const max = Math.round((currentHours - exceedsBy) * 100) / 100;
  if (max <= 0) {
    return { max: 0, suggested: 0, possible: false };
  }
  const halfSteps = Math.floor(max * 2 + 1e-9) / 2;
  return { max, suggested: halfSteps >= 0.5 ? halfSteps : max, possible: true };
}

// --- Contrato real del backend (events-api) — ver conflictos.md --------------

export interface OverloadCheckRequestDto {
  fechaObjetivo: string;
  horasEstimadas: number;
}

export interface OverloadCheckResponseDto {
  conflict: boolean;
  plannedHours: number;
  limitHours: number;
  exceedsBy: number;
}
