import { Component } from '@angular/core';

import { SkeletonComponent } from '../../../shared/ui/atoms/skeleton.component';

/** Silueta del tablero Hoy mientras llega la primera respuesta: misma rejilla, sin saltos al cargar. */
@Component({
  selector: 'app-today-board-skeleton',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <div role="status" aria-live="polite">
      <span class="sr-only">Cargando tus gestiones de hoy…</span>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        @for (stat of stats; track stat) {
          <div class="flex items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4">
            <app-skeleton height="40px" width="32px" />
            <div class="flex flex-1 flex-col gap-2">
              <app-skeleton height="14px" width="60%" radius="6px" />
              <app-skeleton height="10px" width="85%" radius="6px" />
            </div>
          </div>
        }
      </div>

      <div class="mt-5 flex flex-col gap-3 sm:flex-row">
        <app-skeleton class="flex-1" height="44px" radius="12px" />
        <app-skeleton class="sm:!w-60" height="44px" radius="12px" />
      </div>
      <app-skeleton class="mt-3" height="14px" width="45%" radius="6px" />

      <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        @for (column of columns; track column) {
          <div class="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
            <div class="flex items-center gap-2">
              <app-skeleton height="20px" width="20px" radius="6px" />
              <app-skeleton class="flex-1" height="16px" width="45%" radius="6px" />
              <app-skeleton height="24px" width="24px" radius="999px" />
            </div>
            @for (card of column; track $index) {
              <div class="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex flex-1 flex-col gap-2">
                    <app-skeleton height="16px" width="70%" radius="6px" />
                    <app-skeleton height="12px" width="50%" radius="6px" />
                  </div>
                  <app-skeleton height="28px" width="76px" />
                </div>
                <app-skeleton height="34px" />
                @if (card > 1) {
                  <app-skeleton height="34px" />
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class TodayBoardSkeletonComponent {
  readonly stats = [1, 2, 3, 4];
  /** Tarjetas por columna y cuántas gestiones simula cada una. */
  readonly columns = [[1], [2, 1], [1]];
}
