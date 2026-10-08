import { inject, Injectable, signal } from '@angular/core';

import { TodayService } from '../services/today.service';

/**
 * Resumen de carga diaria para el shell (contador de "Hoy" y horas planificadas).
 * Es un singleton: la pantalla Hoy lo actualiza con su tablero y el shell lo refresca al navegar.
 */
@Injectable({ providedIn: 'root' })
export class WorkloadStore {
  private readonly service = inject(TodayService);

  readonly plannedHours = signal(0);
  /** Gestiones vencidas más las que vencen hoy: lo que pide acción ahora. */
  readonly attentionCount = signal(0);
  readonly overdueCount = signal(0);

  refresh(): void {
    this.service.loadWorkload().subscribe({
      next: (workload) => this.apply(workload),
      error: () => undefined // Decorativo: si falla, se conserva el último valor sin molestar al usuario.
    });
  }

  apply(workload: { plannedHours: number; overdueCount: number; todayCount: number }): void {
    this.plannedHours.set(workload.plannedHours);
    this.overdueCount.set(workload.overdueCount);
    this.attentionCount.set(workload.overdueCount + workload.todayCount);
  }
}
