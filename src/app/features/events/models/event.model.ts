import { SubtareaResponseDto } from './subtask.model';

export interface EventProgress {
  done: number;
  total: number;
  percentage: number;
}

export interface EventEntity {
  id: string;
  organizerId: string;
  name: string;
  type: string;
  contact: string;
  datetime: string;
  place: string;
  progress: EventProgress;
}

export interface EventPayload {
  name: string;
  type: string;
  contact: string;
  datetime: string;
  place: string;
}

export const EVENT_TYPE_SUGGESTIONS = [
  'Social',
  'Corporativo',
  'Deportivo',
  'Cultural',
  'Académico'
];

// --- Contrato real del backend (events-api) — ver eventos.md -----------------

export interface EventoResponseDto {
  id: string;
  nombre: string;
  tipo: string;
  cliente: string | null;
  contactoCliente: string | null;
  fechaHora: string;
  lugar: string | null;
  plazoLimite: string | null;
  organizadorId: string;
  subtareas: SubtareaResponseDto[];
}

export interface SubtareaInicialRequestDto {
  nombre: string;
  fechaObjetivo: string;
  horasEstimadas: number;
}

export interface CreateEventoRequestDto {
  nombre: string;
  tipo: string;
  cliente?: string;
  contactoCliente?: string;
  fechaHora: string;
  lugar?: string;
  plazoLimite?: string;
  subtareas?: SubtareaInicialRequestDto[];
}

export interface UpdateEventoRequestDto {
  nombre?: string;
  tipo?: string;
  cliente?: string;
  contactoCliente?: string;
  fechaHora?: string;
  lugar?: string;
  plazoLimite?: string;
}

export interface ProgressResponseDto {
  done: number;
  total: number;
  percentage: number;
}
