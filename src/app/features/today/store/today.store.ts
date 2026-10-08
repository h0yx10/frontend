import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AppHttpError } from '../../../core/interceptors/http-error.interceptor';
import {
  SubtaskExecutionPayload
} from '../../events/models/subtask.model';
import { SubtasksService } from '../../events/services/subtasks.service';
import { TodayBoard, TodayFilters, TodaySearch } from '../models/today.model';
import { TodayService } from '../services/today.service';
import { WorkloadStore } from './workload.store';

const EMPTY_BOARD: TodayBoard = {
  overdue: [],
  today: [],
  upcoming: [],
  capacity: { plannedHours: 0, limitHours: 0, percentage: 0 },
  stats: {
    overdueCount: 0,
    todayCount: 0,
    completedLast7Days: 0,
    completedTrendPercentage: null,
    upcoming7DaysCount: 0,
    upcoming7DaysEventsCount: 0
  },
  keyTasks: [],
  eventsToday: [],
  conflictAlert: null,
  rule: ''
};

@Injectable()
export class TodayStore {
  private readonly service = inject(TodayService);
  private readonly subtasksService = inject(SubtasksService);
  private readonly workload = inject(WorkloadStore);

  readonly board = signal<TodayBoard>(EMPTY_BOARD);
  readonly loading = signal(false);
  /** Verdadero tras la primera respuesta: las recargas posteriores no vacían el tablero. */
  readonly loaded = signal(false);
  readonly error = signal('');
  readonly filters = signal<TodayFilters>({ eventId: '', status: '' });

  readonly search = signal<TodaySearch>({ query: '', eventId: '' });

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.service
      .load(this.filters())
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.loaded.set(true);
        })
      )
      .subscribe({
        next: (board) => {
          this.board.set(board);
          this.workload.apply({
            plannedHours: board.capacity.plannedHours,
            overdueCount: board.stats.overdueCount,
            todayCount: board.stats.todayCount
          });
        },
        error: (error: Error) => this.error.set(error.message)
      });
  }

  setFilters(filters: TodayFilters): void {
    this.filters.set(filters);
    this.load();
  }

  clearFilters(): void {
    this.filters.set({ eventId: '', status: '' });
    this.load();
  }

  setSearch(search: Partial<TodaySearch>): void {
    this.search.update((current) => ({ ...current, ...search }));
  }

  clearSearch(): void {
    this.search.set({ query: '', eventId: '' });
  }

  executeSubtask(id: string, payload: SubtaskExecutionPayload): void {
    this.subtasksService.execute(id, payload).subscribe({
      next: () => this.load(),
      error: (error: AppHttpError) => this.error.set(error.message)
    });
  }
}
