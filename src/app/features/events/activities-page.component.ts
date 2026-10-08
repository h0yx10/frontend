import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { formatIsoDateHuman, formatTimeShort } from '../../core/utils/date.util';
import { ProgressBarComponent } from '../../shared/ui/atoms/progress-bar.component';
import { BadgeTone, StatusBadgeComponent } from '../../shared/ui/atoms/status-badge.component';
import { EmptyStateComponent } from '../../shared/ui/molecules/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/molecules/error-state.component';
import { PageHeaderComponent } from '../../shared/ui/molecules/page-header.component';
import { SearchBoxComponent } from '../../shared/ui/molecules/search-box.component';
import { SegmentedControlComponent, SegmentedOption } from '../../shared/ui/molecules/segmented-control.component';
import { EventEntity } from './models/event.model';
import { EventsStore } from './store/events.store';

type TimeFilter = 'all' | 'upcoming' | 'past';

/** Vista "Actividades": lista todas las actividades (eventos) consumiendo GET /api/events. */
@Component({
  selector: 'app-activities-page',
  standalone: true,
  imports: [
    MatIconModule,
    RouterLink,
    ProgressBarComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SearchBoxComponent,
    SegmentedControlComponent
  ],
  providers: [EventsStore],
  templateUrl: './activities-page.component.html'
})
export class ActivitiesPageComponent {
  readonly store = inject(EventsStore);

  readonly timeOptions: readonly SegmentedOption<TimeFilter>[] = [
    { value: 'all', label: 'Todos' },
    { value: 'upcoming', label: 'Próximos' },
    { value: 'past', label: 'Pasados' }
  ];
  readonly query = signal('');
  readonly timeFilter = signal<TimeFilter>('all');

  readonly visibleEvents = computed(() => {
    const term = normalize(this.query());
    const now = Date.now();
    const filter = this.timeFilter();
    return this.store
      .events()
      .filter((event) => {
        const isPast = new Date(event.datetime).getTime() < now;
        if ((filter === 'upcoming' && isPast) || (filter === 'past' && !isPast)) return false;
        return !term || normalize(`${event.name} ${event.place}`).includes(term);
      });
  });

  readonly dateOf = (event: EventEntity) => formatIsoDateHuman(event.datetime.slice(0, 10));
  readonly timeOf = (event: EventEntity) => formatTimeShort(event.datetime);

  constructor() {
    this.store.load();
  }

  /** Sin gestiones → "Sin plan"; todas hechas → "Completado"; el resto está en curso. */
  statusOf(event: EventEntity): { label: string; tone: BadgeTone } {
    const { done, total } = event.progress;
    if (total === 0) return { label: 'Sin plan', tone: 'neutral' };
    if (done === total) return { label: 'Completado', tone: 'success' };
    return { label: 'Pendiente', tone: 'warning' };
  }

  setTimeFilter(value: string): void {
    this.timeFilter.set(value as TimeFilter);
  }
}

function normalize(value: string): string {
  return value.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
