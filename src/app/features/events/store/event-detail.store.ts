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

@Injectable()
export class EventDetailStore {
  private readonly eventsService = inject(EventsService);
  private readonly subtasksService = inject(SubtasksService);

  readonly event = signal<EventEntity | null>(null);
  readonly subtasks = signal<Subtask[]>([]);
  readonly loading = signal(false);
  readonly notFound = signal(false);
  readonly error = signal('');
  readonly saving = signal(false);
  readonly eventFieldErrors = signal<Record<string, string>>({});
  readonly subtaskFieldErrors = signal<Record<string, string>>({});

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

    this.subtasksService
      .create(current.id, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (subtask) => {
          this.subtasks.update((subtasks) => [...subtasks, subtask]);
          this.reloadEvent();
          onSuccess();
        },
        error: (error: AppHttpError) => {
          this.subtaskFieldErrors.set(error.fieldErrors ?? {});
          this.error.set(error.message);
        }
      });
  }

  updateSubtask(id: string, payload: SubtaskUpdatePayload, onSuccess: () => void): void {
    this.saving.set(true);
    this.subtaskFieldErrors.set({});
    this.error.set('');

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
          this.error.set(error.message);
        }
      });
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
