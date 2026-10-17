import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { runtimeConfig } from '../../../core/config/runtime-config';
import { AppHttpError } from '../../../core/interceptors/http-error.interceptor';
import { CapacityService } from '../services/capacity.service';

/** Singleton: la capacidad diaria se muestra y se edita en la tarjeta "Carga de hoy" del sidebar. */
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
  /** Mínimo que aceptó informar el backend al rechazar un límite (409): el día más cargado. */
  readonly minimumLimit = signal<number | null>(null);

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
          this.minimumLimit.set(null);
          onSuccess();
        },
        error: (error: AppHttpError) => {
          this.error.set(error.message);
          if (error.capacityMinimum !== undefined) {
            this.minimumLimit.set(error.capacityMinimum);
          }
        }
      });
  }
}
