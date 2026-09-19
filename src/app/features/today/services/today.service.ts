import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

import { runtimeConfig } from '../../../core/config/runtime-config';
import { ApiResponse } from '../../../core/http/api-response.model';
import { addDaysIso, compareIsoDates, todayIsoDate } from '../../../core/utils/date.util';
import { CapacidadResponseDto } from '../../capacity/models/capacity.model';
import { EventoResponseDto } from '../../events/models/event.model';
import { SubtareaResponseDto, Subtask } from '../../events/models/subtask.model';
import { mapSubtaskFromDto } from '../../events/services/subtasks.service';
import {
  ConflictAlert,
  EventTodaySummary,
  TodayBoard,
  TodayFilters,
  TodayResponseDto,
  TodayStats
} from '../models/today.model';

/**
 * `/api/today` (hoy.md) sólo devuelve las subtareas activas agrupadas por fecha. El
 * panel "Hoy" muestra además KPIs, gestiones clave, eventos del día y una alerta de
 * sobrecarga que el backend no expone directamente: se derivan aquí combinando ese
 * endpoint con `/api/events` (trae las subtareas completas de cada evento) y
 * `/api/capacity`.
 */
@Injectable({
  providedIn: 'root'
})
export class TodayService {
  private readonly http = inject(HttpClient);
  private readonly todayUrl = `${runtimeConfig.apiUrl}/today`;
  private readonly eventsUrl = `${runtimeConfig.apiUrl}/events`;
  private readonly capacityUrl = `${runtimeConfig.apiUrl}/capacity`;

  load(filters: TodayFilters): Observable<TodayBoard> {
    const hasFilters = !!filters.eventId || !!filters.status;

    return forkJoin({
      filtered: this.fetchToday(filters),
      unfiltered: hasFilters ? this.fetchToday({ eventId: '', status: '' }) : this.fetchToday(filters),
      events: this.http
        .get<ApiResponse<EventoResponseDto[]>>(this.eventsUrl)
        .pipe(map((response) => response.data)),
      capacity: this.http
        .get<ApiResponse<CapacidadResponseDto>>(this.capacityUrl)
        .pipe(map((response) => response.data))
    }).pipe(map(({ filtered, unfiltered, events, capacity }) => buildBoard(filtered, unfiltered, events, capacity)));
  }

  private fetchToday(filters: TodayFilters): Observable<TodayResponseDto> {
    return this.http
      .get<ApiResponse<TodayResponseDto>>(this.todayUrl, {
        params: { eventId: filters.eventId, status: filters.status }
      })
      .pipe(map((response) => response.data));
  }
}

function buildBoard(
  filtered: TodayResponseDto,
  unfiltered: TodayResponseDto,
  events: EventoResponseDto[],
  capacity: CapacidadResponseDto
): TodayBoard {
  const eventNameById = new Map(events.map((event) => [event.id, event.nombre]));
  const toSubtasks = (dtos: SubtareaResponseDto[]) =>
    dtos.map((dto) => mapSubtaskFromDto(dto, eventNameById.get(dto.eventoId) ?? ''));

  const overdue = toSubtasks(filtered.vencidas);
  const today = toSubtasks(filtered.paraHoy);
  const upcoming = toSubtasks(filtered.proximas);

  const allOverdue = toSubtasks(unfiltered.vencidas);
  const allToday = toSubtasks(unfiltered.paraHoy);
  const allUpcoming = toSubtasks(unfiltered.proximas);
  const allActive = [...allOverdue, ...allToday, ...allUpcoming];

  const limitHours = capacity.limiteHoras;
  const plannedHours = allToday.reduce((total, subtask) => total + subtask.estimatedHours, 0);

  return {
    overdue,
    today,
    upcoming,
    capacity: {
      plannedHours,
      limitHours,
      percentage: limitHours === 0 ? 0 : Math.round((plannedHours / limitHours) * 100)
    },
    stats: buildStats(events, allOverdue, allToday, allUpcoming),
    keyTasks: [...allOverdue, ...allToday].slice(0, 3),
    eventsToday: buildEventsToday(events, [...allOverdue, ...allToday]),
    conflictAlert: findConflictAlert([...allOverdue, ...allToday], allActive, limitHours),
    rule: filtered.regla
  };
}

function buildStats(
  events: EventoResponseDto[],
  overdue: Subtask[],
  today: Subtask[],
  upcoming: Subtask[]
): TodayStats {
  const todayIso = todayIsoDate();
  const sevenDaysAgo = addDaysIso(todayIso, -7);
  const fourteenDaysAgo = addDaysIso(todayIso, -14);
  const sevenDaysAhead = addDaysIso(todayIso, 7);

  const allSubtasks = events.flatMap((event) =>
    event.subtareas.map((dto) => mapSubtaskFromDto(dto, event.nombre))
  );
  const doneDateOf = (subtask: Subtask) => (subtask.doneAt ?? '').slice(0, 10);

  const completedLast7Days = allSubtasks.filter(
    (s) => s.status === 'DONE' && doneDateOf(s) > sevenDaysAgo && doneDateOf(s) <= todayIso
  ).length;
  const completedPrior7Days = allSubtasks.filter(
    (s) => s.status === 'DONE' && doneDateOf(s) > fourteenDaysAgo && doneDateOf(s) <= sevenDaysAgo
  ).length;

  const upcoming7Days = upcoming.filter((s) => compareIsoDates(s.targetDate, sevenDaysAhead) <= 0);

  return {
    overdueCount: overdue.length,
    todayCount: today.length,
    completedLast7Days,
    completedTrendPercentage:
      completedPrior7Days === 0
        ? null
        : Math.round(((completedLast7Days - completedPrior7Days) / completedPrior7Days) * 100),
    upcoming7DaysCount: upcoming7Days.length,
    upcoming7DaysEventsCount: new Set(upcoming7Days.map((s) => s.eventId)).size
  };
}

function buildEventsToday(events: EventoResponseDto[], items: Subtask[]): EventTodaySummary[] {
  const eventIds = Array.from(new Set(items.map((item) => item.eventId)));
  return eventIds
    .map((eventId) => {
      const event = events.find((item) => item.id === eventId);
      if (!event) {
        return null;
      }
      const total = event.subtareas.length;
      const done = event.subtareas.filter((subtarea) => subtarea.estado === 'DONE').length;
      return {
        eventId,
        eventName: event.nombre,
        percentage: total === 0 ? 0 : Math.round((done / total) * 100)
      };
    })
    .filter((summary): summary is EventTodaySummary => summary !== null);
}

/**
 * Sugerencia proactiva (complementa US-07): si reprogramar la primera gestión de
 * "hoy"/"vencidas" a mañana generaría sobrecarga, se avisa en el dashboard con el
 * mismo cálculo que usa el diálogo de reprogramación.
 */
function findConflictAlert(
  candidates: Subtask[],
  allActive: Subtask[],
  limitHours: number
): ConflictAlert | null {
  const candidateDate = addDaysIso(todayIsoDate(), 1);

  for (const subtask of candidates) {
    const plannedHours =
      allActive
        .filter((s) => s.targetDate === candidateDate && s.id !== subtask.id)
        .reduce((total, s) => total + s.estimatedHours, 0) + subtask.estimatedHours;
    if (plannedHours > limitHours) {
      return { subtask, candidateDate, plannedHours, limitHours };
    }
  }

  return null;
}
