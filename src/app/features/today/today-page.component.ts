import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { formatIsoDateHuman, todayIsoDate } from '../../core/utils/date.util';
import { ErrorStateComponent } from '../../shared/ui/molecules/error-state.component';
import { EmptyStateComponent } from '../../shared/ui/molecules/empty-state.component';
import { PostponeDialogComponent } from '../events/components/postpone-dialog.component';
import { EventEntity } from '../events/models/event.model';
import { Subtask } from '../events/models/subtask.model';
import { EventsService } from '../events/services/events.service';
import { RescheduleDialogComponent } from '../events/components/reschedule-dialog.component';
import { StatCardComponent } from './components/stat-card.component';
import { TodayGroupComponent } from './components/today-group.component';
import { TodayStore } from './store/today.store';

@Component({
  selector: 'app-today-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    RouterLink,
    EmptyStateComponent,
    ErrorStateComponent,
    StatCardComponent,
    TodayGroupComponent,
    RescheduleDialogComponent,
    PostponeDialogComponent
  ],
  providers: [TodayStore],
  templateUrl: './today-page.component.html'
})
export class TodayPageComponent {
  private readonly eventsService = inject(EventsService);

  readonly store = inject(TodayStore);
  readonly rescheduleTarget = signal<Subtask | null>(null);
  readonly postponeTarget = signal<Subtask | null>(null);
  readonly eventOptions = signal<EventEntity[]>([]);

  readonly todayLabel = this.capitalize(formatIsoDateHuman(todayIsoDate()));
  readonly formatIsoDateHuman = formatIsoDateHuman;

  eventId = '';
  status = '';

  constructor() {
    this.store.load();
    this.eventsService.list().subscribe((events) => this.eventOptions.set(events));
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  get isEmpty(): boolean {
    const board = this.store.board();
    return board.overdue.length === 0 && board.today.length === 0 && board.upcoming.length === 0;
  }

  get hasActiveFilters(): boolean {
    return !!this.eventId || !!this.status;
  }

  applyFilters(): void {
    this.store.setFilters({ eventId: this.eventId, status: this.status });
  }

  clearFilters(): void {
    this.eventId = '';
    this.status = '';
    this.store.clearFilters();
  }

  markDone(subtask: Subtask): void {
    this.store.executeSubtask(subtask.id, { status: 'DONE' });
  }

  openConflict(): void {
    const alert = this.store.board().conflictAlert;
    if (alert) {
      this.rescheduleTarget.set(alert.subtask);
    }
  }
}
