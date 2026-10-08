import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProgressBarComponent } from '../atoms/progress-bar.component';

/** Horas planificadas frente al límite diario, con acceso para ajustarlo. */
@Component({
  selector: 'app-workload-card',
  standalone: true,
  imports: [DecimalPipe, RouterLink, ProgressBarComponent],
  template: `
    <section class="rounded-2xl border border-border bg-surface p-4" [attr.aria-label]="title()">
      <div class="flex items-center justify-between gap-2 text-sm">
        <h2 class="text-muted">{{ title() }}</h2>
        @if (actionLink()) {
          <a [routerLink]="actionLink()" class="font-medium text-accent hover:text-ink">{{ actionLabel() }}</a>
        }
      </div>
      <p class="mt-2 text-ink">
        <span class="text-xl font-bold">{{ planned() | number: '1.0-1' }} h</span>
        <span class="ml-1 text-sm text-muted">de {{ limit() | number: '1.0-1' }} h</span>
      </p>
      <div class="mt-3">
        <app-progress-bar [percentage]="percentage()" [tone]="overloaded() ? 'danger' : 'success'" size="sm"
          [ariaValueText]="planned() + ' de ' + limit() + ' horas'" />
      </div>
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

  readonly percentage = computed(() => (this.limit() > 0 ? (this.planned() / this.limit()) * 100 : 0));
  readonly overloaded = computed(() => this.limit() > 0 && this.planned() > this.limit());
}
