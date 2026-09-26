import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { runtimeConfig } from '../../../core/config/runtime-config';
import { ApiResponse } from '../../../core/http/api-response.model';
import {
  ChangeSubtareaStatusRequestDto,
  CreateSubtareaRequestDto,
  Subtask,
  SubtareaResponseDto,
  SubtaskExecutionPayload,
  SubtaskPayload,
  SubtaskUpdatePayload,
  UpdateSubtareaRequestDto
} from '../models/subtask.model';

@Injectable({
  providedIn: 'root'
})
export class SubtasksService {
  private readonly http = inject(HttpClient);
  private readonly base = runtimeConfig.apiUrl;

  listByEvent(eventId: string): Observable<Subtask[]> {
    return this.http
      .get<ApiResponse<SubtareaResponseDto[]>>(`${this.base}/events/${eventId}/subtasks`)
      .pipe(map((response) => response.data.map((dto) => mapSubtaskFromDto(dto))));
  }

  create(eventId: string, payload: SubtaskPayload): Observable<Subtask> {
    const body: CreateSubtareaRequestDto = {
      nombre: payload.name,
      ...(payload.description !== undefined ? { descripcion: payload.description } : {}),
      fechaObjetivo: payload.targetDate,
      horasEstimadas: payload.estimatedHours
    };
    return this.http
      .post<ApiResponse<SubtareaResponseDto>>(`${this.base}/events/${eventId}/subtasks`, body)
      .pipe(map((response) => mapSubtaskFromDto(response.data)));
  }

  /** Actualiza campos y/o reprograma (fecha/horas); el backend valida sobrecarga y puede responder 409. */
  update(id: string, payload: SubtaskUpdatePayload): Observable<Subtask> {
    const body: UpdateSubtareaRequestDto = {
      ...(payload.name !== undefined ? { nombre: payload.name } : {}),
      ...(payload.description !== undefined ? { descripcion: payload.description } : {}),
      ...(payload.targetDate !== undefined ? { fechaObjetivo: payload.targetDate } : {}),
      ...(payload.estimatedHours !== undefined ? { horasEstimadas: payload.estimatedHours } : {})
    };
    return this.http
      .patch<ApiResponse<SubtareaResponseDto>>(`${this.base}/subtasks/${id}`, body)
      .pipe(map((response) => mapSubtaskFromDto(response.data)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/subtasks/${id}`).pipe(map(() => undefined));
  }

  execute(id: string, payload: SubtaskExecutionPayload): Observable<Subtask> {
    const body: ChangeSubtareaStatusRequestDto = { estado: payload.status, nota: payload.note ?? null };
    return this.http
      .patch<ApiResponse<SubtareaResponseDto>>(`${this.base}/subtasks/${id}/status`, body)
      .pipe(map((response) => mapSubtaskFromDto(response.data)));
  }
}

export function mapSubtaskFromDto(dto: SubtareaResponseDto, eventName = ''): Subtask {
  return {
    id: dto.id,
    eventId: dto.eventoId,
    eventName,
    name: dto.nombre,
    description: dto.descripcion,
    targetDate: dto.fechaObjetivo,
    estimatedHours: dto.horasEstimadas,
    status: dto.estado,
    postponeNote: dto.nota,
    doneAt: dto.doneAt,
    createdAt: dto.createdAt
  };
}
