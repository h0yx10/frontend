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
