import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { runtimeConfig } from '../../../core/config/runtime-config';
import { CapacityService } from '../services/capacity.service';

/** Singleton: la capacidad diaria se muestra en el sidebar y se edita en /progreso. */
@Injectable({
  providedIn: 'root'
})
export class CapacityStore {
  private readonly service = inject(CapacityService);
  private loaded = false;

  readonly dailyLimitHours = signal(runtimeConfig.defaultDailyLimitHours);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');

  ensureLoaded(): void {
    if (this.loaded) {
      return;
    }
    this.loaded = true;
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.service
      .get()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (capacity) => this.dailyLimitHours.set(capacity.dailyLimitHours),
        error: (error: Error) => this.error.set(error.message)
      });
  }

  update(hours: number, onSuccess: () => void): void {
    this.saving.set(true);
    this.error.set('');

    this.service
      .update({ dailyLimitHours: hours })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (capacity) => {
          this.dailyLimitHours.set(capacity.dailyLimitHours);
          onSuccess();
        },
        error: (error: Error) => this.error.set(error.message)
      });
  }
}
