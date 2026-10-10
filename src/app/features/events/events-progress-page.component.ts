import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CapacitySettingsComponent } from '../capacity/capacity-settings.component';
import { ProgressRingComponent } from '../../shared/ui/atoms/progress-ring.component';
import { EmptyStateComponent } from '../../shared/ui/molecules/empty-state.component';
import { LoadingStateComponent } from '../../shared/ui/molecules/loading-state.component';
import { ErrorStateComponent } from '../../shared/ui/molecules/error-state.component';
import { PageHeaderComponent } from '../../shared/ui/molecules/page-header.component';
import { SearchBoxComponent } from '../../shared/ui/molecules/search-box.component';
import { EventCardComponent } from './components/event-card.component';
import { EventsStore } from './store/events.store';

@Component({
  selector: 'app-events-progress-page',
  standalone: true,
  imports: [
    LoadingStateComponent,
    RouterLink,
    EventCardComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    ProgressRingComponent,
    SearchBoxComponent,
    CapacitySettingsComponent
  ],
  providers: [EventsStore],
  templateUrl: './events-progress-page.component.html'
})
export class EventsProgressPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly store = inject(EventsStore);

  /** Término de la búsqueda, inicializado desde el parámetro `?q=` si está presente. */
  readonly query = signal(this.route.snapshot.queryParamMap.get('q') ?? '');

  /** El resumen siempre describe todos los eventos; la búsqueda sólo filtra las tarjetas. */
  readonly summary = computed(() => {
    const events = this.store.events();
    const done = events.reduce((total, event) => total + event.progress.done, 0);
    const total = events.reduce((sum, event) => sum + event.progress.total, 0);
    return {
      events: events.length,
      complete: events.filter((event) => event.progress.total > 0 && event.progress.done === event.progress.total).length,
      withoutPlan: events.filter((event) => event.progress.total === 0).length,
      done,
      total,
      percentage: total === 0 ? 0 : Math.round((done / total) * 100)
    };
  });

  readonly visibleEvents = computed(() => {
    const term = normalize(this.query());
    return term ? this.store.events().filter((event) => normalize(event.name).includes(term)) : this.store.events();
  });

  constructor() {
    this.store.load();
  }
}

function normalize(value: string): string {
  return value.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
