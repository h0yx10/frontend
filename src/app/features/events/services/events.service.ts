import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { runtimeConfig } from '../../../core/config/runtime-config';
import { ApiResponse } from '../../../core/http/api-response.model';
import { withoutSeconds, withSeconds } from '../../../core/utils/date.util';
import {
  CreateEventoRequestDto,
  EventEntity,
  EventoResponseDto,
  EventPayload,
  SubtareaInicialRequestDto,
  UpdateEventoRequestDto
} from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${runtimeConfig.apiUrl}/events`;

  /** GET /api/events no admite filtros en el backend; la búsqueda se aplica en el cliente. */
  list(query = ''): Observable<EventEntity[]> {
    return this.http
      .get<ApiResponse<EventoResponseDto[]>>(this.url)
      .pipe(map((response) => filterByQuery(response.data.map(mapEventFromDto), query)));
  }

  get(id: string): Observable<EventEntity> {
    return this.http
      .get<ApiResponse<EventoResponseDto>>(`${this.url}/${id}`)
      .pipe(map((response) => mapEventFromDto(response.data)));
  }

  create(payload: EventPayload, subtareas: SubtareaInicialRequestDto[] = []): Observable<EventEntity> {
    const body: CreateEventoRequestDto = {
      ...toEventDto(payload),
      nombre: payload.name,
      tipo: payload.type,
      fechaHora: withSeconds(payload.datetime)
    } as CreateEventoRequestDto;
    if (subtareas.length) {
      body.subtareas = subtareas;
    }
    return this.http
      .post<ApiResponse<EventoResponseDto>>(this.url, body)
      .pipe(map((response) => mapEventFromDto(response.data)));
  }

  update(id: string, payload: Partial<EventPayload>): Observable<EventEntity> {
    const body: UpdateEventoRequestDto = toEventDto(payload);
    return this.http
      .patch<ApiResponse<EventoResponseDto>>(`${this.url}/${id}`, body)
      .pipe(map((response) => mapEventFromDto(response.data)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.url}/${id}`).pipe(map(() => undefined));
  }
}

function filterByQuery(events: EventEntity[], query: string): EventEntity[] {
  const normalized = query.trim().toLowerCase();
  return normalized ? events.filter((event) => event.name.toLowerCase().includes(normalized)) : events;
}

function toEventDto(payload: Partial<EventPayload>): UpdateEventoRequestDto {
  const dto: UpdateEventoRequestDto = {};
  if (payload.name !== undefined) {
    dto.nombre = payload.name;
  }
  if (payload.type !== undefined) {
    dto.tipo = payload.type;
  }
  if (payload.contact !== undefined) {
    dto.contactoCliente = payload.contact;
  }
  if (payload.datetime !== undefined) {
    dto.fechaHora = withSeconds(payload.datetime);
  }
  if (payload.place !== undefined) {
    dto.lugar = payload.place;
  }
  return dto;
}

export function mapEventFromDto(dto: EventoResponseDto): EventEntity {
  const subtareas = dto.subtareas ?? [];
  const total = subtareas.length;
  const done = subtareas.filter((subtarea) => subtarea.estado === 'DONE').length;

  return {
    id: dto.id,
    organizerId: dto.organizadorId,
    name: dto.nombre,
    type: dto.tipo,
    contact: [dto.cliente, dto.contactoCliente].filter((part) => !!part?.trim()).join(' · '),
    datetime: withoutSeconds(dto.fechaHora),
    place: dto.lugar ?? '',
    progress: { done, total, percentage: total === 0 ? 0 : Math.round((done / total) * 100) }
  };
}
