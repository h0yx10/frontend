import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { CapacitySettingsComponent } from '../capacity/capacity-settings.component';
import { EmptyStateComponent } from '../../shared/ui/molecules/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/molecules/error-state.component';
import { EventCardComponent } from './components/event-card.component';
import { EventsStore } from './store/events.store';

@Component({
  selector: 'app-events-progress-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    EventCardComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    CapacitySettingsComponent
  ],
  providers: [EventsStore],
  templateUrl: './events-progress-page.component.html'
})
export class EventsProgressPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly searchTerms = new Subject<string>();

  readonly store = inject(EventsStore);

  query = '';

  constructor() {
    this.query = this.route.snapshot.queryParamMap.get('q') ?? '';
    this.store.load(this.query);

    this.searchTerms
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => this.store.load(query));
  }

  onQueryChange(query: string): void {
    this.searchTerms.next(query.trim());
  }
}
