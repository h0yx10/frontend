import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { finalize, Subscription } from 'rxjs';

import { EventEntity } from '../models/event.model';
import { EventsService } from '../services/events.service';

@Injectable()
export class EventsStore implements OnDestroy {
  private readonly service = inject(EventsService);
  private loadSubscription?: Subscription;

  readonly events = signal<EventEntity[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly count = computed(() => this.events().length);

  load(query = ''): void {
    this.loadSubscription?.unsubscribe();
    this.loading.set(true);
    this.error.set('');

    this.loadSubscription = this.service
      .list(query)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (events) => this.events.set(events),
        error: (error: Error) => this.error.set(error.message)
      });
  }

  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
