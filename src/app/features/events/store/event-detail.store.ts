import { inject, Injectable, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';

import { AppHttpError } from '../../../core/interceptors/http-error.interceptor';
import { EventEntity, EventPayload } from '../models/event.model';
import {
  Subtask,
  SubtaskExecutionPayload,
  SubtaskPayload,
  SubtaskUpdatePayload
} from '../models/subtask.model';
import { EventsService } from '../services/events.service';
import { SubtasksService } from '../services/subtasks.service';
import { ConflictsService } from '../services/conflicts.service';
import { OverloadCheckResult } from '../models/conflict.model';

@Injectable()
export class EventDetailStore {
  private readonly eventsService = inject(EventsService);
  private readonly subtasksService = inject(SubtasksService);
  private readonly conflictsService = inject(ConflictsService);

  readonly event = signal<EventEntity | null>(null);
  readonly subtasks = signal<Subtask[]>([]);
  readonly loading = signal(false);
  readonly notFound = signal(false);
  readonly error = signal('');
  readonly saving = signal(false);
  readonly eventFieldErrors = signal<Record<string, string>>({});
  readonly subtaskFieldErrors = signal<Record<string, string>>({});
  readonly overload = signal<OverloadCheckResult | null>(null);
  readonly overloadTarget = signal<Subtask | null>(null);
  readonly successMessage = signal('');

  load(eventId: string): void {
    this.loading.set(true);
    this.error.set('');
    this.notFound.set(false);

    forkJoin({
      event: this.eventsService.get(eventId),
      subtasks: this.subtasksService.listByEvent(eventId)
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ event, subtasks }) => {
          this.event.set(event);
          this.subtasks.set(subtasks);
        },
        error: (error: AppHttpError) => {
          if (error.status === 404) {
            this.notFound.set(true);
          } else {
            this.error.set(error.message);
          }
        }
      });
  }

  private reloadEvent(): void {
    const current = this.event();
    if (!current) {
      return;
    }
    this.eventsService.get(current.id).subscribe((event) => this.event.set(event));
  }

  updateEvent(payload: Partial<EventPayload>, onSuccess: () => void): void {
    const current = this.event();
    if (!current) {
      return;
    }

    this.saving.set(true);
    this.eventFieldErrors.set({});
    this.error.set('');

    this.eventsService
      .update(current.id, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (event) => {
          this.event.set(event);
          onSuccess();
        },
        error: (error: AppHttpError) => {
          this.eventFieldErrors.set(error.fieldErrors ?? {});
          this.error.set(error.message);
        }
      });
  }

  deleteEvent(onSuccess: () => void): void {
    const current = this.event();
    if (!current) {
      return;
    }

    this.saving.set(true);
    this.eventsService
      .delete(current.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => onSuccess(),
        error: (error: AppHttpError) => this.error.set(error.message)
      });
  }

  addSubtask(payload: SubtaskPayload, onSuccess: () => void): void {
    const current = this.event();
    if (!current) {
      return;
    }

    this.saving.set(true);
    this.subtaskFieldErrors.set({});
    this.error.set('');
    this.successMessage.set('');

    this.subtasksService
      .create(current.id, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (subtask) => {
          this.subtasks.update((subtasks) => [...subtasks, subtask]);
          this.reloadEvent();
          this.conflictsService
            .checkOverload(subtask.id, {
              targetDate: subtask.targetDate,
              estimatedHours: subtask.estimatedHours
            })
            .subscribe({
              next: (result) => {
                if (result.exceeds) {
                  this.overload.set(result);
                  this.overloadTarget.set(subtask);
                  onSuccess();
                  return;
                }
                const planned = this.roundHours(result.plannedHours);
                const limit = this.roundHours(result.limitHours);
                const remaining = this.roundHours(Math.max(0, limit - planned));
                this.successMessage.set(`Subtarea creada. Llevas ${planned} h de ${limit} h hoy; te quedan ${remaining} h.`);
                onSuccess();
              },
              error: () => {
                this.error.set('Subtarea creada, pero no fue posible comprobar la capacidad diaria.');
                onSuccess();
              }
            });
        },
        error: (error: AppHttpError) => {
          this.subtaskFieldErrors.set(error.fieldErrors ?? {});
          if (error.status === 409 && error.overload) {
            this.overload.set({ ...error.overload, exceeds: true });
            this.error.set(
              `La subtarea no se creó porque supera tu capacidad por ${this.roundHours(error.overload.exceedsBy)} h. Ajusta las horas o el plazo e inténtalo de nuevo.`
            );
          } else {
            this.error.set(error.message);
          }
        }
      });
  }

  updateSubtask(id: string, payload: SubtaskUpdatePayload, onSuccess: () => void): void {
    this.saving.set(true);
    this.subtaskFieldErrors.set({});
    this.error.set('');
    this.successMessage.set('');

    this.subtasksService
      .update(id, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (subtask) => {
          this.replaceSubtask(subtask);
          onSuccess();
        },
        error: (error: AppHttpError) => {
          this.subtaskFieldErrors.set(error.fieldErrors ?? {});
          if (error.status === 409 && error.overload) {
            const current = this.subtasks().find((subtask) => subtask.id === id);
            if (current) {
              this.overload.set({ ...error.overload, exceeds: true });
              this.overloadTarget.set({ ...current, ...payload });
            }
            this.error.set('');
          } else {
            this.error.set(error.message);
          }
        }
      });
  }

  clearOverload(): void {
    this.overload.set(null);
    this.overloadTarget.set(null);
  }

  markResolutionComplete(): void {
    this.clearOverload();
    this.successMessage.set('Listo, ya estás dentro de tu capacidad diaria.');
  }

  private roundHours(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  rescheduleSubtask(id: string, targetDate: string, onSuccess: () => void): void {
    this.saving.set(true);
    this.error.set('');

    this.subtasksService
      .update(id, { targetDate })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (subtask) => {
          this.replaceSubtask(subtask);
          onSuccess();
        },
        error: (error: AppHttpError) => this.error.set(error.message)
      });
  }

  deleteSubtask(id: string): void {
    this.saving.set(true);
    this.subtasksService
      .delete(id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.subtasks.update((subtasks) => subtasks.filter((subtask) => subtask.id !== id));
          this.reloadEvent();
        },
        error: (error: AppHttpError) => this.error.set(error.message)
      });
  }

  executeSubtask(id: string, payload: SubtaskExecutionPayload): void {
    const previous = this.subtasks();
    this.saving.set(true);
    this.error.set('');

    this.subtasksService
      .execute(id, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (subtask) => {
          this.replaceSubtask(subtask);
          this.reloadEvent();
        },
        error: (error: AppHttpError) => {
          this.subtasks.set(previous);
          this.error.set(error.message);
        }
      });
  }

  /** Sincroniza una subtarea que fue modificada por un componente externo (ej. reprogramación). */
  applySubtaskUpdate(updated: Subtask): void {
    this.replaceSubtask(updated);
    this.reloadEvent();
  }

  private replaceSubtask(updated: Subtask): void {
    this.subtasks.update((subtasks) =>
      subtasks.map((subtask) => (subtask.id === updated.id ? updated : subtask))
    );
  }
}
