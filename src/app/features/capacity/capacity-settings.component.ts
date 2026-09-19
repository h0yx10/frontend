import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { runtimeConfig } from '../../core/config/runtime-config';
import { CapacityStore } from './store/capacity.store';
import { CAPACITY_MAX_HOURS, CAPACITY_MIN_HOURS } from './models/capacity.model';

@Component({
  selector: 'app-capacity-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './capacity-settings.component.html'
})
export class CapacitySettingsComponent {
  readonly store = inject(CapacityStore);

  readonly min = CAPACITY_MIN_HOURS;
  readonly max = CAPACITY_MAX_HOURS;
  readonly defaultHours = runtimeConfig.defaultDailyLimitHours;
  readonly success = signal(false);

  hours = this.store.dailyLimitHours();

  constructor() {
    this.store.ensureLoaded();
    effect(() => (this.hours = this.store.dailyLimitHours()));
  }

  save(): void {
    this.success.set(false);
    this.store.update(Number(this.hours), () => this.success.set(true));
  }
}
