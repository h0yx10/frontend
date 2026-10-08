import { Component, input } from '@angular/core';

/** Cabecera de página: sobretítulo opcional, título, subtítulo y acciones proyectadas a la derecha. */
@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        @if (eyebrow()) {
          <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-accent">{{ eyebrow() }}</p>
        }
        <h1 class="text-3xl font-bold tracking-tight text-ink">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="mt-1.5 text-sm text-muted">{{ subtitle() }}</p>
        }
      </div>
      <div class="flex shrink-0 items-center gap-2 empty:hidden"><ng-content /></div>
    </header>
  `,
  styles: `:host { display: block; }`
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly eyebrow = input('');
  readonly subtitle = input('');
}
