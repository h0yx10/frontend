import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { DateBucket, formatDateTimeHuman, formatIsoDateHuman, todayIsoDate } from '../../core/utils/date.util';
import { SearchBoxComponent } from '../../shared/ui/molecules/search-box.component';
import { ErrorStateComponent } from '../../shared/ui/molecules/error-state.component';
import { EmptyStateComponent } from '../../shared/ui/molecules/empty-state.component';
import { PostponeDialogComponent } from '../events/components/postpone-dialog.component';
import { EventEntity } from '../events/models/event.model';
import { Subtask } from '../events/models/subtask.model';
import { EventsService } from '../events/services/events.service';
import { RescheduleDialogComponent } from '../events/components/reschedule-dialog.component';
import { StatCardComponent } from './components/stat-card.component';
import { TodayItemComponent } from './components/today-item.component';
import { TodayStore } from './store/today.store';

interface TodayEventGroup {
  eventId: string;
  eventName: string;
  event: EventEntity | undefined;
  subtasks: Subtask[];
}

@Component({
  selector: 'app-today-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    RouterLink,
    EmptyStateComponent,
    SearchBoxComponent,
    ErrorStateComponent,
    StatCardComponent,
    TodayItemComponent,
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
  readonly formatDateTimeHuman = formatDateTimeHuman;
  readonly query = signal('');
  readonly overdueEvents = computed(() => this.applyQuery(this.groupByEvent(this.store.board().overdue)));
  readonly todayEvents = computed(() =>
    this.applyQuery([...this.groupByEvent(this.store.board().today), ...this.eventsWithoutPendingSubtasks()])
  );
  readonly upcomingEvents = computed(() => this.applyQuery(this.groupByEvent(this.store.board().upcoming)));

  constructor() {
    this.store.load();
    this.eventsService.list().subscribe((events) => this.eventOptions.set(events));
  }

  onEventFilter(eventId: string): void {
    this.store.setFilters({ ...this.store.filters(), eventId });
  }

  /** Búsqueda local por evento, lugar o subtarea; no altera lo que devuelve el servidor. */
  private applyQuery(groups: TodayEventGroup[]): TodayEventGroup[] {
    const term = this.query().trim().toLowerCase();
    if (!term) {
      return groups;
    }
    return groups.filter(
      (group) =>
        group.eventName.toLowerCase().includes(term) ||
        (group.event?.place ?? '').toLowerCase().includes(term) ||
        group.subtasks.some((subtask) => subtask.name.toLowerCase().includes(term))
    );
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  get isEmpty(): boolean {
    return this.overdueEvents().length === 0 && this.todayEvents().length === 0 && this.upcomingEvents().length === 0;
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
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
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
