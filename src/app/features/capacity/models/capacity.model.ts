export interface DailyCapacity {
  dailyLimitHours: number;
  isDefault: boolean;
  effectiveDate: string | null;
}

export interface DailyCapacityPayload {
  dailyLimitHours: number;
}

export const CAPACITY_MIN_HOURS = 1;
export const CAPACITY_MAX_HOURS = 16;

// --- Contrato real del backend (events-api) — ver capacidad.md ---------------

export interface CapacidadResponseDto {
  limiteHoras: number;
  porDefecto: boolean;
  fecha: string | null;
}

export interface CapacidadRequestDto {
  limiteHoras: number;
}
