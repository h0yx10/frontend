export type SubtaskStatus = 'PENDING' | 'DONE' | 'POSTPONED';

export interface Subtask {
  id: string;
  eventId: string;
  /** Sólo se resuelve donde hace falta mostrarlo fuera del detalle del evento (vista Hoy). */
  eventName: string;
  name: string;
  description: string | null;
  targetDate: string;
  estimatedHours: number;
  status: SubtaskStatus;
  note: string | null;
  doneAt: string | null;
  createdAt: string;
}

export interface SubtaskPayload {
  name: string;
  description?: string | null;
  targetDate: string;
  estimatedHours: number;
}

export interface SubtaskUpdatePayload {
  name?: string;
  description?: string | null;
  targetDate?: string;
  estimatedHours?: number;
}

export interface SubtaskExecutionPayload {
  status: SubtaskStatus;
  note?: string | null;
}

export const DEFAULT_LOGISTIC_SUBTASKS: Array<Pick<SubtaskPayload, 'name' | 'estimatedHours'>> = [
  { name: 'Reservar salón', estimatedHours: 2 },
  { name: 'Enviar invitaciones', estimatedHours: 1.5 },
  { name: 'Confirmar catering', estimatedHours: 1 }
];

// --- Contrato real del backend (events-api) — ver subtareas.md ---------------

export interface SubtareaResponseDto {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  targetDate: string;
  estimatedHours: number;
  status: SubtaskStatus;
  note: string | null;
  doneAt: string | null;
  createdAt: string;
}

export interface CreateSubtareaRequestDto {
  name: string;
  description?: string | null;
  targetDate: string;
  estimatedHours: number;
}

export interface UpdateSubtareaRequestDto {
  name?: string;
  description?: string | null;
  targetDate?: string;
  estimatedHours?: number;
}

export interface ChangeSubtareaStatusRequestDto {
  status: SubtaskStatus;
  note?: string | null;
}
