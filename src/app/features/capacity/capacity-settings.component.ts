import { Component, computed, effect, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { ToastService } from '../../core/feedback/toast.service';
import { WorkloadStore } from '../today/store/workload.store';
import { CapacityStore } from './store/capacity.store';
import { CAPACITY_MAX_HOURS, CAPACITY_MIN_HOURS } from './models/capacity.model';

/**
 * Editor compacto del límite diario (US-12), dentro de la tarjeta "Carga de hoy". Valida el rango y
 * que el nuevo límite no quede por debajo de lo ya planificado hoy; los demás días los valida el
 * backend (409 con los días afectados), cuyo mensaje se muestra tal cual.
 */
@Component({
  selector: 'app-capacity-settings',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  templateUrl: './capacity-settings.component.html'
})
export class CapacitySettingsComponent {
  readonly store = inject(CapacityStore);
  private readonly workload = inject(WorkloadStore);
  private readonly toasts = inject(ToastService);

  readonly min = CAPACITY_MIN_HOURS;
  readonly max = CAPACITY_MAX_HOURS;

  readonly saved = output<void>();

  readonly hours = signal<number | null>(this.store.dailyLimitHours());

  readonly validationError = computed(() => {
    const hours = this.hours();
    if (hours === null || Number.isNaN(hours)) {
      return 'Indica el límite de horas diario.';
    }
    if (hours < this.min || hours > this.max) {
      return `El límite debe estar entre ${this.min} y ${this.max} horas.`;
    }
    const plannedToday = this.workload.plannedHours();
    if (hours < plannedToday) {
      return `Hoy ya tienes ${plannedToday} h planificadas: reprograma o reduce gestiones antes de bajar el límite.`;
    }
    return '';
  });

  readonly changed = computed(() => this.hours() !== this.store.dailyLimitHours());

  constructor() {
    this.store.ensureLoaded();
    effect(() => this.hours.set(this.store.dailyLimitHours()), { allowSignalWrites: true });
  }

  onHoursChange(value: number | null): void {
    this.hours.set(value);
    this.store.error.set('');
  }

  save(): void {
    const hours = this.hours();
    if (hours === null || this.validationError() || !this.changed()) {
      return;
    }
    this.store.update(hours, () => {
      this.toasts.show(`Límite diario actualizado a ${hours} h.`);
      this.saved.emit();
    });
  }
}
