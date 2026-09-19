import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AppHttpError } from '../../../core/interceptors/http-error.interceptor';
import {
  SubtaskExecutionPayload
} from '../../events/models/subtask.model';
import { SubtasksService } from '../../events/services/subtasks.service';
import { TodayBoard, TodayFilters } from '../models/today.model';
import { TodayService } from '../services/today.service';

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

  readonly board = signal<TodayBoard>(EMPTY_BOARD);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly filters = signal<TodayFilters>({ eventId: '', status: '' });

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.service
      .load(this.filters())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (board) => this.board.set(board),
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

  executeSubtask(id: string, payload: SubtaskExecutionPayload): void {
    this.subtasksService.execute(id, payload).subscribe({
      next: () => this.load(),
      error: (error: AppHttpError) => this.error.set(error.message)
    });
  }
}
