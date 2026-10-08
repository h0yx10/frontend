import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { formatIsoDateHuman, formatLongDay, todayIsoDate } from '../../core/utils/date.util';
import { CheckButtonComponent } from '../../shared/ui/atoms/check-button.component';
import { ProgressBarComponent } from '../../shared/ui/atoms/progress-bar.component';
import { EmptyStateComponent } from '../../shared/ui/molecules/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/molecules/error-state.component';
import { PageHeaderComponent } from '../../shared/ui/molecules/page-header.component';
import { SearchBoxComponent } from '../../shared/ui/molecules/search-box.component';
import { PostponeDialogComponent } from '../events/components/postpone-dialog.component';
import { RescheduleDialogComponent } from '../events/components/reschedule-dialog.component';
import { EventEntity } from '../events/models/event.model';
import { Subtask } from '../events/models/subtask.model';
import { EventsService } from '../events/services/events.service';
import { StatCardComponent } from './components/stat-card.component';
import { TodayColumnComponent } from './components/today-column.component';
import { TodayEventCardComponent } from './components/today-event-card.component';
import { TodayEventGroup } from './models/today.model';
import { TodayStore } from './store/today.store';

@Component({
  selector: 'app-today-page',
  standalone: true,
  imports: [
    DecimalPipe,
    MatIconModule,
    RouterLink,
    CheckButtonComponent,
    ProgressBarComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SearchBoxComponent,
    StatCardComponent,
    TodayColumnComponent,
    TodayEventCardComponent,
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

  readonly todayLabel = formatLongDay();
  readonly formatIsoDateHuman = formatIsoDateHuman;
  readonly hasSearch = computed(() => {
    const { query, eventId } = this.store.search();
    return Boolean(query.trim() || eventId);
  });
  readonly overdueEvents = computed(() => this.applySearch(this.groupByEvent(this.store.board().overdue)));
  readonly todayEvents = computed(() =>
    this.applySearch([...this.groupByEvent(this.store.board().today), ...this.eventsWithoutPendingSubtasks()])
  );
  readonly upcomingEvents = computed(() => this.applySearch(this.groupByEvent(this.store.board().upcoming)));

  constructor() {
    this.store.load();
    this.eventsService.list().subscribe((events) => this.eventOptions.set(events));
  }

  get isEmpty(): boolean {
    return this.overdueEvents().length === 0 && this.todayEvents().length === 0 && this.upcomingEvents().length === 0;
  }

  clearSearch(): void {
    this.store.clearSearch();
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

  statHint(trend: number | null): string {
    if (trend === null) return 'Sin datos de la semana previa';
    return `${trend >= 0 ? '+' : ''}${trend}% vs. semana pasada`;
  }

  private applySearch(groups: TodayEventGroup[]): TodayEventGroup[] {
    const { query, eventId } = this.store.search();
    const term = this.normalize(query);

    return groups.filter((group) => {
      if (eventId && group.eventId !== eventId) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = [group.eventName, group.event?.place, group.event?.type, ...group.subtasks.map((s) => s.name)]
        .filter(Boolean)
        .map((value) => this.normalize(value as string));
      return haystack.some((value) => value.includes(term));
    });
  }

  private normalize(value: string): string {
    return value.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  private groupByEvent(items: Subtask[]): TodayEventGroup[] {
    const grouped = new Map<string, TodayEventGroup>();

    for (const subtask of items) {
      const current = grouped.get(subtask.eventId);
      if (current) {
        current.subtasks.push(subtask);
        continue;
      }

      grouped.set(subtask.eventId, {
        eventId: subtask.eventId,
        eventName: subtask.eventName,
        event: this.eventOptions().find((event) => event.id === subtask.eventId),
        subtasks: [subtask]
      });
    }

    return Array.from(grouped.values());
  }

  /** Eventos de hoy ya completos: se listan igualmente para que el día no parezca vacío. */
  private eventsWithoutPendingSubtasks(): TodayEventGroup[] {
    const today = todayIsoDate();
    const activeEventIds = new Set(this.store.board().today.map((subtask) => subtask.eventId));

    return this.eventOptions()
      .filter(
        (event) =>
          event.datetime.slice(0, 10) === today &&
          !activeEventIds.has(event.id) &&
          event.progress.done === event.progress.total
      )
      .map((event) => ({
        eventId: event.id,
        eventName: event.name,
        event,
        subtasks: []
      }));
  }
}
