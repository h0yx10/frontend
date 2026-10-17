import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProgressBarComponent } from '../atoms/progress-bar.component';
import { SpinnerComponent } from '../atoms/spinner.component';

/** Horas planificadas frente al límite diario, con acceso para ajustarlo. */
@Component({
  selector: 'app-workload-card',
  standalone: true,
  imports: [DecimalPipe, RouterLink, ProgressBarComponent, SpinnerComponent],
  template: `
    <section class="rounded-2xl border border-border bg-surface p-4" [attr.aria-label]="title()">
      <div class="flex items-center justify-between gap-2 text-sm">
        <h2 class="flex items-center gap-2 text-muted">
          {{ title() }}
          @if (loading() && ready()) {
            <app-spinner class="text-muted" [size]="14" label="Actualizando carga" />
          }
        </h2>
        @if (actionLink()) {
          <a [routerLink]="actionLink()" class="font-medium text-accent hover:text-ink">{{ actionLabel() }}</a>
        }
      </div>
      @if (ready()) {
        <p class="mt-2 text-ink">
          <span class="text-xl font-bold">{{ planned() | number: '1.0-1' }} h</span>
          <span class="ml-1 text-sm text-muted">de {{ limit() | number: '1.0-1' }} h</span>
        </p>
        <div class="mt-3">
          <app-progress-bar [percentage]="percentage()" [tone]="overloaded() ? 'danger' : 'success'" size="sm"
            [ariaValueText]="planned() + ' de ' + limit() + ' horas'" />
        </div>
      } @else {
        <div class="mt-2 flex h-11 items-center gap-2 text-sm text-muted">
          <app-spinner class="text-ink" [size]="20" label="" />
          Consultando…
        </div>
      }
    </section>
  `,
  styles: `:host { display: block; }`
})
export class WorkloadCardComponent {
  readonly planned = input.required<number>();
  readonly limit = input.required<number>();
  readonly title = input('Carga de hoy');
  readonly actionLabel = input('Ajustar');
  readonly actionLink = input('/progreso');
  /** Hay una consulta en curso. */
  readonly loading = input(false);
  /** Ya hay datos que mostrar; mientras no, la tarjeta sólo indica que está consultando. */
  readonly ready = input(true);

  readonly percentage = computed(() => (this.limit() > 0 ? (this.planned() / this.limit()) * 100 : 0));
  readonly overloaded = computed(() => this.limit() > 0 && this.planned() > this.limit());
}
