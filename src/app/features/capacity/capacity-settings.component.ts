import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { runtimeConfig } from '../../core/config/runtime-config';
import { CapacityStore } from './store/capacity.store';
import { CAPACITY_MAX_HOURS, CAPACITY_MIN_HOURS } from './models/capacity.model';

const STEP = 0.5;

@Component({
  selector: 'app-capacity-settings',
  standalone: true,
  imports: [DecimalPipe, MatIconModule],
  templateUrl: './capacity-settings.component.html'
})
export class CapacitySettingsComponent {
  readonly store = inject(CapacityStore);

  readonly min = CAPACITY_MIN_HOURS;
  readonly max = CAPACITY_MAX_HOURS;
  readonly defaultHours = runtimeConfig.defaultDailyLimitHours;
  readonly success = signal(false);

  readonly hours = signal(this.store.dailyLimitHours());
  readonly changed = computed(() => this.hours() !== this.store.dailyLimitHours());

  constructor() {
    this.store.ensureLoaded();
    effect(() => this.hours.set(this.store.dailyLimitHours()), { allowSignalWrites: true });
  }

  adjust(direction: 1 | -1): void {
    this.success.set(false);
    this.hours.update((current) => Math.min(this.max, Math.max(this.min, current + direction * STEP)));
  }

  save(): void {
    this.success.set(false);
    this.store.update(this.hours(), () => this.success.set(true));
  }
}
