import { Subtask, SubtareaResponseDto } from '../../events/models/subtask.model';

export interface TodayCapacity {
  plannedHours: number;
  limitHours: number;
  percentage: number;
}

export interface TodayStats {
  overdueCount: number;
  todayCount: number;
  completedLast7Days: number;
  completedTrendPercentage: number | null;
  upcoming7DaysCount: number;
  upcoming7DaysEventsCount: number;
}

export interface EventTodaySummary {
  eventId: string;
  eventName: string;
  percentage: number;
}

export interface ConflictAlert {
  subtask: Subtask;
  candidateDate: string;
  plannedHours: number;
  limitHours: number;
}

export interface TodayBoard {
  overdue: Subtask[];
  today: Subtask[];
  upcoming: Subtask[];
  capacity: TodayCapacity;
  stats: TodayStats;
  keyTasks: Subtask[];
  eventsToday: EventTodaySummary[];
  conflictAlert: ConflictAlert | null;
  rule: string;
}

export interface TodayFilters {
  eventId: string;
  status: string;
}

// --- Contrato real del backend (events-api) — ver hoy.md ---------------------

export interface TodayResponseDto {
  vencidas: SubtareaResponseDto[];
  paraHoy: SubtareaResponseDto[];
  proximas: SubtareaResponseDto[];
  regla: string;
}
