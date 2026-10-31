import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { InfoDialogComponent } from '../../shared/ui/molecules/info-dialog.component';

import { runtimeConfig } from '../../core/config/runtime-config';
import { CapacityStore } from './store/capacity.store';
import { CAPACITY_MAX_HOURS, CAPACITY_MIN_HOURS } from './models/capacity.model';

const STEP = 0.5;

@Component({
  selector: 'app-capacity-settings',
  standalone: true,
  imports: [DecimalPipe, MatIconModule, InfoDialogComponent],
  templateUrl: './capacity-settings.component.html'
})
export class CapacitySettingsComponent {
  readonly store = inject(CapacityStore);

  readonly min = CAPACITY_MIN_HOURS;
  readonly max = CAPACITY_MAX_HOURS;
  readonly defaultHours = runtimeConfig.defaultDailyLimitHours;
  /** Resultado del guardado, mostrado en un modal como en el resto de la app. */
  readonly dialog = signal<{ heading: string; message: string } | null>(null);

  readonly hours = signal(this.store.dailyLimitHours());
  readonly changed = computed(() => this.hours() !== this.store.dailyLimitHours());

  constructor() {
    this.store.ensureLoaded();
    effect(() => this.hours.set(this.store.dailyLimitHours()), { allowSignalWrites: true });
  }

  adjust(direction: 1 | -1): void {
    this.hours.update((current) => Math.min(this.max, Math.max(this.min, current + direction * STEP)));
  }

  /** Al cerrar el modal se descarta el error del guardado: ya se mostró. */
  closeDialog(): void {
    this.dialog.set(null);
    this.store.error.set('');
  }

  save(): void {
    const hours = this.hours();
    this.store.update(
      hours,
      () => this.dialog.set({
        heading: 'Capacidad actualizada',
        message: `Tu capacidad diaria ahora es de ${hours} h por día.`
      }),
      (message) => this.dialog.set({ heading: 'No se pudo guardar la capacidad', message })
    );
  }
}
